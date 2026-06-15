#!/usr/bin/env bash
set -euo pipefail

MODEL_NAME="${VLLM_MODEL_NAME:-Qwen/Qwen3.5-4B}"
HOST="${VLLM_HOST:-0.0.0.0}"
PORT="${VLLM_PORT:-8000}"
MAX_MODEL_LEN="${VLLM_MAX_MODEL_LEN:-8192}"
GPU_MEMORY_UTILIZATION="${VLLM_GPU_MEMORY_UTILIZATION:-0.90}"
MAX_NUM_SEQS="${VLLM_MAX_NUM_SEQS:-8}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
VLLM_BIN="${VLLM_BIN:-$REPO_ROOT/ai/booking_orchestrator/.venv-vllm/bin/vllm}"

# Default runtime flag: --max-model-len 8192
exec "$VLLM_BIN" serve "$MODEL_NAME" \
  --served-model-name "$MODEL_NAME" \
  --host "$HOST" \
  --port "$PORT" \
  --trust-remote-code \
  --generation-config vllm \
  --gpu-memory-utilization "$GPU_MEMORY_UTILIZATION" \
  --max-model-len "$MAX_MODEL_LEN" \
  --max-num-seqs "$MAX_NUM_SEQS" \
  --enable-prefix-caching \
  --language-model-only \
  --reasoning-parser qwen3 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder
