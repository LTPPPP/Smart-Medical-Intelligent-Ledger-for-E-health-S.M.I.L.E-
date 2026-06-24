from __future__ import annotations

import asyncio
from copy import deepcopy
from dataclasses import dataclass, replace
from typing import Any

from .schemas import AgentCommand, FlowName


MUTATION_FLOWS = {FlowName.BOOKING, FlowName.CANCEL, FlowName.RESCHEDULE}
SUPPORTED_FLOWS = MUTATION_FLOWS | {FlowName.LOOKUP}


@dataclass(frozen=True)
class ConversationState:
    session_id: str
    patient_id: str | None
    active_flow: FlowName
    slots: dict[str, Any]


@dataclass(frozen=True)
class ConversationResolution:
    command: AgentCommand
    slots: dict[str, Any]
    abort: bool = False
    switch: bool = False


def reduce_conversation(
    current: ConversationState | None,
    command: AgentCommand,
) -> ConversationResolution:
    current_slots = _slots_from_command(command)
    if command.dialogue_act == "abort":
        return ConversationResolution(command=command, slots={}, abort=True)

    explicit_flow = command.intent in SUPPORTED_FLOWS
    active_mutation = current is not None and current.active_flow in MUTATION_FLOWS
    if command.dialogue_act == "correct" and active_mutation:
        merged = deepcopy(current.slots)
        merged.update(current_slots)
        return ConversationResolution(
            command=command.model_copy(update={"intent": current.active_flow}),
            slots=merged,
        )
    if active_mutation and command.intent == FlowName.UNKNOWN and current_slots:
        merged = deepcopy(current.slots)
        merged.update(current_slots)
        return ConversationResolution(
            command=command.model_copy(update={"intent": current.active_flow}),
            slots=merged,
        )
    if active_mutation and command.intent == current.active_flow and current_slots:
        merged = deepcopy(current.slots)
        merged.update(current_slots)
        return ConversationResolution(command=command, slots=merged)

    switched = bool(
        current
        and explicit_flow
        and (command.dialogue_act == "switch" or command.intent != current.active_flow)
    )
    return ConversationResolution(command=command, slots=current_slots, switch=switched)


def _slots_from_command(command: AgentCommand) -> dict[str, Any]:
    slots = {update.name: update.value for update in command.slot_updates}
    if command.constraints:
        slots["constraints"] = list(command.constraints)
    if command.preferences:
        slots["preferences"] = list(command.preferences)
    if command.negations:
        slots["negations"] = list(command.negations)
    return slots


class InMemoryConversationStateStore:
    def __init__(self) -> None:
        self._states: dict[str, ConversationState] = {}
        self._lock = asyncio.Lock()

    async def load(
        self,
        session_id: str,
        patient_id: str | None,
    ) -> ConversationState | None:
        async with self._lock:
            state = self._states.get(session_id)
            if state is None or state.patient_id != patient_id:
                return None
            return replace(state, slots=deepcopy(state.slots))

    async def save(self, state: ConversationState) -> None:
        async with self._lock:
            self._states[state.session_id] = replace(state, slots=deepcopy(state.slots))

    async def clear(self, session_id: str, patient_id: str | None) -> None:
        async with self._lock:
            state = self._states.get(session_id)
            if state is not None and state.patient_id == patient_id:
                self._states.pop(session_id, None)
