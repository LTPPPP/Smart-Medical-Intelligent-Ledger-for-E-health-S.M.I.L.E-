from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile

from .schemas import CccdDocumentOcrResponse
from .service import CccdOcrService


app = FastAPI(title="S.M.I.L.E KYC PaddleOCR Prototype", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/ocr/cccd", response_model=CccdDocumentOcrResponse)
async def analyze_cccd(
    id_front: UploadFile = File(...),
    id_back: UploadFile | None = File(default=None),
    expected_id_number: str | None = Form(default=None),
    expected_date_of_birth: str | None = Form(default=None),
) -> CccdDocumentOcrResponse:
    with tempfile.TemporaryDirectory(prefix="smile-kyc-ocr-") as temp_dir:
        front_target = Path(temp_dir) / (id_front.filename or "id-front.jpg")
        with front_target.open("wb") as file:
            shutil.copyfileobj(id_front.file, file)
        back_target = None
        if id_back:
            back_target = Path(temp_dir) / (id_back.filename or "id-back.jpg")
            with back_target.open("wb") as file:
                shutil.copyfileobj(id_back.file, file)
        return CccdOcrService().analyze_document(
            front_target,
            back_target,
            expected_id_number=expected_id_number,
            expected_date_of_birth=expected_date_of_birth,
        )
