# KYC OCR Service

**Stack:** FastAPI + OpenCV + YOLO + VietOCR (Python) · **Port:** `8010` · **Vị trí:** `ai/kyc_ocr_service/`

OCR giấy tờ tùy thân — nhận ảnh CCCD/giấy tờ từ IAM Service, phát hiện vùng bằng YOLO, đọc chữ bằng VietOCR, trả dữ liệu trích xuất để xác minh KYC. Hoàn toàn stateless.

```mermaid
flowchart LR
    IAM["IAM Service<br/>:8081"]
    KYC["KYC OCR Service<br/>FastAPI + YOLO + VietOCR · :8010"]

    IAM -->|"POST ảnh giấy tờ"| KYC
    KYC -->|"dữ liệu trích xuất"| IAM

    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef py fill:#faefdf,stroke:#b45309,color:#1f2d36

    class IAM nest
    class KYC py
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | IAM Service | HTTP `KYC_OCR_URL=http://kyc-ocr-service:8010` | Duy nhất IAM gọi tới |

## Database

Không có — stateless, xử lý ảnh trong request rồi trả kết quả, không lưu trữ.
