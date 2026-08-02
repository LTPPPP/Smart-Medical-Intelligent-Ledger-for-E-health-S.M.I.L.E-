"""Regenerate the Report4 (SDD) §2 Database Design tables from schema.sql.

Section 2 carries one "No | Table | Description" table per service database, where
the description is a structured block:

    Primary key:
    • account_id: UUID
    Foreign keys:
    • account_id → accounts(account_id)
    Attributes:
    • username: VARCHAR(50) (unique, nullable)

Writes docs/diagrams/sdd-database-design.md for review, and with --docx rewrites
the five tables in the Report4 .docx in place.

Usage:
  python3 scripts/diagrams/gen_sdd_tables.py           # markdown only
  python3 scripts/diagrams/gen_sdd_tables.py --docx    # also patch Report4
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import docx_table
from schema_reader import DATABASES, ROOT, Table, load_schema

OUT = os.path.join(ROOT, "docs", "diagrams", "sdd-database-design.md")
REPORT4 = os.path.join(ROOT, "docs", "testing", "Report4_Software Design Document.docx")

# Report4 heading -> the database whose tables belong under it.
SECTIONS = [
    ("2.1 Auth Service Database", "auth_service_db"),
    ("2.2 Account Service Database", "account_service_db"),
    ("2.3 Core Clinic Service Database", "core_clinic_service_db"),
    ("2.4 Core Medical Service Database", "core_medical_service_db"),
    ("2.5 Payment Service Database", "payment_service_db"),
]

ARROW = "→"
BULLET = "• "


def _default(col) -> str:
    d = col.default
    if not d:
        return ""
    d = re.sub(r"::\w+$", "", d).strip("'")
    return {"CURRENT_TIMESTAMP": "now", "gen_random_uuid()": "generated"}.get(d, d)


def _qualifiers(col) -> str:
    bits = []
    if col.unique and not col.pk:
        bits.append("unique")
    d = _default(col)
    if d and d != "generated":
        bits.append("default: %s" % d)
    if col.generated:
        bits.append("generated")
    if not col.not_null and not col.pk:
        bits.append("nullable")
    return " (%s)" % ", ".join(bits) if bits else ""


def describe(t: Table, db_of: dict[str, str]) -> list[tuple[str, bool]]:
    """The description cell as (line, bold) pairs — only the headers are bold."""
    pk = [c for c in t.columns if c.pk]
    lines = [("Primary key:", True)]
    lines += [BULLET + "%s: %s" % (c.name, c.type) for c in pk]

    # A referencing column is listed once, under Foreign keys, with its type —
    # repeating it under Attributes only adds noise.
    refs = []
    for c in t.columns:
        if c.fk:
            tbl, _, col = c.fk.partition("(")
            refs.append(
                BULLET + "%s %s %s(%s%s" % (c.name, ARROW, tbl, col, _qualifiers(c))
            )
        elif c.logical_fk:
            tbl, _, col = c.logical_fk.partition("(")
            refs.append(
                BULLET + "%s %s %s.%s.%s (logical, cross-DB)"
                % (c.name, ARROW, db_of.get(tbl, "?"), tbl, col.rstrip(")"))
            )
    lines.append(("Foreign keys:", True))
    lines += refs or ["— none"]

    attrs = [c for c in t.columns if not c.pk and not (c.fk or c.logical_fk)]
    lines.append(("Attributes:", True))
    lines += [BULLET + "%s: %s%s" % (c.name, c.type, _qualifiers(c)) for c in attrs] or [
        "— none"
    ]
    return lines


def rows_for(db: str, tables: list[Table], db_of) -> list[list]:
    subset = [t for t in tables if t.database == db]
    return [
        ["%02d" % i, t.name, describe(t, db_of)] for i, t in enumerate(subset, 1)
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true", help="also rewrite the tables in Report4")
    args = ap.parse_args()

    tables = load_schema()
    db_of = {t.name: t.database for t in tables}

    md = ["# Report4 §2 — Database Design", "",
          "<!-- GENERATED — python3 scripts/diagrams/gen_sdd_tables.py -->", ""]
    total = 0
    for heading, db in SECTIONS:
        rows = rows_for(db, tables, db_of)
        total += len(rows)
        md += ["## %s" % heading, "", "| No | Table | Description |", "|---|---|---|"]
        for no, name, lines in rows:
            text = [l[0] if isinstance(l, tuple) else l for l in lines]
            md.append("| %s | %s | %s |" % (no, name, "<br>".join(text)))
        md.append("")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(md))
    print("  wrote %s (%d tables)" % (os.path.relpath(OUT, ROOT), total))

    if not args.docx:
        return
    if not os.path.exists(REPORT4):
        raise SystemExit("Report4 not found at %s" % REPORT4)

    backup = os.path.join(
        os.path.dirname(REPORT4), "backups",
        os.path.basename(REPORT4).replace(".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")),
    )
    os.makedirs(os.path.dirname(backup), exist_ok=True)
    shutil.copy(REPORT4, backup)  # copy, not copy2: the backup should carry its own mtime
    print("  backup %s" % os.path.basename(backup))

    names, blobs, xml = docx_table.load(REPORT4)
    for heading, db in SECTIONS:
        rows = rows_for(db, tables, db_of)
        xml = docx_table.replace_table_after(xml, heading, rows, multiline=True)
        print("  patched %r -> %d tables" % (heading, len(rows)))
    docx_table.save(REPORT4, names, blobs, xml)
    print("Report4 updated — reopen it and press Ctrl+A then F9 to refresh the table of contents.")


if __name__ == "__main__":
    main()
