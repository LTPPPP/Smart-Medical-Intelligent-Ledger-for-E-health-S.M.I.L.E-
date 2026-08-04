#!/usr/bin/env python3
"""Map executed Jest results back to (sheet, UTCID) and emit docs/audit/uc-results.json.

Input : docs/audit/results/<service>.json   -- Jest's built-in --json reporter output
        (no jest-junit; no new dependency)
Output: docs/audit/uc-results.json          -- one row per UTCID that ACTUALLY RAN

Only UTCIDs with a real execution result appear here. A UTCID with no generated test is simply
absent -- it is never invented, and never recorded as "Failed" or "Untested". The workbook
writeback leaves such rows blank.

Traceability chain:
    sheet name   <- the `// GENERATED ... sheet "<name>"` header of the spec file
    UTCID        <- the `UTCID\\d+` prefix of the test title
    alignment    <- the `[MATCHES]` / `[DIVERGES: CLASS -- ...]` tag in the test title

Usage:  python3 scripts/qa/collect-uc-results.py
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
RESULTS_DIR = REPO / "docs" / "audit" / "results"
MATRIX = REPO / "docs" / "audit" / "uc-matrix.json"
OUT = REPO / "docs" / "audit" / "uc-results.json"

UTCID_RE = re.compile(r"^(UTCID\d+)\b")
HEADER_SHEET_RE = re.compile(r'sheet\s+"([^"]+)"')
ALIGN_RE = re.compile(r"\[(MATCHES|DIVERGES)(?::\s*(SPEC_STALE|SPEC_WRONG|CODE_GAP))?")

STATUS_MAP = {"passed": "PASS", "failed": "FAIL"}


def sheet_for(spec_path: Path) -> str | None:
    try:
        head = spec_path.read_text(encoding="utf-8")[:2000]
    except OSError:
        return None
    m = HEADER_SHEET_RE.search(head)
    return m.group(1) if m else None


def main() -> int:
    matrix = {(r["sheet"], r["utcid"]): r for r in json.loads(MATRIX.read_text(encoding="utf-8"))}

    rows: list[dict] = []
    problems: list[str] = []
    seen: set[tuple[str, str]] = set()

    for results_file in sorted(RESULTS_DIR.glob("*.json")):
        payload = json.loads(results_file.read_text(encoding="utf-8"))
        for suite in payload.get("testResults", []):
            path = Path(suite["name"])
            if not path.name.endswith(".uc.spec.ts"):
                continue
            sheet = sheet_for(path)
            if sheet is None:
                problems.append(f"{path.name}: no sheet header; results unattributable")
                continue
            executed_at = datetime.fromtimestamp(
                suite.get("startTime", payload.get("startTime", 0)) / 1000, tz=timezone.utc
            ).isoformat()

            for a in suite.get("assertionResults", []):
                m = UTCID_RE.match(a["title"])
                if not m:
                    continue  # canaries and helpers: intentionally not UTCID rows
                utcid = m.group(1)
                key = (sheet, utcid)
                if key in seen:
                    problems.append(f"{sheet} / {utcid}: duplicate test across files")
                    continue
                seen.add(key)
                if key not in matrix:
                    problems.append(f"{sheet} / {utcid}: not present in uc-matrix.json")

                align = ALIGN_RE.search(a["title"])
                rows.append({
                    "sheet": sheet,
                    "utcid": utcid,
                    "status": STATUS_MAP.get(a["status"], "BLOCKED"),
                    "spec_alignment": align.group(1) if align else None,
                    "divergence_class": align.group(2) if align else None,
                    "duration_ms": a.get("duration"),
                    "failure_message": ("\n".join(a.get("failureMessages") or []) or None),
                    "executed_at": executed_at,
                    "test_name": a["title"],
                    "test_file": str(path.relative_to(REPO)),
                    "service": matrix.get(key, {}).get("service"),
                })

    rows.sort(key=lambda r: (r["sheet"], r["utcid"]))
    OUT.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    n_pass = sum(1 for r in rows if r["status"] == "PASS")
    n_fail = sum(1 for r in rows if r["status"] == "FAIL")
    n_block = sum(1 for r in rows if r["status"] == "BLOCKED")
    n_match = sum(1 for r in rows if r["spec_alignment"] == "MATCHES")
    n_div = sum(1 for r in rows if r["spec_alignment"] == "DIVERGES")
    n_none = sum(1 for r in rows if r["spec_alignment"] is None)

    print(f"wrote {OUT.relative_to(REPO)}: {len(rows)} UTCIDs with a real execution result")
    print(f"  status         PASS {n_pass}   FAIL {n_fail}   BLOCKED {n_block}")
    print(f"  spec alignment MATCHES {n_match}   DIVERGES {n_div}   untagged {n_none}")
    by_class: dict[str, int] = {}
    for r in rows:
        if r["divergence_class"]:
            by_class[r["divergence_class"]] = by_class.get(r["divergence_class"], 0) + 1
    if by_class:
        print("  divergence classes " + "   ".join(f"{k} {v}" for k, v in sorted(by_class.items())))
    if n_none:
        print(f"  !! {n_none} executed UTCIDs carry no [MATCHES]/[DIVERGES] tag -- untraceable alignment")
    for p in problems:
        print(f"  !! {p}")
    return 1 if (problems or n_none) else 0


if __name__ == "__main__":
    raise SystemExit(main())
