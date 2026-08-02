"""Generate the SRS §3.1.a screen flow diagrams, one per actor.

A screen appears in an actor's flow only if that actor's role passes the
ProtectedRoute guard on its route, so the diagrams cannot drift from the guards.
Screens reached from the sidebar are drawn from the Dashboard; everything else
hangs off its parent screen with the trigger that opens it.

Writes docs/diagrams/screen-flow-<actor>.puml.

Usage:  python3 scripts/diagrams/gen_screenflow_puml.py
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from route_reader import ROOT, _public_routes, guarded_roles, nav_by_kind, roles_for
from screens import SCREENS, Screen, verify

OUT_DIR = os.path.join(ROOT, "docs", "diagrams")

# SRS actor -> role used for the guard check, and the dashboard kind for the sidebar.
ACTORS = [
    ("guest", None, None, "Guest"),
    ("patient", "PATIENT", "patient", "Patient"),
    ("doctor", "DOCTOR", "doctor", "Doctor"),
    ("nurse", "NURSE", "nurse", "Nurse"),
    ("receptionist", "RECEPTIONIST", "receptionist", "Receptionist"),
    ("manager", "MANAGER", "manager", "Clinic Manager"),
    ("admin", "ADMIN", "admin", "Admin"),
]

HEADER = """@startuml smile-screen-flow-{slug}
title S.M.I.L.E — Screen Flow of {label}

' GENERATED FILE — do not edit by hand.
' Source: frontend/web/src/app (routes) + shared/constants/{{roles,routes,nav}}.ts
' Regenerate: python3 scripts/diagrams/gen_screenflow_puml.py

skinparam linetype ortho
skinparam shadowing false
skinparam roundcorner 8
skinparam rectangle {{
  BackgroundColor #DCEBFA
  BorderColor #4A7EBB
  FontName Segoe UI
  FontSize 12
}}
skinparam ArrowColor #4A7EBB
skinparam ArrowFontName Segoe UI
skinparam ArrowFontSize 10

"""

FOOTER = "\n@enduml\n"


def _ident(route: str) -> str:
    return "S_" + re.sub(r"\W+", "_", route).strip("_").lower() or "S_root"


def _visible(role: str | None, kind: str | None, guards, public, auth) -> list[Screen]:
    out = []
    for s in SCREENS:
        # Account creation only makes sense before there is a session, so it stays
        # in the Guest flow and out of every signed-in actor's. The sign-in chain
        # goes the other way: it opens each actor's flow rather than the guest's.
        if s.guest_only and role is not None:
            continue
        if s.hide_from_guest and role is None:
            continue
        # /dashboards/<kind> is picked by resolveDashboardKind(), not by a guard:
        # each actor only ever lands on the one matching their most-privileged role.
        m = re.fullmatch(r"/dashboards/(\w+)", s.route)
        if m and m.group(1) != kind:
            continue
        allowed = roles_for(s.route, guards, public, auth)
        if role is None:
            # Public routes, plus the screens the SRS grants Guest (UC-23/24/62) even
            # though the middleware currently requires a session for them.
            if not allowed or s.guest_visible:
                out.append(s)
        elif not allowed or role in allowed:
            out.append(s)
    return out


def _nearest_visible_parent(s: Screen, by_route: dict[str, Screen], visible: set[str]) -> str | None:
    """Walk up the parent chain until a screen this actor can actually see."""
    seen = set()
    parent = s.parent
    while parent and parent not in seen:
        if parent in visible:
            return parent
        seen.add(parent)
        parent = by_route[parent].parent if parent in by_route else None
    return None


def build(slug: str, role: str | None, kind: str | None, label: str) -> str:
    guards = guarded_roles()
    public, auth = _public_routes()
    by_route = {s.route: s for s in SCREENS}

    vis = _visible(role, kind, guards, public, auth)
    vis_routes = {s.route for s in vis}
    sidebar = set(nav_by_kind().get(kind, [])) if kind else set()

    parts = [HEADER.format(slug=slug, label=label)]
    for s in vis:
        parts.append('rectangle "%s" as %s' % (s.name, _ident(s.route)))
    parts.append("")

    edges: list[str] = []
    for s in vis:
        if s.route in sidebar and "/dashboard" in vis_routes and s.route != "/dashboard":
            edges.append('%s --> %s : Sidebar "%s"' % (_ident("/dashboard"), _ident(s.route), s.name))
            continue
        parent = _nearest_visible_parent(s, by_route, vis_routes)
        if parent:
            trigger = s.trigger or "Navigate"
            edges.append("%s --> %s : %s" % (_ident(parent), _ident(s.route), trigger))
    parts.extend(sorted(set(edges)))

    orphans = [
        s.name for s in vis
        if s.parent and not _nearest_visible_parent(s, by_route, vis_routes) and s.route not in sidebar
    ]
    if orphans:
        parts.append("\nnote bottom\n  Reachable by deep link only for this actor:\n  %s\nend note" % ", ".join(orphans))

    parts.append(
        "\nlegend bottom\n  %d screens visible to %s.\n  Visibility is derived from the ProtectedRoute guards in frontend/web.\nendlegend"
        % (len(vis), label)
    )
    return "\n".join(parts) + FOOTER


def generate() -> None:
    problems = verify()
    if problems:
        print("screen catalogue is out of sync with the app router:")
        for p in problems:
            print("  -", p)
        raise SystemExit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    for slug, role, kind, label in ACTORS:
        path = os.path.join(OUT_DIR, "screen-flow-%s.puml" % slug)
        body = build(slug, role, kind, label)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(body)
        count = body.count("\nrectangle ") + body.count("\nrectangle")
        print("  wrote %s (%d screens)" % (os.path.relpath(path, ROOT), len(re.findall(r"^rectangle ", body, re.M))))


if __name__ == "__main__":
    generate()
