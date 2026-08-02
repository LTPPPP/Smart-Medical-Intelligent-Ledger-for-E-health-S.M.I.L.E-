"""Generate the SRS entity relationship diagrams from database/**/schema.sql.

Writes to docs/diagrams/:
  erd-overview.puml       every table (primary key only), grouped by service database
  erd-<database>.puml     one full-column ERD per service database

Cross-service references are drawn dashed: the services own separate databases,
so those links are documented in SQL comments rather than enforced by a real FK.

Usage:  python3 scripts/diagrams/gen_erd_puml.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schema_reader import DATABASES, ROOT, Table, load_schema

OUT_DIR = os.path.join(ROOT, "docs", "diagrams")

HEADER = """@startuml {name}
title {title}

' GENERATED FILE — do not edit by hand.
' Source: database/**/schema.sql   Regenerate: python3 scripts/diagrams/gen_erd_puml.py

hide circle
skinparam linetype ortho
skinparam shadowing false
skinparam roundcorner 6
skinparam class {{
  BackgroundColor #FFFFFF
  BorderColor #4A7EBB
  ArrowColor #4A7EBB
  FontName Segoe UI
  FontSize 11
}}
skinparam package {{
  BackgroundColor #F4F8FC
  BorderColor #A9C3E0
  FontName Segoe UI
}}
"""

FOOTER = "\n@enduml\n"

LEGEND = """
legend bottom
  <b>PK</b> primary key    <b>FK</b> foreign key
  ---- enforced database foreign key
  .... cross-service reference (documented, no database FK)
endlegend
"""


def _pk_marker(col) -> str:
    if col.pk:
        return "<b>PK</b> "
    if col.fk or col.logical_fk:
        return "<b>FK</b> "
    return "      "


def _field(col) -> str:
    null = "" if col.not_null or col.pk else " ?"
    return "  {marker}{name} : {type}{null}".format(
        marker=_pk_marker(col), name=col.name, type=col.type, null=null
    )


def _entity(table: Table, full: bool) -> str:
    lines = ['entity "%s" as %s {' % (table.name, table.name)]
    if full:
        keys = [c for c in table.columns if c.pk]
        rest = [c for c in table.columns if not c.pk]
        lines += [_field(c) for c in keys]
        if keys and rest:
            lines.append("  --")
        lines += [_field(c) for c in rest]
    else:
        lines += [_field(c) for c in table.columns if c.pk]
    lines.append("}")
    return "\n".join(lines)


def _relations(tables: list[Table], scope: set[str] | None = None) -> list[str]:
    """FK edges. `scope` limits both ends to one database; None keeps every edge."""
    names = {t.name for t in tables}
    out: list[str] = []
    for t in tables:
        if scope is not None and t.name not in scope:
            continue
        for c in t.columns:
            target = (c.fk or c.logical_fk).split("(")[0]
            if not target or target not in names:
                continue
            if scope is not None and target not in scope:
                continue
            if target == t.name:
                continue  # self-reference (e.g. accounts.locked_by) — noise on the diagram
            arrow = "||--o{" if c.fk else "||..o{"
            out.append("%s %s %s : %s" % (target, arrow, t.name, c.name))
    return sorted(set(out))


def _write(path: str, body: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body)
    print("  wrote %s" % os.path.relpath(path, ROOT))


def generate() -> None:
    tables = load_schema()
    by_db: dict[str, list[Table]] = {}
    for t in tables:
        by_db.setdefault(t.database, []).append(t)

    # --- overview: every table, primary keys only ---
    parts = [HEADER.format(name="smile-erd-overview", title="S.M.I.L.E — Entity Relationship Diagram (overview)")]
    for _dir, db, label in DATABASES:
        parts.append('\npackage "%s\\n%s" {' % (label, db))
        parts.append("\n".join(_entity(t, full=False) for t in by_db[db]))
        parts.append("}")
    parts.append("")
    parts.extend(_relations(tables))
    parts.append(LEGEND)
    _write(os.path.join(OUT_DIR, "erd-overview.puml"), "\n".join(parts) + FOOTER)

    # --- one full ERD per service database ---
    for _dir, db, label in DATABASES:
        group = by_db[db]
        scope = {t.name for t in group}
        parts = [
            HEADER.format(
                name="smile-erd-%s" % db.replace("_", "-"),
                title="S.M.I.L.E — %s (%s)" % (label, db),
            )
        ]
        parts.append("\n".join(_entity(t, full=True) for t in group))
        parts.append("")
        parts.extend(_relations(tables, scope=scope))
        parts.append(LEGEND)
        _write(os.path.join(OUT_DIR, "erd-%s.puml" % db.replace("_", "-")), "\n".join(parts) + FOOTER)

    print(
        "ERD: %d tables / %d columns across %d databases"
        % (len(tables), sum(len(t.columns) for t in tables), len(by_db))
    )


if __name__ == "__main__":
    generate()
