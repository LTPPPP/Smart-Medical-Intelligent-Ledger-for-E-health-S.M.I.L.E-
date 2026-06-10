from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from .field_crops import FieldCrop
from .schemas import CccdFields, LayoutContext, VlmExtractionResult


class VlmFieldExtractor:
    provider = "openai-compatible"

    def __init__(
        self,
        base_url: str,
        model: str,
        api_key: str | None = None,
        timeout_seconds: float = 30.0,
    ):
        self.base_url = base_url
        self.model = model
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    @classmethod
    def from_env(cls) -> "VlmFieldExtractor | None":
        if os.getenv("KYC_VLM_ENABLED", "false").lower() != "true":
            return None
        base_url = os.getenv("KYC_VLM_BASE_URL")
        model = os.getenv("KYC_VLM_MODEL")
        if not base_url or not model:
            return None
        timeout = float(os.getenv("KYC_VLM_TIMEOUT_SECONDS", "30"))
        return cls(
            base_url=base_url,
            model=model,
            api_key=os.getenv("KYC_VLM_API_KEY"),
            timeout_seconds=timeout,
        )

    def extract(
        self,
        image_path: Path,
        *,
        side_hint: str,
        layout: LayoutContext,
        raw_text: str,
    ) -> VlmExtractionResult:
        prompt = _build_prompt(side_hint=side_hint, layout=layout, raw_text=raw_text)
        return self._extract_from_images(prompt, [image_path])

    def extract_fields_from_crops(
        self,
        image_path: Path,
        *,
        crops: list[FieldCrop],
        side_hint: str,
        layout: LayoutContext,
        raw_text: str,
    ) -> VlmExtractionResult:
        if not crops:
            return self.extract(
                image_path,
                side_hint=side_hint,
                layout=layout,
                raw_text=raw_text,
            )
        prompt = _build_crop_prompt(
            side_hint=side_hint,
            layout=layout,
            raw_text=raw_text,
            crops=crops,
        )
        return self._extract_from_images(prompt, [crop.path for crop in crops])

    def _extract_from_images(self, prompt: str, image_paths: list[Path]) -> VlmExtractionResult:
        request = urllib.request.Request(
            self.base_url,
            data=json.dumps(self._payload(prompt, image_paths)).encode("utf-8"),
            headers=self._headers(),
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
            return VlmExtractionResult(
                enabled=True,
                provider=self.provider,
                model=self.model,
                error=f"VLM extraction failed: {error}",
            )

        content = _extract_message_content(response_payload)
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as error:
            return VlmExtractionResult(
                enabled=True,
                provider=self.provider,
                model=self.model,
                error=f"VLM returned non-JSON content: {error}",
                raw_response={"content": content},
            )

        return VlmExtractionResult(
            enabled=True,
            provider=self.provider,
            model=self.model,
            fields=_fields_from_json(parsed),
            confidence=_optional_float(parsed.get("confidence")),
            raw_response=parsed,
        )

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _payload(self, prompt: str, image_paths: list[Path]) -> dict[str, Any]:
        content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
        for image_path in image_paths:
            image_b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                }
            )
        return {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "user",
                    "content": content,
                }
            ],
        }


def _build_prompt(*, side_hint: str, layout: LayoutContext, raw_text: str) -> str:
    regions = [
        {
            "index": region.index,
            "text": region.text,
            "confidence": region.confidence,
            "bbox": region.bbox,
        }
        for region in layout.regions
    ]
    return (
        "You extract Vietnamese CCCD/Citizen Identity Card fields from the image. "
        "Use the image as source of truth and use Paddle OCR text boxes only as layout hints. "
        "Do not guess missing values. Return only JSON with keys: "
        "documentType, side, idNumber, fullName, dateOfBirth, issueDate, "
        "placeOfOrigin, placeOfResidence, confidence. "
        "Dates must be ISO YYYY-MM-DD. side must be FRONT, BACK, or UNKNOWN. "
        f"Side hint: {side_hint}. "
        f"Paddle text boxes: {json.dumps(regions, ensure_ascii=False)}. "
        f"MRZ candidates: {json.dumps(layout.mrz_candidates, ensure_ascii=False)}. "
        f"Raw OCR text: {raw_text}"
    )


def _build_crop_prompt(
    *,
    side_hint: str,
    layout: LayoutContext,
    raw_text: str,
    crops: list[FieldCrop],
) -> str:
    crop_context = [
        {
            "imageOrder": index + 1,
            "name": crop.name,
            "bbox": crop.bbox,
            "textHint": crop.text_hint,
        }
        for index, crop in enumerate(crops)
    ]
    regions = [
        {
            "index": region.index,
            "text": region.text,
            "confidence": region.confidence,
            "bbox": region.bbox,
        }
        for region in layout.regions
    ]
    return (
        "You extract Vietnamese CCCD/Citizen Identity Card fields from cropped field images. "
        "Each attached image is a crop listed in cropContext by imageOrder. "
        "Use the crop pixels as source of truth; OCR text is only a layout hint. "
        "Preserve Vietnamese diacritics exactly, including Đ/đ and ethnic minority names with apostrophes or hyphens. "
        "Do not guess missing values and do not copy label text into values. "
        "Return only JSON with keys: documentType, side, idNumber, fullName, dateOfBirth, issueDate, "
        "placeOfOrigin, placeOfResidence, confidence. Dates must be ISO YYYY-MM-DD. "
        "side must be FRONT, BACK, or UNKNOWN. "
        f"Side hint: {side_hint}. "
        f"Crop context: {json.dumps(crop_context, ensure_ascii=False)}. "
        f"Paddle text boxes: {json.dumps(regions, ensure_ascii=False)}. "
        f"MRZ candidates: {json.dumps(layout.mrz_candidates, ensure_ascii=False)}. "
        f"Raw OCR text: {raw_text}"
    )


def _fields_from_json(parsed: dict[str, Any]) -> CccdFields:
    return CccdFields(
        document_type=_optional_str(parsed.get("documentType")) or _optional_str(parsed.get("document_type")),
        side=_side(parsed.get("side")),
        id_number=_optional_str(parsed.get("idNumber")) or _optional_str(parsed.get("id_number")),
        full_name=_optional_str(parsed.get("fullName")) or _optional_str(parsed.get("full_name")),
        date_of_birth=_optional_str(parsed.get("dateOfBirth")) or _optional_str(parsed.get("date_of_birth")),
        issue_date=_optional_str(parsed.get("issueDate")) or _optional_str(parsed.get("issue_date")),
        place_of_origin=_optional_str(parsed.get("placeOfOrigin"))
        or _optional_str(parsed.get("place_of_origin")),
        place_of_residence=_optional_str(parsed.get("placeOfResidence"))
        or _optional_str(parsed.get("place_of_residence")),
    )


def _extract_message_content(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    content = message.get("content") if isinstance(message, dict) else ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "".join(str(item.get("text", "")) for item in content if isinstance(item, dict)).strip()
    return ""


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _side(value: Any) -> str:
    side = str(value or "UNKNOWN").upper()
    return side if side in {"FRONT", "BACK", "UNKNOWN"} else "UNKNOWN"
