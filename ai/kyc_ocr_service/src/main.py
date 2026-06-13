from __future__ import annotations

import os
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from .card_preprocessor import InvalidImageError
from .schemas import CccdDocumentOcrResponse
from .service import CccdOcrService


_ocr_service: CccdOcrService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("KYC_OCR_PRELOAD", "1").strip().lower() not in {"0", "false", "no"}:
        get_ocr_service().warm_up()
    yield


app = FastAPI(
    title="S.M.I.L.E KYC PaddleOCR Prototype",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def get_ocr_service() -> CccdOcrService:
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = CccdOcrService()
    return _ocr_service


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
        try:
            return get_ocr_service().analyze_document(
                front_target,
                back_target,
                expected_id_number=expected_id_number,
                expected_date_of_birth=expected_date_of_birth,
            )
        except InvalidImageError as error:
            raise HTTPException(
                status_code=422,
                detail="Uploaded identity document is not a decodable image.",
            ) from error
