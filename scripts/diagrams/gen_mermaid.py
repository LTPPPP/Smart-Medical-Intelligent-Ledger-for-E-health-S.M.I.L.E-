"""Emit the same diagrams as Mermaid, which GitHub renders inline with no tooling.

PlantUML needs Java and a `plantuml` binary; Mermaid needs neither, so these are
the copies you can actually look at in a browser or in a pull request.

Writes docs/diagrams/*.mmd plus docs/diagrams/DIAGRAMS.md, a single page with every
diagram in a ```mermaid fence.

Usage:  python3 scripts/diagrams/gen_mermaid.py
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen_screenflow_puml import ACTORS, _ident, _nearest_visible_parent, _visible
from route_reader import ROOT, _public_routes, guarded_roles, nav_by_kind
from schema_reader import DATABASES, load_schema
from screens import SCREENS, verify

OUT_DIR = os.path.join(ROOT, "docs", "diagrams")


def _mtype(sql_type: str) -> str:
    """Mermaid attribute types must be a single bare token."""
    base = re.split(r"[ (\[]", sql_type, maxsplit=1)[0]
    return base.lower() or "text"


def erd_mermaid(scope_db: str | None = None) -> str:
    tables = load_schema()
    if scope_db:
        tables = [t for t in tables if t.database == scope_db]
    names = {t.name for t in tables}

    lines = ["erDiagram"]
    for t in tables:
        for c in t.columns:
            target = (c.fk or c.logical_fk).split("(")[0]
            if target and target in names and target != t.name:
                lines.append('  %s ||--o{ %s : "%s"' % (target, t.name, c.name))
    for t in tables:
        lines.append("  %s {" % t.name)
        for c in t.columns:
            key = "PK" if c.pk else ("FK" if c.fk or c.logical_fk else "")
            lines.append("    %s %s %s" % (_mtype(c.type), c.name, key))
        lines.append("  }")
    return "\n".join(lines)


def erd_overview_mermaid() -> str:
    """Table names and relationships only — the full attribute lists are per-database."""
    tables = load_schema()
    names = {t.name for t in tables}
    lines = ["erDiagram"]
    for t in tables:
        for c in t.columns:
            target = (c.fk or c.logical_fk).split("(")[0]
            if target and target in names and target != t.name:
                lines.append('  %s ||--o{ %s : "%s"' % (target, t.name, c.name))
    for t in tables:
        lines.append("  %s {" % t.name)
        for c in t.columns:
            if c.pk:
                lines.append("    %s %s PK" % (_mtype(c.type), c.name))
        lines.append("  }")
    return "\n".join(lines)


def flow_mermaid(role: str | None, kind: str | None) -> str:
    guards = guarded_roles()
    public, auth = _public_routes()
    by_route = {s.route: s for s in SCREENS}

    vis = _visible(role, kind, guards, public, auth)
    vis_routes = {s.route for s in vis}
    sidebar = set(nav_by_kind().get(kind, [])) if kind else set()

    lines = ["flowchart LR"]
    for s in vis:
        lines.append('  %s["%s"]' % (_ident(s.route), s.name))
    lines.append("")

    edges = []
    for s in vis:
        if s.route in sidebar and "/dashboard" in vis_routes and s.route != "/dashboard":
            edges.append('  %s -->|"Sidebar"| %s' % (_ident("/dashboard"), _ident(s.route)))
            continue
        parent = _nearest_visible_parent(s, by_route, vis_routes)
        if parent:
            label = (s.trigger or "Navigate").replace('"', "'")
            edges.append('  %s -->|"%s"| %s' % (_ident(parent), label, _ident(s.route)))
    lines.extend(sorted(set(edges)))
    return "\n".join(lines)


def _write(path: str, body: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body.rstrip() + "\n")
    print("  wrote %s" % os.path.relpath(path, ROOT))


def generate() -> None:
    problems = verify()
    if problems:
        for p in problems:
            print("  -", p)
        raise SystemExit(1)

    page = [
        "# S.M.I.L.E — SRS diagrams",
        "",
        "<!-- GENERATED — python3 scripts/diagrams/gen_mermaid.py -->",
        "",
        "Rendered inline by GitHub. The PlantUML copies in this folder are the same",
        "diagrams for the Word report; regenerate both with `make diagrams`.",
        "",
        "## Entity relationship — overview",
        "",
        "All 57 tables across the five service databases, primary keys only.",
        "Solid links are enforced foreign keys; the cross-database ones are logical",
        "references, since each service owns its own database.",
        "",
        "```mermaid",
        erd_overview_mermaid(),
        "```",
        "",
    ]
    _write(os.path.join(OUT_DIR, "erd-overview.mmd"), erd_overview_mermaid())

    for _dir, db, label in DATABASES:
        body = erd_mermaid(db)
        _write(os.path.join(OUT_DIR, "erd-%s.mmd" % db.replace("_", "-")), body)
        page += ["## Entity relationship — %s" % label, "", "`%s`" % db, "", "```mermaid", body, "```", ""]

    for slug, role, kind, label in ACTORS:
        body = flow_mermaid(role, kind)
        _write(os.path.join(OUT_DIR, "screen-flow-%s.mmd" % slug), body)
        page += ["## Screen flow — %s" % label, "", "```mermaid", body, "```", ""]

    _write(os.path.join(OUT_DIR, "DIAGRAMS.md"), "\n".join(page))


if __name__ == "__main__":
    generate()
