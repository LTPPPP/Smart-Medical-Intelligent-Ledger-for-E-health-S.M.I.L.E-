"""Render database/**/schema.sql to SVG images — a visual data dictionary.

One image per service database: every table with its full column list, type,
and PK/FK marker, plus connectors for the foreign keys inside that database.
Tables are packed into columns shortest-first so the sheet stays compact.

Writes docs/diagrams/img/schema-<database>.svg

Usage:  python3 scripts/diagrams/gen_schema_svg.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schema_reader import DATABASES, ROOT, load_schema
from svg import Svg, text_width, truncate

OUT_DIR = os.path.join(ROOT, "docs", "diagrams", "img")

BOX_W = 262.0
HEAD_H = 26.0
ROW_H = 15.0
COL_GAP = 96.0
BOX_GAP = 22.0
TITLE_H = 56.0
ASPECT = 1.5   # target width:height of the finished sheet
MAX_COLS = 6

INK = "#0F1B1E"
SOFT = "#4A5C63"
FAINT = "#80959C"
EDGE = "#9AB6C2"
HEAD_FILL = "#4A7EBB"
BOX_FILL = "#FFFFFF"
BOX_LINE = "#9CBBDA"
PK_INK = "#0B6E75"
FK_INK = "#9A5B18"


def box_height(table) -> float:
    return HEAD_H + len(table.columns) * ROW_H + 6


def pack(tables):
    """Greedy column packing, tallest table first into the shortest column.

    The column count targets a landscape sheet (roughly 1.5:1) so a one-table
    database does not come out as a single ribbon and a twenty-table one does
    not come out as a wall.
    """
    total = sum(box_height(t) + BOX_GAP for t in tables)
    n = max(1, round((ASPECT * total / (BOX_W + COL_GAP)) ** 0.5))
    n = min(n, len(tables), MAX_COLS)
    columns: list[list] = [[] for _ in range(n)]
    heights = [0.0] * n
    for t in sorted(tables, key=box_height, reverse=True):
        target = min(range(n), key=lambda i: heights[i])
        columns[target].append(t)
        heights[target] += box_height(t) + BOX_GAP
    return [c for c in columns if c]


def build(db: str, label: str, all_tables):
    tables = [t for t in all_tables if t.database == db]
    names = {t.name for t in tables}
    columns = pack(tables)

    pos: dict[str, tuple[float, float]] = {}
    for ci, col in enumerate(columns):
        x = ci * (BOX_W + COL_GAP)
        y = TITLE_H
        for t in col:
            pos[t.name] = (x, y)
            y += box_height(t) + BOX_GAP

    by_name = {t.name: t for t in tables}
    heading = "Database schema — %s" % label
    subtitle = "%s · %d tables · %d columns · generated from schema.sql" % (
        db, len(tables), sum(len(t.columns) for t in tables)
    )
    content_w = len(columns) * (BOX_W + COL_GAP) - COL_GAP
    width = max(content_w, text_width(heading, 17), text_width(subtitle, 11))
    height = max(y + box_height(by_name[n]) for n, (_x, y) in pos.items())

    svg = Svg(width, height, "%s schema" % label)
    svg.text(0, 18, heading, size=17, weight="600", fill=INK)
    svg.text(0, 36, subtitle, size=11, fill=SOFT)

    # FK connectors, drawn under the boxes
    for t in tables:
        for c in t.columns:
            target = (c.fk or c.logical_fk).split("(")[0]
            if not target or target not in names or target == t.name:
                continue
            sx, sy = pos[t.name]
            tx, ty = pos[target]
            y1 = sy + HEAD_H + t.columns.index(c) * ROW_H + ROW_H / 2
            y2 = ty + HEAD_H / 2
            if tx >= sx:
                p1, p2 = (sx + BOX_W, y1), (tx, y2)
                mid = p1[0] + (p2[0] - p1[0]) / 2
            else:
                p1, p2 = (sx, y1), (tx + BOX_W, y2)
                mid = p2[0] + (p1[0] - p2[0]) / 2
            svg.line([p1, (mid, y1), (mid, y2), p2], EDGE, sw=0.9,
                     dash="" if c.fk else "4 3")

    for t in tables:
        x, y = pos[t.name]
        h = box_height(t)
        svg.rect(x, y, BOX_W, h, BOX_FILL, BOX_LINE, rx=5)
        svg.rect(x, y, BOX_W, HEAD_H, HEAD_FILL, HEAD_FILL, rx=5)
        svg.rect(x, y + HEAD_H - 6, BOX_W, 6, HEAD_FILL, HEAD_FILL, rx=0, sw=0)
        svg.text(x + 10, y + 17.5, t.name, size=12, fill="#FFFFFF", weight="600", mono=True)

        for i, c in enumerate(t.columns):
            ry = y + HEAD_H + i * ROW_H + 11
            if c.pk:
                marker, mink = "PK", PK_INK
            elif c.fk or c.logical_fk:
                marker, mink = "FK", FK_INK
            else:
                marker, mink = "", SOFT
            if marker:
                svg.text(x + 8, ry, marker, size=8, fill=mink, weight="700", mono=True)
            svg.text(x + 30, ry, truncate(c.name, 9.5, 128, mono=True), size=9.5,
                     fill=INK if c.pk else SOFT, mono=True,
                     weight="600" if c.pk else "400")
            svg.text(x + BOX_W - 8, ry, truncate(c.type, 8.5, 92, mono=True), size=8.5,
                     fill=FAINT, anchor="end", mono=True)

    return svg


def generate() -> None:
    tables = load_schema()
    for _dir, db, label in DATABASES:
        svg = build(db, label, tables)
        path = os.path.join(OUT_DIR, "schema-%s.svg" % db.replace("_", "-"))
        svg.save(path)
        print("  wrote %s (%.0f x %.0f)" % (os.path.relpath(path, ROOT), svg.w, svg.h))


if __name__ == "__main__":
    generate()
