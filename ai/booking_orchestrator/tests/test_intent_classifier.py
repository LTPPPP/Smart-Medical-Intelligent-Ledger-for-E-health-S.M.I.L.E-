from src.agent.intent_classifier import IntentClassification, LLMIntentClassifier


class RecordingClassifierLLM:
    def __init__(self):
        self.messages = []

    def chat(self, messages, tools, tool_choice=None):
        self.messages = messages
        return {
            "choices": [
                {
                    "message": {
                        "content": (
                            '{"intent":"info","confidence":0.9,'
                            '"requires_clinical_triage":false,"reason":"clinic hours"}'
                        )
                    }
                }
            ]
        }

    def parse_tool_call(self, response):
        return None


def test_classifier_treats_triage_required_payload_as_safety_when_label_is_invalid():
    result = LLMIntentClassifier._parse_classification_payload(
        {
            "intent": "info|service",
            "confidence": 0.9,
            "requires_clinical_triage": True,
            "reason": "nguoi_dung_mo_ta_kho_chiu_o_nuou",
        }
    )

    assert result.intent == "safety"
    assert result.confidence == 0.9
    assert result.requires_clinical_triage is True


def test_classifier_keeps_explicit_out_of_scope_intent():
    result = LLMIntentClassifier._parse_classification_payload(
        {
            "intent": "out_of_scope",
            "confidence": 0.92,
            "requires_clinical_triage": False,
            "reason": "unsupported capability",
        }
    )

    assert result.intent == "out_of_scope"
    assert result.requires_clinical_triage is False


def test_classifier_prompt_does_not_invite_union_label_outputs():
    prompt = LLMIntentClassifier._system_prompt()

    assert "info|service" not in prompt
    assert "Chỉ chọn một intent" in prompt


def test_classifier_contract_does_not_encode_subject_ontology():
    prompt = LLMIntentClassifier._system_prompt()

    assert "subject" not in IntentClassification.model_fields
    assert '"subject"' not in prompt
    for forbidden in [
        "non_" + "hu" + "man",
        "hu" + "man",
        "ani" + "mal",
        "p" + "et",
        "obj" + "ect",
    ]:
        assert forbidden not in prompt


def test_classifier_does_not_send_patient_pii_to_llm():
    llm = RecordingClassifierLLM()
    classifier = LLMIntentClassifier(llm)

    classifier.classify(
        "phòng khám mở cửa lúc mấy giờ",
        {
            "active_intent": "booking",
            "patient": {
                "full_name": "Tran Dai Nhan",
                "phone": "0900000000",
                "email": "nhantd.dev@gmail.com",
            },
        },
    )

    user_content = llm.messages[-1]["content"]
    assert "phòng khám mở cửa lúc mấy giờ" in user_content
    assert "Tran Dai Nhan" not in user_content
    assert "0900000000" not in user_content
    assert "nhantd.dev@gmail.com" not in user_content
