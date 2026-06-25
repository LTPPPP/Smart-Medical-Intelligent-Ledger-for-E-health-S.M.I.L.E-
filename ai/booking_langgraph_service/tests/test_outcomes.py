import pytest

from src.outcomes import OutcomeCode, TurnOutcome, fallback_reply
from src.schemas import FlowName


@pytest.mark.parametrize("code", list(OutcomeCode))
def test_every_outcome_has_an_english_fallback(code: OutcomeCode):
    reply = fallback_reply(TurnOutcome(code=code, flow=FlowName.UNKNOWN))

    assert reply.strip()
    assert not any(token in reply for token in ("Tôi", "Bạn", "lịch hẹn"))


def test_outcome_rejects_unknown_raw_payload_fields():
    with pytest.raises(ValueError):
        TurnOutcome(code=OutcomeCode.CONVERSATIONAL, flow=FlowName.UNKNOWN, raw_payload={"secret": "x"})


def test_conversational_fallbacks_are_contextual_without_capability_list():
    social = fallback_reply(TurnOutcome(code=OutcomeCode.CONVERSATIONAL, flow=FlowName.CONVERSATIONAL))
    abuse = fallback_reply(
        TurnOutcome(code=OutcomeCode.CONVERSATIONAL, flow=FlowName.CONVERSATIONAL, dialogue_act="abuse")
    )

    assert "booking, rescheduling" not in social.lower()
    assert "sweet" not in social.lower()
    assert "love" not in social.lower()
    assert "frustrating" not in abuse.lower()
    assert "appointment" in abuse.lower()
