FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    KYC_VIETOCR_WEIGHTS=/app/models/vgg_transformer.pth \
    KYC_FIELD_YOLO_ONNX_MODEL=/app/models/scanocr-identity-vi/yolo_v11_best.onnx \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    FLAGS_use_mkldnn=0

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      libgl1 \
      libglib2.0-0 \
      libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
ARG PYTORCH_INDEX_URL=https://download.pytorch.org/whl/cu128
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
      --index-url ${PYTORCH_INDEX_URL} \
      torch==2.11.0 torchvision==0.26.0 \
    && pip install --no-cache-dir -r requirements.txt

ARG VIETOCR_WEIGHTS_URL=https://vocr.vn/data/vietocr/vgg_transformer.pth
ARG VIETOCR_WEIGHTS_SHA256=380512193a8b6cbf6fad80deacdc9b6939d10d473d199892fc6408d13775ea59
ARG FIELD_YOLO_ONNX_URL=https://huggingface.co/phgrouptechs/scanocr-identity-vi/resolve/main/yolo_v11_best.onnx
ARG FIELD_YOLO_ONNX_SHA256=8303bd7f8d80cbb0ae7f2fa34398ecb09ce0fc09ce2423894dab755190a0d6e2
RUN mkdir -p /app/models \
    && python -c "import hashlib, pathlib, urllib.request; target=pathlib.Path('/app/models/vgg_transformer.pth'); urllib.request.urlretrieve('${VIETOCR_WEIGHTS_URL}', target); actual=hashlib.sha256(target.read_bytes()).hexdigest(); assert actual == '${VIETOCR_WEIGHTS_SHA256}', f'Unexpected VietOCR weights checksum: {actual}'" \
    && mkdir -p /app/models/scanocr-identity-vi \
    && python -c "import hashlib, pathlib, urllib.request; target=pathlib.Path('/app/models/scanocr-identity-vi/yolo_v11_best.onnx'); urllib.request.urlretrieve('${FIELD_YOLO_ONNX_URL}', target); actual=hashlib.sha256(target.read_bytes()).hexdigest(); assert actual == '${FIELD_YOLO_ONNX_SHA256}', f'Unexpected field ONNX checksum: {actual}'"

COPY src ./src

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health', timeout=3).read()"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8010"]
