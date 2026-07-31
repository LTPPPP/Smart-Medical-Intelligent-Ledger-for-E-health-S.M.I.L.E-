# Remove Legacy PaddleOCR Design

**Date:** 2026-07-31
**Branch:** `feat/retest-main-flow`

## Goal

Remove every active and compatibility reference to PaddleOCR from the S.M.I.L.E
KYC flow while preserving the existing fast CCCD pipeline based on YOLOv11
ONNX field detection and VietOCR recognition.

## Scope

- Delete the unused PaddleOCR engine module.
- Reduce `vietocr_engine.py` to the `LazyVietOcrRecognizer` used by the fast
  engine and evaluation tools.
- Remove the unused OCR-engine selector and its Compose setting.
- Remove the IAM `KYC_PADDLE_OCR_URL` compatibility alias.
- Replace stale PaddleOCR schema defaults, fixtures, test names, documentation,
  and package metadata.
- Remove tests that exist only for the deleted legacy pipeline while preserving
  tests for VietOCR loading and batch recognition.

## Runtime Behavior

The active request path remains:

1. FastAPI receives front and optional back CCCD images.
2. YOLOv11 ONNX detects front-side fields, with the existing fixed-ROI fallback
   when field detections are unavailable.
3. VietOCR recognizes the cropped text regions.
4. The service normalizes fields, evaluates image quality, compares submitted
   identity data, and returns risk/check results.
5. IAM records OCR failures as `FAILED`; it does not switch OCR providers.

The public endpoint and response structure remain unchanged. The response
provider defaults to `scanocr-onnx-vietocr-fast` instead of `paddleocr`.

## Configuration

- `KYC_OCR_URL` is the only IAM OCR service URL.
- `KYC_OCR_ENABLED` continues to enable or disable OCR processing.
- `KYC_OCR_ENGINE` and `KYC_PADDLE_OCR_URL` are removed because there is only
  one supported runtime engine.

## Validation

- Add focused RED checks for the fast-engine schema default and removal of the
  IAM legacy URL behavior.
- Run the KYC OCR pytest suite with the service virtual environment.
- Run Python `compileall` for KYC source and tools.
- Run focused IAM KYC Jest tests and the IAM build.
- Run the affected frontend KYC payload test.
- Validate Docker Compose, rebuild/start only `kyc-ocr-service`, check health,
  and run a synthetic OCR route smoke without logging identity data.
- Confirm a repository search finds no remaining PaddleOCR references in
  tracked project files.

## Risks and Boundaries

- Existing deployments that only set `KYC_PADDLE_OCR_URL` must migrate to
  `KYC_OCR_URL` before updating.
- Fixed-ROI fallback remains limited to field localization; no second OCR
  recognizer is retained.
- No model weights, real CCCD images, database records, or unrelated services
  are changed.
