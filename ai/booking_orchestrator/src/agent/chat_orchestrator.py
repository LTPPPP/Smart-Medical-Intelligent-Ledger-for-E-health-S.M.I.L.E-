import json
from typing import Any

from src.agent.tool_router import ToolProfile, ToolProfileSelector
from src.llm.client import LLMClient
from src.schemas.chat import ChatRequest, ChatResponse
from src.tools.executor import ToolExecutor
from src.tools.schemas import ToolOutput, openai_tool_definitions


class ChatOrchestrator:
    def __init__(
        self,
        tool_executor: ToolExecutor,
        profile_selector: ToolProfileSelector | None = None,
        llm_client: LLMClient | None = None,
        llm_enabled: bool = False,
    ) -> None:
        self.tool_executor = tool_executor
        self.profile_selector = profile_selector or ToolProfileSelector()
        self.llm_client = llm_client
        self.llm_enabled = llm_enabled

    def process(self, request: ChatRequest) -> ChatResponse:
        selection = self.profile_selector.select_profile(
            latest_user_message=request.message,
            conversation_state=request.conversation_state,
        )
        tool_definitions = openai_tool_definitions(selection.tools)
        metadata: dict[str, Any] = {
            "tool_schemas": tool_definitions,
            "matched_keywords": selection.matched_keywords,
            "routing": selection.routing.model_dump(),
            "llm": {"used": False},
        }

        if self.llm_enabled and self.llm_client is not None:
            llm_response = self.llm_client.chat(
                messages=[
                    {
                        "role": "system",
                        "content": self._system_prompt(selection.tools),
                    },
                    {
                        "role": "system",
                        "content": self._state_prompt(
                            request.conversation_state,
                            metadata["routing"],
                        ),
                    },
                    {"role": "user", "content": request.message},
                ],
                tools=tool_definitions,
                tool_choice="auto",
            )
            tool_call = self.llm_client.parse_tool_call(llm_response)
            metadata["llm"] = {"used": True, "tool_call": tool_call}
            if tool_call:
                metadata["tool_result"] = self._execute_allowed_tool(
                    tool_call=tool_call,
                    allowed_tools=selection.tools,
                ).model_dump()

        if selection.profile == ToolProfile.SAFETY:
            risk = self.tool_executor.execute(
                "classify_medical_risk", {"message": request.message}
            )
            summary = self.tool_executor.execute(
                "summarize_for_dentist", {"message": request.message}
            )
            metadata["risk"] = risk.model_dump()
            metadata["dentist_summary"] = summary.model_dump()
            assistant_response = (
                "Your message may need urgent clinic review. I can help notify clinic "
                "staff, but this chatbot cannot diagnose or prescribe medication."
            )
        else:
            assistant_response = (
                "I can help with dental appointment scheduling. I will only use "
                "validated backend tools before changing appointment data."
            )

        return ChatResponse(
            session_id=request.session_id,
            assistant_response=assistant_response,
            selected_profile=selection.profile.value,
            exposed_tools=selection.tools,
            metadata=metadata,
        )

    def _execute_allowed_tool(
        self, tool_call: dict[str, Any], allowed_tools: list[str]
    ) -> ToolOutput:
        tool_name = tool_call.get("name")
        if tool_name not in allowed_tools:
            return ToolOutput(
                success=False,
                error_code="TOOL_NOT_ALLOWED",
                message="The LLM requested a tool outside the selected profile.",
                recommended_action="RETRY_WITH_SELECTED_PROFILE_TOOLS",
                details={"requested_tool": tool_name, "allowed_tools": allowed_tools},
            )
        arguments = tool_call.get("arguments") or {}
        return self.tool_executor.execute(tool_name, arguments)

    @staticmethod
    def _system_prompt(tool_names: list[str]) -> str:
        return (
            "You are an appointment scheduling assistant. The LLM is not trusted "
            "to mutate data directly. Choose only one exposed backend tool when "
            f"needed. Exposed tools: {', '.join(tool_names)}. Never invent UUIDs "
            "or internal IDs; set unknown optional IDs to null or omit them. Use "
            "YYYY-MM-DD for dates. For an initial booking request, call "
            "get_available_slots or get_services first. Do not call hold_slot "
            "without a backend slot_id. Do not call confirm_booking without a "
            "backend hold_id and complete patient details."
        )

    @staticmethod
    def _state_prompt(conversation_state: dict[str, Any], routing: dict[str, Any]) -> str:
        payload = {
            "conversation_state": conversation_state,
            "routing": routing,
        }
        return (
            "Use this trusted context for resolving follow-up references. "
            "Do not invent values not present here: "
            f"{json.dumps(payload, ensure_ascii=False, sort_keys=True)}"
        )
