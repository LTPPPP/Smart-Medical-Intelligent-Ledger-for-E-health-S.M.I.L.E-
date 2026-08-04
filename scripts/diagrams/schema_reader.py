"""Read database/**/schema.sql into a table/column model.

schema.sql is the ground truth for the SRS ERD: it reflects the post-migration
database (tightened column widths, gender -> SMALLINT, dropped tables), whereas
the TypeORM decorators have drifted in a few places. Where the two disagree the
SQL carries an explicit "NOTE: entity drift" comment.
"""

from __future__ import annotations

import glob
import os
import re
from dataclasses import dataclass, field

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCHEMA_GLOB = os.path.join(ROOT, "database", "**", "schema.sql")

# Logical database each schema.sql file describes, in SRS reading order.
DATABASES = [
    ("iam-service/auth-service", "auth_service_db", "Auth"),
    ("iam-service/user-service", "account_service_db", "Account & Identity"),
    ("clinical-emr-service/medical-service", "core_medical_service_db", "Medical Records"),
    ("clinical-emr-service/clinic-service", "core_clinic_service_db", "Clinic & Appointments"),
    ("payment-service/payment-service", "payment_service_db", "Payment"),
]

IGNORED_TABLES = {"migrations"}

_SKIP_START = re.compile(
    r"^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|EXCLUDE)\b", re.I
)
_TYPE = re.compile(
    r"^(\w+)\s+((?:CHARACTER\s+VARYING|DOUBLE\s+PRECISION"
    r"|TIMESTAMP\s+WITH(?:OUT)?\s+TIME\s+ZONE|\w+)(?:\s*\([^)]*\))?(?:\[\])?)",
    re.I,
)
# Cross-database links are documented in comments, in two shapes:
#   "References <service> <table>.<column> (cross-service, no FK)"
#   "Links to <database>.<table>.<column>"
_CROSS = re.compile(
    r"References\s+[\w-]+\s+(\w+)\.(\w+)\s*\(cross-(?:service|database)", re.I
)
_CROSS_QUALIFIED = re.compile(r"Links to\s+\w+\.(\w+)\.(\w+)", re.I)


@dataclass
class Column:
    name: str
    type: str
    pk: bool = False
    fk: str = ""          # "table(column)" for a real database FK
    logical_fk: str = ""  # "table(column)" for a documented cross-service reference
    not_null: bool = False
    unique: bool = False
    default: str = ""     # rendered DEFAULT expression, "" when there is none
    generated: bool = False
    comment: str = ""

    @property
    def references(self) -> str:
        return self.fk or self.logical_fk


@dataclass
class Table:
    name: str
    database: str
    columns: list[Column] = field(default_factory=list)

    @property
    def primary_key(self) -> list[str]:
        return [c.name for c in self.columns if c.pk]


def _split_columns(body: str) -> list[str]:
    """Split a CREATE TABLE body on top-level commas.

    Quoted strings and line comments are skipped so that a ')' inside a generated
    column expression or a ',' inside a comment does not break the split. A
    comment trailing the comma on the same line documents the column *before* it.
    """
    parts: list[str] = []
    depth, cur, i = 0, "", 0
    while i < len(body):
        ch = body[i]
        if ch == "'":
            j = body.find("'", i + 1)
            j = len(body) - 1 if j == -1 else j
            cur += body[i : j + 1]
            i = j + 1
            continue
        if body.startswith("--", i):
            j = body.find("\n", i)
            j = len(body) if j == -1 else j
            cur += body[i:j]
            i = j
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            rest = body[i + 1 :]
            nl = rest.find("\n")
            line = rest if nl == -1 else rest[:nl]
            trailing = re.match(r"\s*--(.*)$", line)
            if trailing:
                cur += " --" + trailing.group(1)
                i += 1 + (len(line) if nl == -1 else nl)
            parts.append(cur)
            cur = ""
        else:
            cur += ch
        i += 1
    if cur.strip():
        parts.append(cur)
    return parts


def _table_body(src: str, open_paren: int) -> str:
    depth, j = 0, open_paren
    while j < len(src):
        if src[j] == "'":
            k = src.find("'", j + 1)
            j = (len(src) - 1 if k == -1 else k) + 1
            continue
        if src.startswith("--", j):
            k = src.find("\n", j)
            j = (len(src) - 1 if k == -1 else k) + 1
            continue
        if src[j] == "(":
            depth += 1
        elif src[j] == ")":
            depth -= 1
            if depth == 0:
                return src[open_paren + 1 : j]
        j += 1
    raise ValueError("unterminated CREATE TABLE at offset %d" % open_paren)


def _parse_file(path: str, database: str) -> list[Table]:
    src = open(path, encoding="utf-8").read()
    tables: list[Table] = []
    for m in re.finditer(r"CREATE TABLE (?:IF NOT EXISTS )?[\"']?(\w+)[\"']?\s*\(", src, re.I):
        name = m.group(1)
        if name in IGNORED_TABLES:
            continue
        table = Table(name=name, database=database)
        table_pk: set[str] = set()
        table_fk: dict[str, str] = {}
        for raw in _split_columns(_table_body(src, m.end() - 1)):
            cm = re.search(r"--\s*(.*)$", raw, re.M)
            comment = cm.group(1).strip() if cm else ""
            clean = re.sub(r"--.*$", "", raw, flags=re.M).strip()
            if not clean:
                continue
            if _SKIP_START.match(clean):
                pk = re.match(
                    r"\s*(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]*)\)", clean, re.I
                )
                if pk:
                    table_pk |= {c.strip().strip('"') for c in pk.group(1).split(",")}
                fk = re.search(
                    r"FOREIGN\s+KEY\s*\(([^)]*)\)\s*REFERENCES\s+[\"']?(\w+)[\"']?\s*\(([^)]*)\)",
                    clean,
                    re.I,
                )
                if fk:
                    for c in fk.group(1).split(","):
                        table_fk[c.strip().strip('"')] = "%s(%s)" % (
                            fk.group(2),
                            fk.group(3).strip(),
                        )
                continue
            tm = _TYPE.match(clean)
            if not tm:
                continue
            ref = re.search(r"\bREFERENCES\s+[\"']?(\w+)[\"']?\s*\(([^)]*)\)", clean, re.I)
            cross = _CROSS.search(comment) or _CROSS_QUALIFIED.search(comment)
            dflt = re.search(
                r"\bDEFAULT\s+('(?:[^']|'')*'(?:::\w+)?|\w+\([^)]*\)|[\w.:]+)", clean, re.I
            )
            table.columns.append(
                Column(
                    name=tm.group(1),
                    type=re.sub(r"\s+", " ", tm.group(2)).upper(),
                    pk=bool(re.search(r"\bPRIMARY\s+KEY\b", clean, re.I)),
                    fk="%s(%s)" % (ref.group(1), ref.group(2).strip()) if ref else "",
                    logical_fk="%s(%s)" % (cross.group(1), cross.group(2)) if cross else "",
                    not_null=bool(re.search(r"\bNOT\s+NULL\b", clean, re.I)),
                    unique=bool(re.search(r"\bUNIQUE\b", clean, re.I)),
                    default=dflt.group(1).strip() if dflt else "",
                    generated=bool(re.search(r"\bGENERATED\s+ALWAYS\b", clean, re.I)),
                    comment=comment,
                )
            )
        for c in table.columns:
            if c.name in table_pk:
                c.pk = True
            if c.name in table_fk and not c.fk:
                c.fk = table_fk[c.name]
        tables.append(table)
    return tables


def load_enums() -> dict[str, list[str]]:
    """CREATE TYPE x AS ENUM (...) -> {type name: values}."""
    out: dict[str, list[str]] = {}
    for path in glob.glob(SCHEMA_GLOB, recursive=True):
        src = open(path, encoding="utf-8").read()
        for m in re.finditer(
            r"CREATE TYPE\s+[\"']?(\w+)[\"']?\s+AS ENUM\s*\((.*?)\)\s*;", src, re.S | re.I
        ):
            out[m.group(1)] = re.findall(r"'([^']*)'", m.group(2))
    return out


def load_check_values() -> dict[tuple[str, str], list[str]]:
    """CHECK (col IN ('a','b')) -> {(table, column): values}.

    Most of these arrive as ALTER TABLE ... ADD CONSTRAINT after the table body,
    so they are collected from the raw SQL rather than from the parsed columns.
    They are the de-facto enums for columns typed as VARCHAR.
    """
    out: dict[tuple[str, str], list[str]] = {}
    for path in glob.glob(SCHEMA_GLOB, recursive=True):
        src = open(path, encoding="utf-8").read()
        for m in re.finditer(
            r"ALTER TABLE\s+[\"']?(\w+)[\"']?[^;]*?CHECK\s*\(\s*[\"']?(\w+)[\"']?\s+IN\s*\(([^)]*)\)",
            src, re.S | re.I,
        ):
            out[(m.group(1), m.group(2))] = re.findall(r"'([^']*)'", m.group(3))
        for m in re.finditer(r"CREATE TABLE (?:IF NOT EXISTS )?[\"']?(\w+)[\"']?\s*\(", src, re.I):
            table = m.group(1)
            body = _table_body(src, m.end() - 1)
            for c in re.finditer(
                r"CHECK\s*\(\s*[\"']?(\w+)[\"']?\s+IN\s*\(([^)]*)\)", body, re.I
            ):
                out.setdefault((table, c.group(1)), re.findall(r"'([^']*)'", c.group(2)))
    return out


def load_schema() -> list[Table]:
    """Every table across every service database, in DATABASES order."""
    by_dir = {d: (db, label) for d, db, label in DATABASES}
    found: dict[str, list[Table]] = {}
    for path in glob.glob(SCHEMA_GLOB, recursive=True):
        rel = os.path.relpath(os.path.dirname(path), os.path.join(ROOT, "database"))
        key = rel.replace(os.sep, "/")
        if key not in by_dir:
            raise KeyError("unmapped schema.sql: %s (add it to DATABASES)" % key)
        found[key] = _parse_file(path, by_dir[key][0])
    missing = set(by_dir) - set(found)
    if missing:
        raise FileNotFoundError("no schema.sql for: %s" % sorted(missing))
    return [t for d, _db, _l in DATABASES for t in found[d]]


if __name__ == "__main__":
    tables = load_schema()
    print("%d tables, %d columns" % (tables and len(tables), sum(len(t.columns) for t in tables)))
    for t in tables:
        print("  %-34s %-26s %2d cols  pk=%s" % (t.name, t.database, len(t.columns), t.primary_key))
