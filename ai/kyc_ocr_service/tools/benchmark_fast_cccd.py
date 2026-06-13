from __future__ import annotations

import argparse
import hashlib
import json
import time
from pathlib import Path

from src.service import CccdOcrService


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark fast CCCD OCR without printing PII.")
    parser.add_argument("--front", required=True, type=Path)
    parser.add_argument("--back", required=True, type=Path)
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--warmup", type=int, default=1)
    args = parser.parse_args()

    service = CccdOcrService()
    for _ in range(max(0, args.warmup)):
        service.analyze_document(args.front, args.back)

    results = []
    for index in range(max(1, args.runs)):
        started = time.perf_counter()
        result = service.analyze_document(args.front, args.back)
        elapsed = time.perf_counter() - started
        results.append(
            {
                "run": index + 1,
                "elapsed_seconds": round(elapsed, 3),
                "engine": result.engine,
                "risk": result.risk_level,
                "front": _side_summary(result.front),
                "back": _side_summary(result.back),
                "document_failed_checks": sorted(
                    name for name, check in result.checks.items() if check.status == "FAIL"
                ),
            }
        )

    print(
        json.dumps(
            {
                "sample": _sample_id(args.front, args.back),
                "warmup_runs": max(0, args.warmup),
                "measured_runs": results,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def _side_summary(side):
    if side is None:
        return None
    fields = side.fields
    return {
        "side": fields.side,
        "id_found": bool(fields.id_number),
        "name_found": bool(fields.full_name),
        "dob_found": bool(fields.date_of_birth),
        "issue_found": bool(fields.issue_date),
        "expiry_found": bool(fields.expiry_date),
        "origin_found": bool(fields.place_of_origin),
        "residence_found": bool(fields.place_of_residence),
        "line_count": len(side.lines),
        "risk": side.risk_level,
        "failed_checks": sorted(
            name for name, check in side.checks.items() if check.status == "FAIL"
        ),
    }


def _sample_id(front: Path, back: Path) -> str:
    return hashlib.sha256(f"{front.resolve()}|{back.resolve()}".encode()).hexdigest()[:12]


if __name__ == "__main__":
    main()
