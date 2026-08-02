"""Generate the SRS §2.1.e / §3.1.b / §3.1.c tables from the repo.

Writes markdown to docs/diagrams/ for review, and with --docx also rewrites the
matching tables inside the Report3 .docx in place:

  Entities List          §2.1.e summary table   (from database/**/schema.sql)
  b. Screen Details      §3.1.b                 (from the screen catalogue)
  c. Non-Screen Functions §3.1.c                (from the screen catalogue)

Usage:
  python3 scripts/diagrams/gen_srs_tables.py            # markdown only
  python3 scripts/diagrams/gen_srs_tables.py --docx     # also patch Report3
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import docx_table
from entity_names import ENTITY_DESCRIPTIONS, entity_name
from schema_reader import ROOT, load_schema
from screens import SCREENS, SYSTEM_FUNCTIONS, verify

OUT_DIR = os.path.join(ROOT, "docs", "diagrams")
REPORT3 = os.path.join(
    ROOT, "docs", "testing", "Report3_Software Requirement Specification.docx"
)


def entity_rows() -> list[list[str]]:
    rows = []
    for i, table in enumerate(load_schema(), 1):
        rows.append([str(i), entity_name(table.name), ENTITY_DESCRIPTIONS[table.name]])
    return rows


def screen_rows() -> list[list[str]]:
    return [
        [str(i), s.feature, s.name, s.description] for i, s in enumerate(SCREENS, 1)
    ]


def function_rows() -> list[list[str]]:
    return [
        [str(i), f.feature, f.signature, f.description]
        for i, f in enumerate(SYSTEM_FUNCTIONS, 1)
    ]


def _markdown(title: str, headers: list[str], rows: list[list[str]]) -> str:
    out = ["# %s" % title, "", "<!-- GENERATED — python3 scripts/diagrams/gen_srs_tables.py -->", ""]
    out.append("| " + " | ".join(headers) + " |")
    out.append("|" + "|".join(["---"] * len(headers)) + "|")
    for r in rows:
        out.append("| " + " | ".join(c.replace("|", "\\|") for c in r) + " |")
    return "\n".join(out) + "\n"


def _write(path: str, body: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body)
    print("  wrote %s" % os.path.relpath(path, ROOT))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true", help="also rewrite the tables in Report3")
    args = ap.parse_args()

    problems = verify()
    if problems:
        print("screen catalogue is out of sync with the app router:")
        for p in problems:
            print("  -", p)
        raise SystemExit(1)

    entities, screens, functions = entity_rows(), screen_rows(), function_rows()

    _write(os.path.join(OUT_DIR, "entities-list.md"),
           _markdown("SRS §2.1.e — Entities List", ["#", "Entity", "Description"], entities))
    _write(os.path.join(OUT_DIR, "screen-details.md"),
           _markdown("SRS §3.1.b — Screen Details", ["#", "Feature", "Screen", "Description"], screens))
    _write(os.path.join(OUT_DIR, "non-screen-functions.md"),
           _markdown("SRS §3.1.c — Non-Screen Functions", ["#", "Feature", "System Function", "Description"], functions))

    print("entities=%d screens=%d system-functions=%d" % (len(entities), len(screens), len(functions)))

    if not args.docx:
        return
    if not os.path.exists(REPORT3):
        raise SystemExit("Report3 not found at %s" % REPORT3)

    backup = os.path.join(
        os.path.dirname(REPORT3), "backups",
        os.path.basename(REPORT3).replace(".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")),
    )
    os.makedirs(os.path.dirname(backup), exist_ok=True)
    shutil.copy(REPORT3, backup)  # copy, not copy2: the backup should carry its own mtime
    print("  backup %s" % os.path.basename(backup))

    names, blobs, xml = docx_table.load(REPORT3)
    for heading, rows in (
        ("Entities List", entities),
        ("b. Screen Details", screens),
        ("c. Non-Screen Functions", functions),
    ):
        xml = docx_table.replace_table_after(xml, heading, rows)
        print("  patched %r -> %d rows" % (heading, len(rows)))
    docx_table.save(REPORT3, names, blobs, xml)
    print("Report3 updated — reopen it and press Ctrl+A then F9 to refresh the table of contents.")


if __name__ == "__main__":
    main()
