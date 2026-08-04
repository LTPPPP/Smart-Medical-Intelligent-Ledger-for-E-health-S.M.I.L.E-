"""Generate the ERD as an editable draw.io (mxGraph) file, Chen notation.

Matches the notation the existing report diagram uses: blue rectangles for
entities, orange rhombus for the relationship, plain connectors with no
arrowheads, and 1 / M cardinality labels on the edges.

The layout is automatic and meant to be rearranged by hand — that is the point
of shipping the editable format rather than a picture. Open the file at
https://app.diagrams.net or with the draw.io desktop app / VS Code extension.

Writes docs/diagrams/drawio/erd-<database>.drawio

Usage:  python3 scripts/diagrams/gen_drawio_erd.py
"""

from __future__ import annotations

import os
import sys
from xml.sax.saxutils import quoteattr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from entity_names import entity_name
from schema_reader import DATABASES, ROOT, load_schema

OUT_DIR = os.path.join(ROOT, "docs", "diagrams", "drawio")

ENTITY_STYLE = "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
REL_STYLE = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;"
EDGE_STYLE = (
    "edgeStyle=orthogonalEdgeStyle;shape=connector;rounded=0;orthogonalLoop=1;jettySize=auto;"
    "html=1;strokeColor=default;align=center;verticalAlign=middle;fontFamily=Helvetica;"
    "fontSize=12;fontColor=default;labelBackgroundColor=default;startSize=8;endArrow=none;"
    "endFill=0;endSize=8;"
)
LABEL_STYLE = (
    "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];"
    "fontSize=11;fontFamily=Helvetica;fontColor=default;labelBackgroundColor=default;"
)

E_W, E_H = 140, 60      # entity box
R_W, R_H = 90, 70       # relationship rhombus
COL_STEP = 340          # horizontal distance between entity columns
ROW_STEP = 150          # vertical distance between entity rows


def _verb(column: str, target: str) -> str:
    """A readable relationship name for the rhombus."""
    name = column[:-3] if column.endswith("_id") else column
    special = {
        "created_by": "Creates", "updated_by": "Updates", "verified_by": "Verifies",
        "approved_by": "Approves", "cancelled_by": "Cancels", "changed_by": "Changes",
        "ordered_by": "Orders", "recorded_by": "Records", "locked_by": "Locks",
        "assigned_by": "Assigns", "refund_requested_by": "Requests", "refund_reviewed_by": "Reviews",
        "doctor": "Attends", "patient": "Concerns", "user": "Belongs to",
    }
    if name in special:
        return special[name]
    return "Has"


class Graph:
    def __init__(self):
        self.cells: list[str] = []
        self._id = 2

    def next_id(self) -> str:
        self._id += 1
        return str(self._id)

    def node(self, value: str, style: str, x: int, y: int, w: int, h: int) -> str:
        cid = self.next_id()
        self.cells.append(
            f'<mxCell id="{cid}" value={quoteattr(value)} style={quoteattr(style)} '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def edge(self, source: str, target: str, label: str = "") -> str:
        cid = self.next_id()
        self.cells.append(
            f'<mxCell id="{cid}" style={quoteattr(EDGE_STYLE)} edge="1" parent="1" '
            f'source="{source}" target="{target}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )
        if label:
            lid = self.next_id()
            self.cells.append(
                f'<mxCell id="{lid}" value={quoteattr(label)} style={quoteattr(LABEL_STYLE)} '
                f'vertex="1" connectable="0" parent="{cid}">'
                f'<mxGeometry x="-0.5" relative="1" as="geometry">'
                f'<mxPoint as="offset"/></mxGeometry></mxCell>'
            )
        return cid

    def render(self, name: str) -> str:
        return (
            '<mxfile host="app.diagrams.net">'
            f'<diagram name={quoteattr(name)}>'
            '<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" '
            'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" '
            'pageHeight="826" math="0" shadow="0">'
            '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
            + "".join(self.cells)
            + "</root></mxGraphModel></diagram></mxfile>"
        )


def build(tables, title: str) -> str:
    g = Graph()
    names = {t.name for t in tables}

    # Entities on a grid, ordered as schema.sql declares them so related tables
    # start out near each other.
    cols = max(1, round(len(tables) ** 0.5))
    entity_id: dict[str, str] = {}
    entity_pos: dict[str, tuple[int, int]] = {}
    for i, t in enumerate(tables):
        x = (i % cols) * COL_STEP
        y = (i // cols) * ROW_STEP * 2
        entity_id[t.name] = g.node(entity_name(t.name).upper(), ENTITY_STYLE, x, y, E_W, E_H)
        entity_pos[t.name] = (x, y)

    # One rhombus per foreign key, parked between the two entities it joins.
    for t in tables:
        for c in t.columns:
            target = (c.fk or c.logical_fk).split("(")[0]
            if not target or target not in names or target == t.name:
                continue
            sx, sy = entity_pos[t.name]
            tx, ty = entity_pos[target]
            rx = int((sx + tx) / 2 + (E_W - R_W) / 2)
            ry = int((sy + ty) / 2 + (E_H - R_H) / 2)
            rid = g.node(_verb(c.name, target), REL_STYLE, rx, ry, R_W, R_H)
            # one target row relates to many rows of the referencing table
            g.edge(entity_id[target], rid, "1")
            g.edge(rid, entity_id[t.name], "M")

    return g.render(title)


def generate() -> None:
    all_tables = load_schema()
    os.makedirs(OUT_DIR, exist_ok=True)

    for _dir, db, label in DATABASES:
        tables = [t for t in all_tables if t.database == db]
        path = os.path.join(OUT_DIR, "erd-%s.drawio" % db.replace("_", "-"))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(tables, "%s — %s" % (label, db)))
        print("  wrote %s (%d entities)" % (os.path.relpath(path, ROOT), len(tables)))

    path = os.path.join(OUT_DIR, "erd-overview.drawio")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(build(all_tables, "S.M.I.L.E — full ERD"))
    print("  wrote %s (%d entities)" % (os.path.relpath(path, ROOT), len(all_tables)))


if __name__ == "__main__":
    generate()
