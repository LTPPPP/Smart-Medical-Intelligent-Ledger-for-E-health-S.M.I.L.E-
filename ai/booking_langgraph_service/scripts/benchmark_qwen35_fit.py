#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from src.model_config import qwen35_benchmark_candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Print Qwen3.5 local fit benchmark matrix.")
    parser.add_argument("--output", type=Path, help="Optional JSON output path.")
    args = parser.parse_args()
    payload = {
        "candidates": [candidate.model_dump() for candidate in qwen35_benchmark_candidates()],
        "metrics": [
            "json_schema_validity",
            "tool_selection_accuracy",
            "tool_argument_validity",
            "p50_latency_ms",
            "p95_latency_ms",
            "timeout_rate",
            "tokens_per_success",
            "scenario_success_rate",
        ],
    }
    text = json.dumps(payload, indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
