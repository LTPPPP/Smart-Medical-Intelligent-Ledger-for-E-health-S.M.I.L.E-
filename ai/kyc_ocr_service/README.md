# S.M.I.L.E Fast KYC OCR

Service OCR CCCD cho luồng KYC của S.M.I.L.E. Runtime chính hiện tại là fast pipeline:

1. Mặt trước: YOLOv11 ONNX detect các field CCCD, sau đó VietOCR đọc từng crop.
2. Mặt sau: cắt ROI cố định cho ngày cấp và MRZ, sau đó VietOCR đọc crop.
3. Parser chuẩn hóa field, đọc MRZ, đối chiếu front/back ID và trả checklist KYC.
4. Quality analyzer vẫn kiểm tra resolution, blur, brightness, glare và screenshot-like border.

Pipeline cũ dùng PaddleOCR full-image đã được thay bằng fast pipeline này trên `dev`. Nếu cần rollback, lấy lại từ branch/commit cũ thay vì fallback trong runtime.

## Model Weights

Docker build tự tải và verify checksum:

- VietOCR: `/app/models/vgg_transformer.pth`
- CCCD field detector: `/app/models/scanocr-identity-vi/yolo_v11_best.onnx`

Local dev có thể để ONNX weight ở:

```text
models/scanocr-identity-vi/yolo_v11_best.onnx
```

Hoặc cấu hình:

```powershell
$env:KYC_FIELD_YOLO_ONNX_MODEL="D:\path\to\yolo_v11_best.onnx"
$env:KYC_VIETOCR_WEIGHTS="D:\path\to\vgg_transformer.pth"
```

`models/` đang bị gitignore, không commit weight hoặc ảnh CCCD thật.

## Run Local

```powershell
cd ai/kyc_ocr_service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8010
```

Health check:

```powershell
curl http://localhost:8010/health
```

OCR CCCD front/back:

```powershell
curl -X POST http://localhost:8010/v1/ocr/cccd `
  -F "id_front=@D:\path\to\front.jpg" `
  -F "id_back=@D:\path\to\back.jpg" `
  -F "expected_id_number=000000000000" `
  -F "expected_date_of_birth=2000-01-01"
```

Endpoint trả `422` nếu ảnh upload không decode được, không trả đường dẫn temp file.

## Run Docker

```powershell
docker build -t kyc-ocr-service ai/kyc_ocr_service
docker run -d --gpus all -p 8010:8010 -e KYC_VIETOCR_DEVICE=cuda kyc-ocr-service
curl http://localhost:8010/health
```

Compose mặc định bật GPU:

```yaml
gpus: all
KYC_VIETOCR_DEVICE: cuda
```

Nếu máy không có GPU/CUDA runtime, đổi `KYC_VIETOCR_DEVICE=cpu` và cân nhắc dùng build CPU phù hợp.

## Response Shape

Service trả về:

- `front.fields`: `id_number`, `full_name`, `date_of_birth`, `place_of_origin`, `place_of_residence`, `side`.
- `back.fields`: `id_number`, `date_of_birth`, `issue_date`, `expiry_date`, `side`.
- `checks`: document-level checks như `FRONT_BACK_ID_MATCH`, `SUBMITTED_ID_MATCH`, `SUBMITTED_DOB_MATCH`.
- `risk_level`: `LOW`, `MEDIUM`, hoặc `HIGH`.
- `lines`: các crop OCR đã đọc, kèm bbox crop; không dùng để log dữ liệu thật ở môi trường public.

Hard fail chính:

- Ảnh không đọc được.
- Ảnh quá nhỏ, quá mờ, quá tối/quá sáng.
- Ảnh có dấu hiệu screenshot-like rõ.
- Front/back ID không khớp.
- Submitted ID hoặc submitted DOB không khớp OCR.
- Không đọc được số CCCD.

## Benchmark

Benchmark front/back thật, output chỉ in trạng thái field và thời gian, không in CCCD/raw OCR:

```powershell
$env:PYTHONPATH='ai/kyc_ocr_service'
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\benchmark_fast_cccd.py `
  --front D:\path\to\front.jpg `
  --back D:\path\to\back.jpg `
  --warmup 1 `
  --runs 3
```

Benchmark synthetic không dùng dữ liệu thật:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\benchmark_synthetic_cccd.py
```

## Tests

Chạy bằng `.venv` của OCR service, không chạy từ Conda base:

```powershell
$env:PYTHONPATH='ai/kyc_ocr_service'
.\ai\kyc_ocr_service\.venv\Scripts\python.exe -m pytest ai\kyc_ocr_service\tests
.\ai\kyc_ocr_service\.venv\Scripts\python.exe -m compileall ai\kyc_ocr_service\src ai\kyc_ocr_service\tools
```

## Privacy Notes

- Không log CCCD number, raw OCR payload hoặc ảnh giấy tờ thật trong terminal public.
- Không commit ảnh CCCD thật, debug overlays, crop tạm hoặc model weights.
- Các tool benchmark mặc định mask dữ liệu; chỉ dùng option reveal trong môi trường local an toàn.
