"""Render each actor's screen flow to an SVG image file.

Layered left-to-right layout: a screen sits one column right of the screen it
opens from, so columns read as depth from the entry point. Rows inside a column
are ordered by parent row, which keeps most connectors from crossing.

Writes docs/diagrams/img/screen-flow-<actor>.svg

Usage:  python3 scripts/diagrams/gen_screenflow_svg.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen_screenflow_puml import ACTORS, _nearest_visible_parent, _visible
from route_reader import ROOT, _public_routes, guarded_roles, nav_by_kind
from screens import SCREENS, verify
from svg import Svg, truncate

OUT_DIR = os.path.join(ROOT, "docs", "diagrams", "img")

NODE_W, NODE_H = 196.0, 44.0
H_GAP, V_GAP = 178.0, 18.0
TITLE_H = 54.0

INK = "#0F1B1E"
SOFT = "#4A5C63"
EDGE = "#5A7D86"
BOX_FILL = "#DCEBFA"
BOX_LINE = "#4A7EBB"
ENTRY_FILL = "#E7F3EA"
ENTRY_LINE = "#4E8F63"


def build(role, kind, label):
    guards = guarded_roles()
    public, auth = _public_routes()
    by_route = {s.route: s for s in SCREENS}

    vis = _visible(role, kind, guards, public, auth)
    vis_routes = {s.route for s in vis}
    sidebar = set(nav_by_kind().get(kind, [])) if kind else set()

    parent_of: dict[str, tuple[str, str]] = {}
    for s in vis:
        if s.route in sidebar and "/dashboard" in vis_routes and s.route != "/dashboard":
            parent_of[s.route] = ("/dashboard", "sidebar")
            continue
        p = _nearest_visible_parent(s, by_route, vis_routes)
        if p:
            parent_of[s.route] = (p, s.trigger or "")

    depth: dict[str, int] = {}

    def depth_of(route, seen=None):
        if route in depth:
            return depth[route]
        seen = seen or set()
        if route in seen or route not in parent_of:
            depth[route] = 0
            return 0
        seen.add(route)
        depth[route] = depth_of(parent_of[route][0], seen) + 1
        return depth[route]

    for s in vis:
        depth_of(s.route)

    columns: dict[int, list[str]] = {}
    for s in vis:
        columns.setdefault(depth[s.route], []).append(s.route)

    row_of: dict[str, int] = {}
    for d in sorted(columns):
        if d == 0:
            columns[d].sort(key=lambda r: by_route[r].name)
        else:
            columns[d].sort(key=lambda r: (row_of.get(parent_of[r][0], 0), by_route[r].name))
        for i, r in enumerate(columns[d]):
            row_of[r] = i

    pos: dict[str, tuple[float, float]] = {}
    for d, routes in columns.items():
        x = d * (NODE_W + H_GAP)
        for i, r in enumerate(routes):
            pos[r] = (x, TITLE_H + i * (NODE_H + V_GAP))

    width = max(x for x, _ in pos.values()) + NODE_W
    height = max(y for _, y in pos.values()) + NODE_H + (30 if role is None else 0)

    granted = [s for s in vis if s.guest_visible and role is None]
    subtitle = "%d screens · visibility derived from the ProtectedRoute guards in frontend/web" % len(vis)
    if granted:
        subtitle += " · %d granted by the SRS use cases (see note)" % len(granted)

    svg = Svg(width, height, "%s screen flow" % label)
    svg.text(0, 18, "Screen flow — %s" % label, size=17, weight="600", fill=INK)
    svg.text(0, 36, subtitle, size=11, fill=SOFT)

    for child, (parent, trigger) in parent_of.items():
        if parent not in pos or child not in pos:
            continue
        px, py = pos[parent]
        cx, cy = pos[child]
        x1, y1 = px + NODE_W, py + NODE_H / 2
        x2, y2 = cx, cy + NODE_H / 2
        midx = x1 + (x2 - x1) / 2
        straight = abs(y1 - y2) <= 1
        pts = [(x1, y1), (x2, y2)] if straight else [(x1, y1), (midx, y1), (midx, y2), (x2, y2)]
        svg.line(pts, EDGE, sw=1.1)
        if trigger:
            # Sit the label on the horizontal run into the target box: with a fan of
            # edges leaving one parent, a midpoint label would float away from its line.
            svg.label_plate(
                midx, y2 - 8, truncate(trigger, 10, H_GAP - 18), size=10
            )

    for s in vis:
        x, y = pos[s.route]
        entry = s.route not in parent_of
        svg.rect(x, y, NODE_W, NODE_H,
                 ENTRY_FILL if entry else BOX_FILL,
                 ENTRY_LINE if entry else BOX_LINE, rx=5)
        svg.text(x + NODE_W / 2, y + 19, truncate(s.name, 12.5, NODE_W - 18),
                 size=12.5, fill=INK, anchor="middle", weight="600")
        svg.text(x + NODE_W / 2, y + 33, truncate(s.route, 9.5, NODE_W - 18, mono=True),
                 size=9.5, fill=SOFT, anchor="middle", mono=True)

    if granted:
        svg.text(
            0, height + 22,
            "Note: %s are granted to Guest by the use cases, but sit behind the auth "
            "middleware today (not in PUBLIC_ROUTES)."
            % ", ".join(s.route for s in granted),
            size=10, fill=SOFT,
        )
    return svg


def generate() -> None:
    problems = verify()
    if problems:
        for p in problems:
            print("  -", p)
        raise SystemExit(1)
    for slug, role, kind, label in ACTORS:
        svg = build(role, kind, label)
        path = os.path.join(OUT_DIR, "screen-flow-%s.svg" % slug)
        svg.save(path)
        print("  wrote %s (%.0f x %.0f)" % (os.path.relpath(path, ROOT), svg.w, svg.h))


if __name__ == "__main__":
    generate()
