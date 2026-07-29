FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    KYC_VIETOCR_WEIGHTS=/app/models/vgg_transformer.pth \
    KYC_VIETOCR_CONFIG_PATH=/app/src/vietocr_vgg_transformer.yml \
    KYC_FIELD_YOLO_ONNX_MODEL=/app/models/scanocr-identity-vi/yolo_v11_best.onnx \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    FLAGS_use_mkldnn=0

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
ARG PYTORCH_INDEX_URL=https://download.pytorch.org/whl/cpu
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir \
      --index-url ${PYTORCH_INDEX_URL} \
      torch==2.11.0 torchvision==0.26.0 \
    && python -m pip install --no-cache-dir -r requirements.txt \
    && python -m pip check \
    && python -c "import torch; assert not torch.cuda.is_available(); assert '+cpu' in torch.__version__"

# VietOCR's training-only imgaug dependency installs the GUI OpenCV wheel.
# Reinstall the headless wheel last so it owns the shared cv2 package at runtime.
RUN python -m pip install --no-cache-dir --force-reinstall --no-deps \
      opencv-python-headless==4.10.0.84 \
    && python -m pip check \
    && python -c "import cv2, onnxruntime as ort; assert 'CUDAExecutionProvider' not in ort.get_available_providers(); print(cv2.__version__, ort.get_available_providers())"

ARG VIETOCR_WEIGHTS_URL=https://vocr.vn/data/vietocr/vgg_transformer.pth
ARG VIETOCR_WEIGHTS_SHA256=380512193a8b6cbf6fad80deacdc9b6939d10d473d199892fc6408d13775ea59
ARG FIELD_YOLO_ONNX_URL=https://huggingface.co/phgrouptechs/scanocr-identity-vi/resolve/main/yolo_v11_best.onnx
ARG FIELD_YOLO_ONNX_SHA256=8303bd7f8d80cbb0ae7f2fa34398ecb09ce0fc09ce2423894dab755190a0d6e2
RUN mkdir -p /app/models \
    && curl --fail --location --retry 5 --retry-all-errors --retry-delay 5 --user-agent 'smile-kyc-ocr/1.0' --output /app/models/vgg_transformer.pth "${VIETOCR_WEIGHTS_URL}" \
    && echo "${VIETOCR_WEIGHTS_SHA256}  /app/models/vgg_transformer.pth" | sha256sum --check --status \
    && mkdir -p /app/models/scanocr-identity-vi \
    && curl --fail --location --retry 5 --retry-all-errors --retry-delay 5 --user-agent 'smile-kyc-ocr/1.0' --output /app/models/scanocr-identity-vi/yolo_v11_best.onnx "${FIELD_YOLO_ONNX_URL}" \
    && echo "${FIELD_YOLO_ONNX_SHA256}  /app/models/scanocr-identity-vi/yolo_v11_best.onnx" | sha256sum --check --status

COPY src ./src

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health', timeout=3).read()"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8010"]
