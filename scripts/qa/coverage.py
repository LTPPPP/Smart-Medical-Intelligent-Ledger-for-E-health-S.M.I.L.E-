#!/usr/bin/env python3
"""SINGLE SOURCE OF TRUTH for UC test-suite coverage numbers.

Every coverage figure quoted in chat, in docs/audit/*.md, or in the workbook writeback MUST
come from this script. No coverage number is ever hand-typed.

Rationale: a previous session reported "34 UTCIDs done" when the real figure was 42 -- it had
counted only iam-service and missed the two pilot files in clinical-emr and payment. Deriving
the number from disk makes that class of error impossible.

Sources of truth:
  * docs/audit/uc-matrix.json      -- the denominator (398 UTCIDs parsed from the workbook)
  * backend/service/*/src/**/*.uc.spec.ts -- the numerator (what actually exists on disk)

A UTCID counts as generated only if a file contains a literal `it('UTCID<nn> ` for it AND that
file's header names the sheet. Canaries are counted separately and never summed into the UTCID
figure -- only the UTCID count maps back to the workbook.

Usage:
    python3 scripts/qa/coverage.py            # human-readable table
    python3 scripts/qa/coverage.py --json     # machine-readable, for other scripts
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
MATRIX = REPO / "docs" / "audit" / "uc-matrix.json"
BACKEND = REPO / "backend" / "service"

# `it('UTCID01 — ...` / `it("UTCID01 - ...`  -> capture the id
UTCID_RE = re.compile(r"""\bit\(\s*['"`](UTCID\d+)\b""")
CANARY_RE = re.compile(r"""\bit\(\s*['"`]canary\b""")
# Header line: // GENERATED from Report5_Unit Test.xlsx — sheet "Login" — 7 cases.
HEADER_SHEET_RE = re.compile(r'sheet\s+"([^"]+)"')


def load_matrix() -> list[dict]:
    with MATRIX.open(encoding="utf-8") as fh:
        return json.load(fh)


def scan_generated() -> tuple[dict[str, set[str]], dict[str, int], list[str]]:
    """Return (sheet -> set(utcid)), (sheet -> canary count), [problems]."""
    by_sheet: dict[str, set[str]] = defaultdict(set)
    canaries: dict[str, int] = defaultdict(int)
    problems: list[str] = []

    for path in sorted(BACKEND.glob("*/src/**/*.uc.spec.ts")):
        text = path.read_text(encoding="utf-8")
        header = HEADER_SHEET_RE.search(text)
        rel = path.relative_to(REPO)
        if not header:
            problems.append(f"{rel}: no `sheet \"...\"` in the GENERATED header; cannot attribute")
            continue
        sheet = header.group(1)
        ids = set(UTCID_RE.findall(text))
        if not ids:
            problems.append(f"{rel}: header names sheet {sheet!r} but contains no UTCID tests")
        dupe = sheet in by_sheet
        if dupe:
            problems.append(f"{rel}: sheet {sheet!r} is already claimed by another file (1 sheet = 1 file)")
        by_sheet[sheet] |= ids
        canaries[sheet] += len(CANARY_RE.findall(text))

    return by_sheet, canaries, problems


def build_report() -> dict:
    matrix = load_matrix()
    generated, canaries, problems = scan_generated()

    # Denominator, grouped.
    want: dict[str, set[str]] = defaultdict(set)
    sheet_service: dict[str, str] = {}
    sheet_class: dict[str, str] = {}
    for row in matrix:
        want[row["sheet"]].add(row["utcid"])
        sheet_service[row["sheet"]] = row["service"]
        sheet_class[row["sheet"]] = row["targetClass"]

    # Any generated sheet/UTCID that the matrix doesn't know about is a real error.
    for sheet, ids in generated.items():
        if sheet not in want:
            problems.append(f"generated sheet {sheet!r} is not in uc-matrix.json")
            continue
        unknown = ids - want[sheet]
        if unknown:
            problems.append(f"sheet {sheet!r}: generated UTCIDs not in the matrix: {sorted(unknown)}")

    per_service: dict[str, dict] = defaultdict(
        lambda: {"utcids_total": 0, "utcids_done": 0, "sheets_total": 0, "sheets_done": 0,
                 "sheets_partial": 0, "canaries": 0}
    )
    sheet_rows = []
    for sheet, ids in sorted(want.items()):
        svc = sheet_service[sheet]
        done = generated.get(sheet, set()) & ids
        bucket = per_service[svc]
        bucket["utcids_total"] += len(ids)
        bucket["utcids_done"] += len(done)
        bucket["sheets_total"] += 1
        bucket["canaries"] += canaries.get(sheet, 0)
        if done and len(done) == len(ids):
            bucket["sheets_done"] += 1
            state = "DONE"
        elif done:
            bucket["sheets_partial"] += 1
            state = "PARTIAL"
        else:
            state = "TODO"
        sheet_rows.append({
            "sheet": sheet, "service": svc, "targetClass": sheet_class[sheet],
            "utcids_total": len(ids), "utcids_done": len(done),
            "canaries": canaries.get(sheet, 0), "state": state,
            "missing": sorted(ids - done),
        })

    totals = {
        "utcids_total": sum(len(v) for v in want.values()),
        "utcids_done": sum(len(generated.get(s, set()) & ids) for s, ids in want.items()),
        "sheets_total": len(want),
        "sheets_done": sum(1 for r in sheet_rows if r["state"] == "DONE"),
        "sheets_partial": sum(1 for r in sheet_rows if r["state"] == "PARTIAL"),
        "canaries": sum(canaries.values()),
        "files": len(list(BACKEND.glob("*/src/**/*.uc.spec.ts"))),
    }
    totals["utcids_remaining"] = totals["utcids_total"] - totals["utcids_done"]

    return {"totals": totals, "per_service": dict(per_service),
            "sheets": sheet_rows, "problems": problems}


def main() -> int:
    report = build_report()
    if "--json" in sys.argv:
        json.dump(report, sys.stdout, indent=2, ensure_ascii=False)
        print()
        return 1 if report["problems"] else 0

    t = report["totals"]
    print("=" * 72)
    print("UC TEST-SUITE COVERAGE  (derived from uc-matrix.json + files on disk)")
    print("=" * 72)
    print(f"  UTCIDs   : {t['utcids_done']} / {t['utcids_total']} generated"
          f"   ({100.0 * t['utcids_done'] / t['utcids_total']:.1f}%)"
          f"   remaining {t['utcids_remaining']}")
    print(f"  Sheets   : {t['sheets_done']} complete, {t['sheets_partial']} partial,"
          f" of {t['sheets_total']}")
    print(f"  Files    : {t['files']} *.uc.spec.ts")
    print(f"  Canaries : {t['canaries']}   (counted separately; never summed into UTCIDs)")
    print()
    print(f"  {'service':<14}{'UTCIDs':>14}{'sheets':>16}{'canaries':>10}")
    for svc in sorted(report["per_service"]):
        s = report["per_service"][svc]
        print(f"  {svc:<14}{s['utcids_done']:>6}/{s['utcids_total']:<7}"
              f"{s['sheets_done']:>8}+{s['sheets_partial']}p/{s['sheets_total']:<5}"
              f"{s['canaries']:>8}")
    print()
    print(f"  REPORTABLE: {t['utcids_done']} UTCID tests + {t['canaries']} canaries"
          f" = {t['utcids_done'] + t['canaries']} generated tests")

    partial = [r for r in report["sheets"] if r["state"] == "PARTIAL"]
    if partial:
        print("\n  PARTIAL sheets (generated but incomplete):")
        for r in partial:
            print(f"    {r['sheet']:<34} {r['utcids_done']}/{r['utcids_total']}"
                  f"  missing: {', '.join(r['missing'])}")

    if report["problems"]:
        print("\n  !! PROBLEMS !!")
        for p in report["problems"]:
            print(f"    - {p}")
        return 1
    print("\n  no integrity problems detected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
