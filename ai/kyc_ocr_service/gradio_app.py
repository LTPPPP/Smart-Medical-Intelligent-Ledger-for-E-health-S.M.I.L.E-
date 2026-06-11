from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

import gradio as gr
from PIL import Image

from src.service import CccdOcrService


os.environ.setdefault(
    "KYC_OCR_DEBUG_OVERLAY_DIR",
    str(Path.cwd() / ".debug" / "gradio-ocr-boxes"),
)

SERVICE = CccdOcrService()


def analyze_cccd(
    front_image: Any,
    back_image: Any,
    expected_id_number: str,
    expected_date_of_birth: str,
):
    if front_image is None:
        raise gr.Error("Upload hoặc chụp mặt trước CCCD trước nhé.")

    with tempfile.TemporaryDirectory(prefix="smile-gradio-cccd-") as temp_dir:
        front_path = _save_image(front_image, Path(temp_dir) / "front.jpg")
        back_path = _save_image(back_image, Path(temp_dir) / "back.jpg") if back_image is not None else None
        result = SERVICE.analyze_document(
            front_path,
            back_path,
            expected_id_number=expected_id_number.strip() or None,
            expected_date_of_birth=expected_date_of_birth.strip() or None,
        )

    payload = result.model_dump(mode="json")
    front = payload["front"]
    back = payload.get("back")
    return (
        _summary_markdown(payload),
        _fields_table(front, back),
        _checks_table(payload),
        _read_overlay(front.get("debug_overlay_path")),
        _read_overlay(back.get("debug_overlay_path") if back else None),
        _safe_json(payload),
    )


def _save_image(image: Any, target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(image, str | os.PathLike):
        source = Image.open(image)
    elif isinstance(image, Image.Image):
        source = image
    else:
        source = Image.fromarray(image)
    source.convert("RGB").save(target, quality=95)
    return target


def _summary_markdown(payload: dict[str, Any]) -> str:
    front = payload["front"]
    back = payload.get("back")
    front_fields = front.get("fields", {})
    back_fields = back.get("fields", {}) if back else {}
    rows = [
        f"**Document risk:** `{payload.get('risk_level')}`",
        f"**Front side:** `{front_fields.get('side')}`",
        f"**Back side:** `{back_fields.get('side', 'NOT_PROVIDED')}`",
        f"**Front/back ID match:** `{payload.get('checks', {}).get('FRONT_BACK_ID_MATCH', {}).get('status', 'N/A')}`",
    ]
    return "\n\n".join(rows)


def _fields_table(front: dict[str, Any], back: dict[str, Any] | None):
    front_fields = front.get("fields", {})
    back_fields = back.get("fields", {}) if back else {}
    rows = []
    for field in (
        "document_type",
        "side",
        "id_number",
        "full_name",
        "date_of_birth",
        "issue_date",
        "place_of_origin",
        "place_of_residence",
    ):
        rows.append(
            [
                field,
                _mask_sensitive(field, front_fields.get(field)),
                _mask_sensitive(field, back_fields.get(field)),
            ],
        )
    return rows


def _checks_table(payload: dict[str, Any]):
    rows = []
    for scope in ("front", "back"):
        item = payload.get(scope)
        if not item:
            continue
        for name, check in item.get("checks", {}).items():
            rows.append([scope, name, check.get("status"), check.get("message"), _safe_value(name, check.get("value"))])
    for name, check in payload.get("checks", {}).items():
        rows.append(["document", name, check.get("status"), check.get("message"), _safe_value(name, check.get("value"))])
    return rows


def _read_overlay(path: str | None):
    if not path:
        return None
    overlay = Path(path)
    return str(overlay) if overlay.exists() else None


def _safe_json(payload: dict[str, Any]) -> str:
    sanitized = json.loads(json.dumps(payload, ensure_ascii=False))
    for side in ("front", "back"):
        if not sanitized.get(side):
            continue
        sanitized[side]["raw_text"] = "[hidden in demo JSON]"
        fields = sanitized[side].get("fields", {})
        for key, value in list(fields.items()):
            fields[key] = _mask_sensitive(key, value)
    return json.dumps(sanitized, ensure_ascii=False, indent=2)


def _safe_value(name: str, value: Any) -> Any:
    if value is None:
        return None
    if "ID" in name:
        return _mask_sensitive("id_number", value)
    return value


def _mask_sensitive(field: str, value: Any) -> Any:
    if value is None:
        return None
    text = str(value)
    if field == "id_number" and len(text) >= 4:
        return "*" * max(len(text) - 4, 0) + text[-4:]
    return text


with gr.Blocks(title="S.M.I.L.E KYC OCR Lab") as demo:
    gr.Markdown("# S.M.I.L.E KYC OCR Lab")
    gr.Markdown("Upload hoặc chụp CCCD để test parser, quality checks và overlay bbox.")
    with gr.Row():
        front_input = gr.Image(
            label="ID Front",
            sources=["upload", "webcam", "clipboard"],
            type="pil",
            height=320,
        )
        back_input = gr.Image(
            label="ID Back",
            sources=["upload", "webcam", "clipboard"],
            type="pil",
            height=320,
        )
    with gr.Row():
        expected_id = gr.Textbox(label="Expected ID number", placeholder="Optional")
        expected_dob = gr.Textbox(label="Expected DOB", placeholder="YYYY-MM-DD hoặc DD/MM/YYYY")
    run_button = gr.Button("Analyze CCCD", variant="primary")
    summary = gr.Markdown(label="Summary")
    fields = gr.Dataframe(
        headers=["Field", "Front", "Back"],
        datatype=["str", "str", "str"],
        label="Extracted Fields",
        interactive=False,
    )
    checks = gr.Dataframe(
        headers=["Scope", "Check", "Status", "Message", "Value"],
        datatype=["str", "str", "str", "str", "str"],
        label="Checks",
        interactive=False,
    )
    with gr.Row():
        front_overlay = gr.Image(label="Front OCR Box Overlay", type="filepath", height=360)
        back_overlay = gr.Image(label="Back OCR Box Overlay", type="filepath", height=360)
    raw_json = gr.Code(label="Sanitized JSON", language="json")

    run_button.click(
        fn=analyze_cccd,
        inputs=[front_input, back_input, expected_id, expected_dob],
        outputs=[summary, fields, checks, front_overlay, back_overlay, raw_json],
    )


if __name__ == "__main__":
    demo.queue(default_concurrency_limit=1).launch(
        server_name=os.getenv("GRADIO_SERVER_NAME", "127.0.0.1"),
        server_port=int(os.getenv("GRADIO_SERVER_PORT", "7860")),
        share=os.getenv("GRADIO_SHARE", "false").lower() == "true",
    )
