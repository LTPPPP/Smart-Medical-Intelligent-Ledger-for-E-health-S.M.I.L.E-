# S.M.I.L.E KYC OCR Prototype

Service này dùng YOLO/OpenCV preprocessing, PaddleOCR text detection và VietOCR recognition
để hỗ trợ review CCCD. IAM gọi service qua HTTP từ OCR poller.

## Vì sao tách riêng?

- Tránh làm gãy flow KYC hiện tại đang chạy ổn với manual review.
- Cho phép so sánh OCR output trên ảnh CCCD thật trước khi đổi IAM.
- Có thể chạy như một AI microservice riêng nếu kết quả đủ tốt.

## Card preprocessing

Trước khi OCR, mỗi mặt giấy tờ được xử lý bởi `CardPreprocessor`:

1. Tìm thẻ bằng YOLO corner detector nếu `KYC_CARD_YOLO_MODEL` được cấu hình, nếu không thì fallback contour OpenCV gần tỷ lệ ID-1 (`85.60 / 53.98`).
2. Perspective-correct và loại phần nền bên ngoài.
3. Chạy quality checks trên crop trước khi phóng lớn.
4. Chỉ upscale, enhance tương phản/khử bóng nhẹ và sharpen ảnh tạm dùng cho OCR khi chiều rộng chưa đủ.
5. Dùng PaddleOCR để detect text boxes, sau đó dùng VietOCR để recognize từng crop text box.
6. Dùng bbox layout để gom field nhiều dòng.
7. Crop lại các vùng `full_name`, `origin`, `residence` từ layout và OCR lại trên crop/contrast/binary variants để fill field thiếu.
8. Bỏ qua QR payload trong flow extraction chính; OCR trên nội dung in trên thẻ là nguồn dữ liệu ưu tiên.
9. Xóa crop và ảnh OCR tạm sau khi request hoàn tất.

File KYC mã hóa gốc không bị thay đổi. Response có thêm metadata preprocessing và các check:
`CARD_DETECTED`, `CARD_AREA_RATIO`, `CARD_ASPECT_RATIO`, `PERSPECTIVE_CORRECTED`,
`OCR_IMAGE_UPSCALED`.

## OCR engine

Mặc định service dùng `KYC_OCR_ENGINE=vietocr`: PaddleOCR chỉ lấy bbox, VietOCR đọc text.
Nếu cần rollback hoặc A/B nhanh, đặt:

```powershell
KYC_OCR_ENGINE=paddleocr
```

VietOCR tự chọn `cuda:0` nếu PyTorch trong `.venv` có CUDA, nếu không sẽ chạy CPU:

```powershell
KYC_VIETOCR_DEVICE=cuda:0
KYC_VIETOCR_CONFIG=vgg_transformer
```

Lưu ý môi trường hiện tại có RTX 3050 4GB nhưng `torch` trong `.venv` đang là CPU build,
nên muốn chạy VietOCR trên card thật cần cài PyTorch CUDA build tương thích trước khi benchmark runtime.

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

## VLM-assisted extraction thử nghiệm

Mặc định service dùng VietOCR-first + rule parser + field crop OCR retry. Đây là runtime chính vì
nhanh hơn và phù hợp hơn với GPU 4GB. PaddleOCR-VL/VLM hiện chỉ nên dùng để benchmark offline; không
khuyến nghị bật trong flow KYC chính trên RTX 3050 4GB vì chậm và chưa cải thiện field accuracy ổn định.

PaddleOCR detection vẫn chạy trước để lấy text boxes (`lines[].bbox`) và MRZ candidates. Khi bật VLM
để thử nghiệm, service gửi crop field/layout hints sang endpoint OpenAI-compatible và yêu cầu trả JSON strict:
`documentType`, `side`, `idNumber`, `fullName`, `dateOfBirth`, `issueDate`, `confidence`.

Env:

```powershell
KYC_VLM_ENABLED=false
KYC_VLM_BASE_URL=http://localhost:11434/v1/chat/completions
KYC_VLM_MODEL=PaddleOCR-VL
KYC_VLM_API_KEY=
KYC_VLM_TIMEOUT_SECONDS=30
```

Không bật VLM nếu endpoint chạy cloud/public mà chưa có đánh giá privacy, vì ảnh CCCD là dữ liệu nhạy cảm.

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
- `back`: OCR result của mặt sau, gồm `id_number`, `full_name`, `date_of_birth`,
  `issue_date`, `expiry_date`, `side` khi MRZ đọc được.
- `checks`: document-level checklist `PASS/WARNING/FAIL`, gồm đối chiếu `FRONT_BACK_ID_MATCH`,
  `SUBMITTED_ID_MATCH`, và `SUBMITTED_DOB_MATCH` nếu client gửi expected values.
- `risk_level`: `LOW/MEDIUM/HIGH`, dùng để ưu tiên review, không auto approve.
- `lines`: từng OCR line kèm confidence và bbox từ PaddleOCR trong từng mặt.
- `layout`: text boxes chuẩn hóa từ PaddleOCR detection, dùng làm context cho parser/VLM và debug layout.
- `vlm`: kết quả VLM nếu `KYC_VLM_ENABLED=true`; `null` nếu tắt.
- `debug_overlay_path`: đường dẫn ảnh overlay bbox nếu `KYC_OCR_DEBUG_OVERLAY_DIR` được bật.
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

## Debug ảnh box OCR

Local compose đang bật:

```yaml
KYC_OCR_DEBUG_OVERLAY_DIR=/app/debug/ocr-boxes
```

Mỗi request OCR sẽ xuất ảnh crop OCR đã vẽ bbox vào:

```text
.debug/kyc-ocr/
```

Thư mục này bị gitignore vì có thể chứa ảnh CCCD nhạy cảm. Chỉ dùng để debug local.

## Gradio OCR Lab

Dùng UI local để upload/chụp CCCD và xem nhanh field parser, checks và bbox overlay:

```powershell
cd ai/kyc_ocr_service
.\.venv\Scripts\Activate.ps1
pip install -r requirements-demo.txt
python gradio_app.py
```

Mặc định UI chạy ở:

```text
http://127.0.0.1:7860
```

UI demo ẩn `raw_text` và mask số CCCD trong JSON hiển thị. Ảnh overlay được ghi vào
`.debug/gradio-ocr-boxes/`, không commit thư mục này vì có thể chứa ảnh giấy tờ nhạy cảm.

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

## Benchmark Roboflow CCCD field boxes

Một số dataset Roboflow công khai có bbox theo field CCCD như `name`, `id`, `dob`,
`origin_place`, `current_place`, `issue_date`. Export dataset ở định dạng COCO và để ngoài git
vì ảnh CCCD có thể chứa dữ liệu nhạy cảm, ví dụ:

- `Vietnamese ID Card` (`vehicle-xxgod/vietnamese-id-card-uuil0`)
- `final_CCCD 2` (`cid-vietnamese/final_cccd-2-tu5lf`)
- `Phát hiện thông tin CCCD` (`dung-dinh-gc4pk/phat-hien-thong-tin-cccd`)
- `Vietnamese Card` (`identitycard/vietnamese-card-0vvug`)

Chạy evaluator trên thư mục export COCO:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\evaluate_roboflow_cccd_dataset.py `
  D:\datasets\roboflow\Vietnamese-ID-Card --split test --limit 50
```

Tool này dùng bbox Roboflow để crop từng field, OCR crop đó thành pseudo-label nếu dataset
không có text ground truth, rồi so với kết quả extraction toàn ảnh của service. Output mặc định
mask field samples; chỉ dùng `--reveal-sensitive` trong môi trường local an toàn.

## Benchmark A/B preprocessing

So sánh nhanh OpenCV crop baseline với YOLO corner crop + OCR enhancer:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\benchmark_ab_cccd.py `
  D:\datasets\cccd-samples `
  --limit 30 `
  --yolo-model ai\kyc_ocr_service\models\model_crop.pt
```

Tool chỉ in field presence, checks, risk và preview đã mask. Nếu `kyc_vlm_service` đang chạy
OpenAI-compatible endpoint, có thể thêm VLM crop-field variant. Để thêm VietOCR-first variant:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\benchmark_ab_cccd.py `
  D:\datasets\cccd-samples `
  --limit 30 `
  --yolo-model ai\kyc_ocr_service\models\model_crop.pt `
  --include-vietocr
```

VLM crop-field variant vẫn có thể chạy offline khi cần so sánh:

```powershell
.\ai\kyc_ocr_service\.venv\Scripts\python.exe `
  ai\kyc_ocr_service\tools\benchmark_ab_cccd.py `
  D:\datasets\cccd-samples `
  --limit 30 `
  --include-vlm `
  --vlm-url http://localhost:8020/v1/chat/completions `
  --vlm-model PaddleOCR-VL
```

## Next step đề xuất

1. Chạy service với một tập ảnh CCCD thật/rõ/mờ/chụp màn hình.
2. Ghi lại accuracy cho các field: ID number, DOB, name, front/back.
3. Nếu PaddleOCR tốt hơn Tesseract rõ rệt, thêm endpoint internal IAM để gọi service này.
4. Nếu VietOCR CPU quá chậm, đổi `.venv` sang PyTorch CUDA build rồi benchmark lại `--include-vietocr`.
5. Chỉ dùng OCR/VLM làm structured checks cho admin, không auto approve KYC.
