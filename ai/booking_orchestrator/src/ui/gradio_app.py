import argparse
import json
import os
from copy import deepcopy
from typing import Any

import httpx


DEFAULT_API_BASE_URL = "http://127.0.0.1:7777"
DEFAULT_SESSION_ID = "nhan-dev-session"
DEFAULT_ACTOR_ID = "50000000-0000-0000-0000-000000000001"
SAMPLE_SLOT_ID = "10000000-0000-0000-0000-000000000001"
SAMPLE_HOLD_ID = "20000000-0000-0000-0000-000000000001"
SAMPLE_SERVICE_ID = "30000000-0000-0000-0000-000000000001"
SAMPLE_APPOINTMENT_ID = "40000000-0000-0000-0000-000000000001"
SAMPLE_CLINIC_ID = "60000000-0000-0000-0000-000000000001"

DEFAULT_USER_STATE: dict[str, Any] = {
    "patient_session_id": DEFAULT_SESSION_ID,
    "changed_by": DEFAULT_ACTOR_ID,
    "cancelled_by": DEFAULT_ACTOR_ID,
    "patient": {
        "full_name": "Tran Dai Nhan",
        "phone": "0900000000",
        "email": "nhantd.dev@gmail.com",
    },
}


def default_state() -> dict[str, Any]:
    return deepcopy(DEFAULT_USER_STATE)


def default_state_json() -> str:
    return to_pretty_json(default_state())


def selected_slot_state_json() -> str:
    state = default_state()
    state.update(
        {
            "active_intent": "booking",
            "selected_slot_id": SAMPLE_SLOT_ID,
            "service_id": SAMPLE_SERVICE_ID,
        }
    )
    return to_pretty_json(state)


def confirm_ready_state_json() -> str:
    state = default_state()
    state.update(
        {
            "active_intent": "booking",
            "hold_id": SAMPLE_HOLD_ID,
            "service_id": SAMPLE_SERVICE_ID,
        }
    )
    return to_pretty_json(state)


def reschedule_ready_state_json() -> str:
    state = default_state()
    state.update(
        {
            "active_intent": "reschedule",
            "appointment_id": SAMPLE_APPOINTMENT_ID,
            "hold_id": SAMPLE_HOLD_ID,
        }
    )
    return to_pretty_json(state)


def waitlist_ready_state_json() -> str:
    state = default_state()
    state.update(
        {
            "active_intent": "waitlist",
            "clinic_id": SAMPLE_CLINIC_ID,
            "service_id": SAMPLE_SERVICE_ID,
            "preferred_date": "2026-06-15",
        }
    )
    return to_pretty_json(state)


def parse_state_json(state_json: str) -> dict[str, Any]:
    if not state_json.strip():
        return {}
    parsed = json.loads(state_json)
    if not isinstance(parsed, dict):
        raise ValueError("conversation_state must be a JSON object")
    return parsed


def build_chat_payload(
    session_id: str,
    message: str,
    state_json: str,
) -> dict[str, Any]:
    return {
        "session_id": session_id.strip() or DEFAULT_SESSION_ID,
        "message": message,
        "conversation_state": parse_state_json(state_json),
    }


def merge_state_update(
    current_state: dict[str, Any],
    response: dict[str, Any],
) -> dict[str, Any]:
    merged = deepcopy(current_state)
    routing = (response.get("metadata") or {}).get("routing") or {}
    state_update = routing.get("state_update") or {}
    if isinstance(state_update, dict):
        merged.update(state_update)
    return merged


def to_pretty_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)


def call_chat_api(
    api_base_url: str,
    session_id: str,
    message: str,
    state_json: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    payload = build_chat_payload(session_id, message, state_json)
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{api_base_url.rstrip('/')}/chat",
            json=payload,
        )
        response.raise_for_status()
        return payload, response.json()


def format_assistant_message(response: dict[str, Any]) -> str:
    routing = (response.get("metadata") or {}).get("routing") or {}
    lines = [response.get("assistant_response") or ""]
    if response.get("selected_profile"):
        lines.append(f"\nProfile: `{response['selected_profile']}`")
    if routing.get("pending_action"):
        lines.append(f"Pending action: `{routing['pending_action']}`")
    missing_fields = routing.get("missing_fields") or []
    if missing_fields:
        lines.append(f"Missing fields: `{', '.join(missing_fields)}`")
    return "\n".join(line for line in lines if line)


def make_chat_handler():
    def chat(
        message: str,
        history: list[tuple[str, str]],
        api_base_url: str,
        session_id: str,
        state_json: str,
    ):
        if not message.strip():
            return history, state_json, "", "", "", "Message is empty."
        try:
            payload, response = call_chat_api(
                api_base_url=api_base_url,
                session_id=session_id,
                message=message,
                state_json=state_json,
            )
            current_state = payload["conversation_state"]
            next_state = merge_state_update(current_state, response)
            updated_history = history + [(message, format_assistant_message(response))]
            metadata = response.get("metadata") or {}
            routing = metadata.get("routing") or {}
            return (
                updated_history,
                to_pretty_json(next_state),
                to_pretty_json(routing),
                to_pretty_json(response.get("exposed_tools") or []),
                to_pretty_json(response),
                "OK",
            )
        except Exception as exc:
            return history, state_json, "", "", "", f"{type(exc).__name__}: {exc}"

    return chat


def create_demo(default_api_base_url: str | None = None):
    import gradio as gr

    api_base_url = default_api_base_url or os.getenv(
        "BOOKING_ORCHESTRATOR_URL",
        DEFAULT_API_BASE_URL,
    )

    with gr.Blocks(title="S.M.I.L.E Booking Router Test UI") as demo:
        gr.Markdown("# S.M.I.L.E Booking Router Test UI")
        with gr.Row():
            with gr.Column(scale=2):
                chatbot = gr.Chatbot(label="Conversation", height=460)
                message = gr.Textbox(
                    label="Message",
                    placeholder="Tôi muốn đặt lịch cạo vôi răng ngày mai",
                    lines=2,
                )
                with gr.Row():
                    send = gr.Button("Send", variant="primary")
                    clear = gr.Button("Clear")
            with gr.Column(scale=1):
                api_input = gr.Textbox(label="AI API URL", value=api_base_url)
                session_input = gr.Textbox(label="Session ID", value=DEFAULT_SESSION_ID)
                state_input = gr.Textbox(
                    label="conversation_state",
                    value=default_state_json(),
                    lines=18,
                )
                status = gr.Textbox(label="Status", interactive=False)

        with gr.Row():
            gr.Button("Booking").click(
                lambda: "Tôi muốn đặt lịch cạo vôi răng ngày mai",
                outputs=message,
            )
            gr.Button("Hold slot").click(lambda: "Giữ slot đó giúp tôi", outputs=message)
            gr.Button("Confirm").click(lambda: "Xác nhận lịch giúp tôi", outputs=message)
            gr.Button("Safety").click(
                lambda: "Tôi có triệu chứng khó chịu và cần nhân viên phòng khám xem xét",
                outputs=message,
            )

        with gr.Row():
            gr.Button("Default user").click(default_state_json, outputs=state_input)
            gr.Button("Selected slot").click(selected_slot_state_json, outputs=state_input)
            gr.Button("Ready confirm").click(confirm_ready_state_json, outputs=state_input)
            gr.Button("Ready reschedule").click(reschedule_ready_state_json, outputs=state_input)
            gr.Button("Ready waitlist").click(waitlist_ready_state_json, outputs=state_input)

        with gr.Row():
            routing_output = gr.Textbox(label="metadata.routing", lines=14)
            tools_output = gr.Textbox(label="exposed_tools", lines=14)
        raw_output = gr.Textbox(label="Raw /chat response", lines=18)

        chat_handler = make_chat_handler()
        send.click(
            chat_handler,
            inputs=[message, chatbot, api_input, session_input, state_input],
            outputs=[chatbot, state_input, routing_output, tools_output, raw_output, status],
        ).then(lambda: "", outputs=message)
        message.submit(
            chat_handler,
            inputs=[message, chatbot, api_input, session_input, state_input],
            outputs=[chatbot, state_input, routing_output, tools_output, raw_output, status],
        ).then(lambda: "", outputs=message)
        clear.click(
            lambda: ([], default_state_json(), "", "", "", "Reset."),
            outputs=[chatbot, state_input, routing_output, tools_output, raw_output, status],
        )

    return demo


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-base-url", default=None)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7860)
    parser.add_argument("--share", action="store_true")
    args = parser.parse_args()

    demo = create_demo(default_api_base_url=args.api_base_url)
    demo.queue().launch(
        server_name=args.host,
        server_port=args.port,
        share=args.share,
    )


if __name__ == "__main__":
    main()
