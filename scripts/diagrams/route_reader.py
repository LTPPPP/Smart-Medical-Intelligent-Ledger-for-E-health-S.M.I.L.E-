"""Read the Next.js app router and its role guards out of frontend/web.

Everything here is derived from the code, so the generated screen flows stay
honest when routes or guards change:

  * routes            frontend/web/src/app/**/page.tsx
  * role groups       frontend/web/src/shared/constants/roles.ts   (ADMIN_ROLES = [...])
  * per-route guard   <ProtectedRoute requiredRoles={GROUP}> in page.tsx / layout.tsx
  * public routes     PUBLIC_ROUTES / AUTH_ROUTES in shared/constants/routes.ts
  * sidebar entries   navForKind() in shared/constants/nav.ts
"""

from __future__ import annotations

import glob
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WEB = os.path.join(ROOT, "frontend", "web", "src")

ALL_ROLES = ["ADMIN", "MANAGER", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"]

# Route groups "(pages)", "(auth)", "(user)" are organisational and not part of the URL.
_GROUP_SEGMENT = re.compile(r"\((?:[^)/]+)\)")


def route_of(page_path: str) -> str:
    rel = os.path.relpath(os.path.dirname(page_path), os.path.join(WEB, "app"))
    parts = [p for p in rel.split(os.sep) if p not in (".",) and not _GROUP_SEGMENT.fullmatch(p)]
    return "/" + "/".join(parts) if parts else "/"


def list_routes() -> list[str]:
    pages = glob.glob(os.path.join(WEB, "app", "**", "page.tsx"), recursive=True)
    return sorted({route_of(p) for p in pages})


def role_groups() -> dict[str, list[str]]:
    """ADMIN_ROLES / EXAMINATION_ROLES / ... -> concrete role names.

    Most groups live in shared/constants/roles.ts, but a few are colocated with
    their feature (features/service/serviceAccess.ts), so scan the whole tree.
    """
    groups: dict[str, list[str]] = {}
    for path in glob.glob(os.path.join(WEB, "**", "*.ts"), recursive=True):
        if path.endswith((".d.ts", ".test.ts", ".spec.ts")):
            continue
        src = open(path, encoding="utf-8").read()
        for m in re.finditer(r"export const (\w+_ROLES)\s*(?::[^=]*)?=\s*\[(.*?)\]", src, re.S):
            roles = re.findall(r"ROLE\.(\w+)", m.group(2))
            if roles:
                groups[m.group(1)] = [r for r in ALL_ROLES if r in roles]
    return groups


def _public_routes() -> tuple[set[str], set[str]]:
    src = open(os.path.join(WEB, "shared", "constants", "routes.ts"), encoding="utf-8").read()
    consts = dict(re.findall(r"^\t(\w+):\s*\"([^\"]+)\",", src, re.M))

    def resolve(block: str) -> set[str]:
        return {consts[k] for k in re.findall(r"ROUTES\.(\w+)", block) if k in consts}

    pub = re.search(r"export const PUBLIC_ROUTES\s*=\s*\[(.*?)\]", src, re.S)
    auth = re.search(r"export const AUTH_ROUTES\s*=\s*\[(.*?)\]", src, re.S)
    return (
        resolve(pub.group(1)) if pub else set(),
        resolve(auth.group(1)) if auth else set(),
    )


def guarded_roles() -> dict[str, list[str]]:
    """route -> roles allowed by the nearest ProtectedRoute guard.

    A guard in layout.tsx covers the whole subtree, so guards are matched by
    longest route prefix at lookup time.
    """
    groups = role_groups()
    out: dict[str, list[str]] = {}
    files = glob.glob(os.path.join(WEB, "app", "**", "*.tsx"), recursive=True)
    for path in files:
        base = os.path.basename(path)
        if base not in ("page.tsx", "layout.tsx"):
            continue
        src = open(path, encoding="utf-8").read()
        m = re.search(r"<ProtectedRoute[^>]*requiredRoles=\{(\w+)\}", src, re.S)
        if not m:
            continue
        group = m.group(1)
        if group not in groups:
            raise KeyError(
                "%s guards with %s, which no 'export const %s = [...]' defines"
                % (os.path.relpath(path, WEB), group, group)
            )
        out[route_of(path)] = groups[group]
    return out


def roles_for(route: str, guards: dict[str, list[str]], public: set[str], auth: set[str]) -> list[str]:
    """Roles that can reach a route: [] means public/guest."""
    if route in public or route in auth or route == "/":
        return []
    best = ""
    for guarded in guards:
        if (route == guarded or route.startswith(guarded.rstrip("/") + "/")) and len(guarded) > len(best):
            best = guarded
    if best:
        return guards[best]
    if route.startswith("/admin"):
        return ["ADMIN"]
    return list(ALL_ROLES)  # authenticated, no extra role guard


def nav_by_kind() -> dict[str, list[str]]:
    """Sidebar hrefs per dashboard kind, straight out of navForKind()."""
    nav = open(os.path.join(WEB, "shared", "constants", "nav.ts"), encoding="utf-8").read()
    routes_src = open(os.path.join(WEB, "shared", "constants", "routes.ts"), encoding="utf-8").read()
    consts = dict(re.findall(r"^\t(\w+):\s*\"([^\"]+)\",", routes_src, re.M))

    items: dict[str, str] = {}
    for m in re.finditer(r"const (NAV_\w+): NavItem = \{(.*?)\};", nav, re.S):
        body = m.group(2)
        href = re.search(r"href:\s*(?:ROUTES\.(\w+)|\"([^\"]+)\")", body)
        if not href:
            continue
        items[m.group(1)] = consts.get(href.group(1), href.group(2)) if href.group(1) else href.group(2)

    out: dict[str, list[str]] = {}
    switch = re.search(r"export function navForKind.*", nav, re.S)
    if switch:
        for case in re.finditer(r'case "(\w+)":|case "(\w+)":\s*\n\s*default:', switch.group(0)):
            pass
        for m in re.finditer(r'case "(\w+)":(.*?)return \[(.*?)\];', switch.group(0), re.S):
            out[m.group(1)] = [items[n] for n in re.findall(r"NAV_\w+", m.group(3)) if n in items]
        tail = re.search(r'case "patient":\s*default:\s*return \[(.*?)\];', switch.group(0), re.S)
        if tail:
            out["patient"] = [items[n] for n in re.findall(r"NAV_\w+", tail.group(1)) if n in items]
    return out


def summary() -> None:
    routes = list_routes()
    guards = guarded_roles()
    public, auth = _public_routes()
    print("%d routes, %d role groups, %d guarded subtrees" % (len(routes), len(role_groups()), len(guards)))
    for r in routes:
        who = roles_for(r, guards, public, auth)
        print("  %-52s %s" % (r, ", ".join(who) if who else "(public)"))
    print("\nsidebar:")
    for kind, hrefs in nav_by_kind().items():
        print("  %-13s %s" % (kind, " ".join(hrefs)))


if __name__ == "__main__":
    summary()
