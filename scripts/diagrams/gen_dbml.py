"""Generate dbdiagram.io (DBML) code from database/**/schema.sql.

Writes docs/diagrams/dbml/:
  smile.dbml            all 57 tables, grouped by service database
  <database>.dbml       one file per service database

Paste a file into https://dbdiagram.io/d — it renders and auto-arranges, and can
export the diagram to PNG/PDF/SVG or generate SQL from it.

Usage:  python3 scripts/diagrams/gen_dbml.py
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from entity_names import ENTITY_DESCRIPTIONS
from schema_reader import DATABASES, ROOT, Table, load_check_values, load_enums, load_schema

OUT_DIR = os.path.join(ROOT, "docs", "diagrams", "dbml")


def note(s: str) -> str:
    """A single-quoted DBML note. Straight quotes would end the literal early."""
    clean = re.sub(r"\s+", " ", s).strip().replace("'", "’")
    return "'%s'" % clean


def dbml_type(sql_type: str) -> str:
    """DBML keeps the SQL type verbatim; only the case is normalised."""
    m = re.match(r"^([A-Z ]+?)(\(.*\))?(\[\])?$", sql_type)
    if not m:
        return sql_type.lower()
    return (m.group(1).strip().lower() + (m.group(2) or "") + (m.group(3) or "")).replace(" ", "_")


def column_note(table: Table, col, checks) -> str:
    bits = []
    if col.comment:
        bits.append(re.split(r"\bNOTE:\s*entity drift", col.comment)[0].strip(" -–—,;"))
    values = checks.get((table.name, col.name))
    if values:
        bits.append("one of: " + ", ".join(values))
    if col.logical_fk and not col.fk and not re.search(r"cross-(service|database)", col.comment, re.I):
        bits.append("cross-service reference, not a database FK")
    return " · ".join(b for b in bits if b)


def render_table(t: Table, checks) -> str:
    pk = t.primary_key
    composite = len(pk) > 1
    lines = ["Table %s {" % t.name]
    for c in t.columns:
        attrs = []
        if c.pk and not composite:
            attrs.append("pk")
        if c.not_null and not c.pk:
            attrs.append("not null")
        n = column_note(t, c, checks)
        if n:
            attrs.append("note: %s" % note(n))
        suffix = " [%s]" % ", ".join(attrs) if attrs else ""
        lines.append("  %s %s%s" % (c.name, dbml_type(c.type), suffix))
    if composite:
        lines += ["", "  indexes {", "    (%s) [pk]" % ", ".join(pk), "  }"]
    desc = ENTITY_DESCRIPTIONS.get(t.name)
    if desc:
        lines += ["", "  Note: %s" % note(desc)]
    lines.append("}")
    return "\n".join(lines)


def render_refs(tables: list[Table]) -> tuple[list[str], list[str]]:
    """Return (real foreign keys, cross-service references) as DBML Ref lines."""
    names = {t.name for t in tables}
    hard, soft = [], []
    for t in tables:
        for c in t.columns:
            target = (c.fk or c.logical_fk)
            if not target:
                continue
            tbl, _, col = target.partition("(")
            col = col.rstrip(")")
            if tbl not in names:
                continue
            line = "Ref: %s.%s > %s.%s" % (t.name, c.name, tbl, col)
            (hard if c.fk else soft).append(line)
    return sorted(set(hard)), sorted(set(soft))


def render(tables: list[Table], title: str, grouped: bool) -> str:
    checks = load_check_values()
    enums = load_enums()
    used_types = {dbml_type(c.type) for t in tables for c in t.columns}

    out = [
        "// %s" % title,
        "// GENERATED FILE — do not edit by hand.",
        "// Source: database/**/schema.sql   Regenerate: python3 scripts/diagrams/gen_dbml.py",
        "// Paste into https://dbdiagram.io/d",
        "",
        "Project smile {",
        "  database_type: 'PostgreSQL'",
        "  Note: %s" % note(
            "S.M.I.L.E — %d table%s. Each service owns its own database, so a reference that "
            "crosses a service boundary is documented rather than enforced by a real foreign key."
            % (len(tables), "" if len(tables) == 1 else "s")
        ),
        "}",
        "",
    ]

    for name, values in sorted(enums.items()):
        if name.lower() in used_types:
            out += ["Enum %s {" % name.lower()] + ["  %s" % v for v in values] + ["}", ""]

    if grouped:
        for _dir, db, label in DATABASES:
            members = [t.name for t in tables if t.database == db]
            if members:
                # TableGroup takes no settings block in the DBML grammar, so the
                # human label rides along as a comment.
                out += ["// %s" % label, "TableGroup %s {" % db]
                out += ["  %s" % m for m in members]
                out += ["}", ""]

    for t in tables:
        out += [render_table(t, checks), ""]

    hard, soft = render_refs(tables)
    if hard:
        out += ["// ── Foreign keys ─────────────────────────────────────────────"] + hard + [""]
    if soft:
        out += [
            "// ── Cross-service references ─────────────────────────────────",
            "// Not enforced in the database: these span service boundaries and are",
            "// kept consistent by the services. Delete them if you only want real FKs.",
        ] + soft + [""]
    return "\n".join(out)


def generate() -> None:
    tables = load_schema()
    os.makedirs(OUT_DIR, exist_ok=True)

    path = os.path.join(OUT_DIR, "smile.dbml")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(render(tables, "S.M.I.L.E — full database", grouped=True))
    print("  wrote %s (%d tables)" % (os.path.relpath(path, ROOT), len(tables)))

    for _dir, db, label in DATABASES:
        subset = [t for t in tables if t.database == db]
        path = os.path.join(OUT_DIR, "%s.dbml" % db.replace("_", "-"))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(render(subset, "S.M.I.L.E — %s (%s)" % (label, db), grouped=False))
        print("  wrote %s (%d tables)" % (os.path.relpath(path, ROOT), len(subset)))


if __name__ == "__main__":
    generate()
