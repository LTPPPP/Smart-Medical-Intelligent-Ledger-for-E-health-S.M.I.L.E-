from __future__ import annotations

import pytest

from src.conversation_state import (
    ConversationState,
    InMemoryConversationStateStore,
    reduce_conversation,
)
from src.schemas import AgentCommand, FlowName, SlotUpdate


def _state(*, flow: FlowName = FlowName.BOOKING) -> ConversationState:
    return ConversationState(
        session_id="session-1",
        patient_id="patient-1",
        active_flow=flow,
        slots={"date_hint": "Monday", "time_hint": "15:00"},
    )


def test_correction_inherits_active_flow_and_replaces_only_supplied_slots():
    command = AgentCommand(
        intent=FlowName.UNKNOWN,
        dialogue_act="correct",
        slot_updates=[SlotUpdate(name="time_hint", value="16:00")],
    )

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.BOOKING
    assert result.slots == {"date_hint": "Monday", "time_hint": "16:00"}
    assert result.abort is False
    assert result.switch is False


def test_booking_follow_up_inherits_active_flow_and_merges_slots():
    command = AgentCommand(
        intent=FlowName.UNKNOWN,
        dialogue_act="inform",
        slot_updates=[
            SlotUpdate(name="service_hint", value="exam checking"),
            SlotUpdate(name="time_hint", value="morning"),
        ],
    )

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.BOOKING
    assert result.slots == {
        "date_hint": "Monday",
        "time_hint": "morning",
        "service_hint": "exam checking",
    }
    assert result.switch is False


def test_same_booking_flow_follow_up_merges_with_existing_slots():
    command = AgentCommand(
        intent=FlowName.BOOKING,
        dialogue_act="clarify",
        slot_updates=[
            SlotUpdate(name="time_hint", value="between 12pm and 4pm"),
            SlotUpdate(name="doctor_hint", value="any doctor"),
        ],
    )

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.BOOKING
    assert result.slots == {
        "date_hint": "Monday",
        "time_hint": "between 12pm and 4pm",
        "doctor_hint": "any doctor",
    }
    assert result.switch is False


def test_same_booking_flow_follow_up_merges_constraints_without_slot_updates():
    command = AgentCommand(
        intent=FlowName.BOOKING,
        dialogue_act="request",
        constraints=["between 12pm and 4pm"],
        preferences=["any doctor"],
    )

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.BOOKING
    assert result.slots == {
        "date_hint": "Monday",
        "time_hint": "15:00",
        "constraints": ["between 12pm and 4pm"],
        "preferences": ["any doctor"],
    }
    assert result.switch is False


def test_explicit_switch_uses_only_current_turn_slots():
    command = AgentCommand(
        intent=FlowName.CANCEL,
        dialogue_act="switch",
        slot_updates=[SlotUpdate(name="appointment_ref", value="APT-002")],
    )

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.CANCEL
    assert result.slots == {"appointment_ref": "APT-002"}
    assert result.switch is True


def test_different_explicit_intent_is_a_switch_without_dialogue_act():
    command = AgentCommand(
        intent=FlowName.RESCHEDULE,
        slot_updates=[SlotUpdate(name="appointment_ref", value="APT-003")],
    )

    result = reduce_conversation(_state(), command)

    assert result.slots == {"appointment_ref": "APT-003"}
    assert result.switch is True


def test_lookup_is_an_explicit_switch_from_active_mutation():
    command = AgentCommand(intent=FlowName.LOOKUP)

    result = reduce_conversation(_state(), command)

    assert result.command.intent == FlowName.LOOKUP
    assert result.slots == {}
    assert result.switch is True


def test_abort_is_terminal_and_does_not_retain_slots():
    command = AgentCommand(intent=FlowName.UNKNOWN, dialogue_act="abort")

    result = reduce_conversation(_state(flow=FlowName.CANCEL), command)

    assert result.abort is True
    assert result.slots == {}
    assert result.command.intent == FlowName.UNKNOWN


def test_correction_without_active_state_does_not_inherit_a_flow():
    command = AgentCommand(
        intent=FlowName.UNKNOWN,
        dialogue_act="correct",
        slot_updates=[SlotUpdate(name="time_hint", value="16:00")],
    )

    result = reduce_conversation(None, command)

    assert result.command.intent == FlowName.UNKNOWN
    assert result.slots == {"time_hint": "16:00"}


@pytest.mark.asyncio
async def test_store_is_patient_scoped_and_returns_deep_copies():
    store = InMemoryConversationStateStore()
    state = _state()
    await store.save(state)

    assert await store.load("session-1", "patient-2") is None
    loaded = await store.load("session-1", "patient-1")
    assert loaded is not None
    loaded.slots["time_hint"] = "17:00"

    loaded_again = await store.load("session-1", "patient-1")
    assert loaded_again is not None
    assert loaded_again.slots["time_hint"] == "15:00"

    await store.clear("session-1", "patient-1")
    assert await store.load("session-1", "patient-1") is None
