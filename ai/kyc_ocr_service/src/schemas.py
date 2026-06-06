from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


CheckStatus = Literal["PASS", "WARNING", "FAIL"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]
DocumentSide = Literal["FRONT", "BACK", "UNKNOWN"]


class OcrLine(BaseModel):
    text: str
    confidence: float | None = None
    bbox: list[list[float]] | None = None


class CheckResult(BaseModel):
    status: CheckStatus
    message: str
    value: str | float | int | bool | None = None


class CccdFields(BaseModel):
    document_type: str | None = None
    side: DocumentSide = "UNKNOWN"
    id_number: str | None = None
    full_name: str | None = None
    date_of_birth: str | None = None
    issue_date: str | None = None


class CccdParseResult(BaseModel):
    fields: CccdFields = Field(default_factory=CccdFields)
    checks: dict[str, CheckResult] = Field(default_factory=dict)
    risk_level: RiskLevel = "HIGH"
    raw_text: str = ""


class CccdOcrResponse(CccdParseResult):
    engine: str = "paddleocr"
    lines: list[OcrLine] = Field(default_factory=list)


class CccdDocumentOcrResponse(BaseModel):
    engine: str = "paddleocr"
    front: CccdOcrResponse
    back: CccdOcrResponse | None = None
    checks: dict[str, CheckResult] = Field(default_factory=dict)
    risk_level: RiskLevel = "HIGH"
