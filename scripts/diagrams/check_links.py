"""Check the screen flow edges against the navigation the frontend actually has.

Screens and role visibility are derived from the app router and its guards, but the
*transitions* in screens.py (parent + trigger) are hand-written. This script looks
for real navigation targets in frontend/web — <Link href>, router.push/replace, and
ROUTES.* references — and reports:

  * catalogue screens nothing links to (reachable only by typing the URL)
  * navigation targets that reach a screen the catalogue gives a different parent

Usage:  python3 scripts/diagrams/check_links.py
"""

from __future__ import annotations

import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from route_reader import WEB, route_of
from screens import SCREENS

# ROUTES.FOO or ROUTES.FOO(...) -> the literal path, so link targets resolve
ROUTE_CONST = re.compile(r"^\t(\w+):\s*(?:\"([^\"]+)\"|\([^)]*\)\s*=>\s*`([^`]+)`)", re.M)
LINKS = [
    # template literals first: `/patients/${id}/images` must be read whole, not
    # truncated at the first ${
    re.compile(r"href=\{?`(\$\{ROUTES\.\w+\}[^`]*|/[^`]*)`"),
    re.compile(r"router\.(?:push|replace)\(\s*`(\$\{ROUTES\.\w+\}[^`]*|/[^`]*)`"),
    re.compile(r'href=\{?["\'](/[^"\'{}\s]*)'),
    # nav.ts and friends declare targets as an object property: href: "/admin/..."
    re.compile(r'href:\s*["\'`](/[^"\'`{}\s]*)'),
    re.compile(r'router\.(?:push|replace)\(\s*["\'](/[^"\'{}\s]*)'),
    re.compile(r"\bROUTES\.(\w+)"),
]


def route_constants() -> dict[str, str]:
    src = open(os.path.join(WEB, "shared", "constants", "routes.ts"), encoding="utf-8").read()
    out = {}
    for name, literal, template in ROUTE_CONST.findall(src):
        out[name] = literal or re.sub(r"\$\{[^}]*\}", "[id]", template)
    return out


def normalise(path: str, consts: dict[str, str] | None = None) -> str:
    if consts:
        path = re.sub(r"\$\{ROUTES\.(\w+)\}", lambda m: consts.get(m.group(1), m.group(0)), path)
    path = re.sub(r"\$\{[^}]*\}", "[id]", path).split("?")[0].rstrip("/")
    path = re.sub(r"/\d+(?=/|$)", "/[id]", path)
    return path or "/"


def collect_targets() -> dict[str, set[str]]:
    """route (or 'shared') -> set of routes it navigates to."""
    consts = route_constants()
    known = {s.route for s in SCREENS}
    out: dict[str, set[str]] = {}
    for path in glob.glob(os.path.join(WEB, "**", "*.tsx"), recursive=True) + glob.glob(
        os.path.join(WEB, "**", "*.ts"), recursive=True
    ):
        if path.endswith((".test.tsx", ".test.ts", ".spec.tsx", ".spec.ts")):
            continue
        src = open(path, encoding="utf-8").read()
        found = set()
        for rx in LINKS:
            for m in rx.findall(src):
                target = consts.get(m, m) if not m.startswith("/") else m
                target = normalise(target, consts)
                if target in known:
                    found.add(target)
        if not found:
            continue
        rel = os.path.relpath(path, os.path.join(WEB, "app"))
        owner = route_of(path) if not rel.startswith("..") else "shared/features"
        out.setdefault(owner, set()).update(found)
    return out


def main() -> None:
    targets = collect_targets()
    linked_from: dict[str, set[str]] = {}
    for owner, dests in targets.items():
        for d in dests:
            linked_from.setdefault(d, set()).add(owner)

    print("frontend navigation targets found in %d source locations\n" % len(targets))

    orphans = [s for s in SCREENS if s.route not in linked_from and s.route != "/"]
    print("Screens nothing in the frontend links to (%d):" % len(orphans))
    for s in orphans:
        print("   %-44s %s" % (s.route, s.name))

    print("\nScreens whose catalogue parent is not among the linking pages:")
    mismatched = 0
    for s in SCREENS:
        if not s.parent or s.route not in linked_from:
            continue
        sources = linked_from[s.route]
        if s.parent in sources or "shared/features" in sources:
            continue
        mismatched += 1
        print("   %-40s parent=%-26s linked from %s"
              % (s.route, s.parent, ", ".join(sorted(sources))[:60]))
    if not mismatched:
        print("   (none — every claimed parent links to its child)")


if __name__ == "__main__":
    main()
