# S.M.I.L.E KYC PaddleOCR Prototype

Service này dùng PaddleOCR để hỗ trợ review CCCD và được IAM gọi qua HTTP từ OCR poller.

## Vì sao tách riêng?

- Tránh làm gãy flow KYC hiện tại đang chạy ổn với manual review.
- Cho phép so sánh OCR output trên ảnh CCCD thật trước khi đổi IAM.
- Có thể chạy như một AI microservice riêng nếu kết quả đủ tốt.

## Card preprocessing

Trước khi OCR, mỗi mặt giấy tờ được xử lý bởi `CardPreprocessor`:

1. Tìm contour hình thẻ gần tỷ lệ ID-1 (`85.60 / 53.98`).
2. Perspective-correct và loại phần nền bên ngoài.
3. Chạy quality checks trên crop trước khi phóng lớn.
4. Chỉ upscale và sharpen nhẹ ảnh tạm dùng cho OCR khi chiều rộng chưa đủ.
5. Xóa crop và ảnh OCR tạm sau khi request hoàn tất.

File KYC mã hóa gốc không bị thay đổi. Response có thêm metadata preprocessing và các check:
`CARD_DETECTED`, `CARD_AREA_RATIO`, `CARD_ASPECT_RATIO`, `PERSPECTIVE_CORRECTED`,
`OCR_IMAGE_UPSCALED`.

## Chạy local

PaddleOCR/PaddlePaddle thường ổn hơn với Python 3.10 hoặc 3.11. Nếu máy đang dùng Python 3.13,
nên tạo virtualenv bằng Python 3.10/3.11.

```powershell
cd ai/kyc_ocr_service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8010
```

## Chạy bằng Docker

Build và chạy riêng OCR service:

```powershell
docker compose -f docker-compose.swagger.yaml up -d --build kyc-ocr-service
curl http://localhost:8010/health
```

Service dùng volume `smile_kyc_ocr_models` để cache PaddleOCR models, tránh tải lại mỗi lần recreate container.

Health check:

```powershell
curl http://localhost:8010/health
```

OCR CCCD front/back:

```powershell
curl -X POST http://localhost:8010/v1/ocr/cccd `
  -F "id_front=@D:\path\to\cccd-front.jpg" `
  -F "id_back=@D:\path\to\cccd-back.jpg" `
  -F "expected_id_number=087204009012" `
  -F "expected_date_of_birth=2004-10-08"
```

Nếu một file upload không giải mã được thành ảnh, endpoint trả `422` với thông báo
ổn định và không đưa đường dẫn file tạm vào response.

## Response shape

Service trả về:

- `front`: OCR result của mặt trước, gồm `id_number`, `full_name`, `date_of_birth`, `side`.
- `back`: OCR result của mặt sau, gồm `id_number` đọc từ MRZ, `issue_date`, `side`.
- `checks`: document-level checklist `PASS/WARNING/FAIL`, gồm đối chiếu `FRONT_BACK_ID_MATCH`,
  `SUBMITTED_ID_MATCH`, và `SUBMITTED_DOB_MATCH` nếu client gửi expected values.
- `risk_level`: `LOW/MEDIUM/HIGH`, dùng để ưu tiên review, không auto approve.
- `lines`: từng OCR line kèm confidence và bbox từ PaddleOCR trong từng mặt.
- `raw_text`: toàn bộ text OCR trong từng mặt để debug.

Image-level checks hiện có:

- `CARD_DETECTED`: tìm thấy vùng thẻ trong ảnh.
- `CARD_AREA_RATIO`: thẻ chiếm đủ diện tích ảnh.
- `CARD_ASPECT_RATIO`: tỷ lệ vùng thẻ gần chuẩn ID-1.
- `PERSPECTIVE_CORRECTED`: đã sửa phối cảnh thành công.
- `OCR_IMAGE_UPSCALED`: cho biết ảnh OCR tạm có được upscale hay không.
- `RESOLUTION_OK`: ảnh đủ kích thước tối thiểu.
- `BLUR_OK`: ảnh không quá mờ, dựa trên Laplacian variance.
- `BRIGHTNESS_OK`: ảnh không quá tối/quá sáng.
- `GLARE_SUSPECTED`: cảnh báo nếu có vùng trắng lớn nghi chói sáng.
- `SCREENSHOT_SUSPECTED`: fail nếu ảnh có viền/nền kiểu chụp màn hình.

Hard-fail rules hiện có:

- Ảnh quá nhỏ, quá mờ, quá tối/quá sáng.
- Ảnh có dấu hiệu screenshot-like rõ.
- Front/back ID không khớp.
- Submitted ID hoặc submitted DOB không khớp OCR.
- OCR không đọc được số CCCD.

## Test không cần Paddle

Các test hiện tại mock OCR engine, nên chạy được mà không cần cài PaddleOCR:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe -m pytest ai\kyc_ocr_service\tests
.\ai\kyc_ocr_service\.venv\Scripts\python.exe -m compileall ai\kyc_ocr_service\src
```

## Benchmark synthetic CCCD

Layout ảnh mock dựa trên thông tin công khai về mẫu CCCD gắn chip: mặt trước có quốc huy,
ảnh, QR, số CCCD, họ tên, ngày sinh, giới tính, quốc tịch, quê quán, nơi thường trú; mặt sau
có đặc điểm nhận dạng, ngày cấp, nơi cấp, chip, vân tay và MRZ. Không dùng dữ liệu CCCD thật.

Chạy benchmark:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe ai\kyc_ocr_service\tools\benchmark_synthetic_cccd.py --lang vi
```

Xuất JSON chi tiết:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe ai\kyc_ocr_service\tools\benchmark_synthetic_cccd.py --lang vi --json
```

Các ảnh mock được sinh vào `%TEMP%\smile_cccd_paddle_benchmark`, không commit vào repo.

## Next step đề xuất

1. Chạy service với một tập ảnh CCCD thật/rõ/mờ/chụp màn hình.
2. Ghi lại accuracy cho các field: ID number, DOB, name, front/back.
3. Nếu PaddleOCR tốt hơn Tesseract rõ rệt, thêm endpoint internal IAM để gọi service này.
4. Chỉ dùng OCR làm structured checks cho admin, không auto approve KYC.
