"""Fill 'Project Weekly Report_GroupName.xlsx' — one sheet per project week.

Everything comes from the repository: the weeks are the calendar weeks the project
actually ran, the tasks are the areas that were worked on in that week (taken from
the conventional-commit scopes), and the in-charge column is whoever authored most
of that week's commits in that area. Report 1-7 milestones are laid over the same
timeline.

Usage:  python3 scripts/reports/gen_weekly_report.py [--write]
"""

from __future__ import annotations

import argparse
import collections
import datetime
import os
import re
import shutil
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from xlsx import Workbook

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BOOK = os.path.join(ROOT, "docs", "testing", "Project Weekly Report_GroupName.xlsx")

# git identity -> the name used in the In-charge column
AUTHORS = {
    "hugebenevolence": "Nhan", "LTP": "Phat", "LTPPPP": "Phat",
    "Aohkne": "Khoa", "KHOA": "Khoa", "chinhwind": "Chinh", "Chinh": "Chinh",
}

# commit scope -> the task name a reader would recognise
SCOPES = {
    "clinical-emr": "Clinical EMR service", "clinical": "Clinical examination workflow",
    "user-management": "User & role management", "specialty": "Specialty catalog",
    "doctor-schedules": "Doctor scheduling", "appointments": "Appointment booking",
    "ai": "AI services (KYC OCR, booking assistant)", "kyc": "KYC identity verification",
    "web": "Web frontend", "fe": "Web frontend", "frontend": "Web frontend",
    "ui": "Web UI revision", "landing-page": "Landing page",
    "be": "Backend services", "iam": "IAM service", "gateway": "API gateway",
    "auth": "Authentication", "auth-google": "Google OAuth sign-in",
    "swagger": "API documentation", "docs": "Project documentation",
    "deploy": "Deployment", "cd": "CI/CD pipeline", "docker": "Container setup",
    "cert": "TLS certificates", "db": "Database schema", "seed": "Seed data",
    "i18n": "Bilingual support (VI/EN)", "patients": "Patient management",
    "booking": "Booking flow", "chat": "Chat assistant",
    "main_flow": "End-to-end flow verification", "demo": "Demo preparation",
    "lint": "Code quality", "chore": "Housekeeping", "v2": "Feature revision",
    "dev": "Developer tooling", "test": "Automated tests", "fix": "Defect fixing",
    "feat": "Feature development", "refactor": "Refactoring", "misc": "General maintenance",
    "update": "Incremental updates", "core": "Core modules", "*": "Cross-cutting fixes",
}

# Report 1-7: (title, due date). Report 7 lands after the last development week.
DELIVERABLES = [
    ("Report 1 - Project Plan", datetime.date(2026, 5, 22)),
    ("Report 2 - Requirement Elicitation", datetime.date(2026, 6, 5)),
    ("Report 3 - Software Requirement Specification", datetime.date(2026, 6, 19)),
    ("Report 4 - Software Design Document", datetime.date(2026, 7, 3)),
    ("Report 5 - Test Report & Unit Test", datetime.date(2026, 7, 17)),
    ("Report 6 - Installation & User Guide", datetime.date(2026, 7, 31)),
    ("Report 7 - Final Report", datetime.date(2026, 8, 14)),
]

GROUP = "SEP490_G5"
WEEK1_MONDAY = datetime.date(2026, 5, 11)
STATUS_ROWS, ISSUE_ROWS, PLAN_ROWS, OTHER_ROWS = 5, 3, 4, 3


def label(scope: str) -> str:
    return SCOPES.get(scope, scope.replace("-", " ").replace("_", " ").capitalize())


def git_weeks():
    out = subprocess.run(
        ["git", "log", "--all", "--no-merges", "--format=%ad|%an|%s", "--date=short"],
        capture_output=True, text=True, cwd=ROOT,
    ).stdout.splitlines()
    weeks: dict[int, dict] = collections.defaultdict(
        lambda: {"scopes": collections.Counter(),
                 "owner": collections.defaultdict(collections.Counter),
                 "fixes": collections.Counter(), "total": 0}
    )
    for line in out:
        try:
            d, a, s = line.split("|", 2)
        except ValueError:
            continue
        day = datetime.date.fromisoformat(d)
        w = (day - WEEK1_MONDAY).days // 7 + 1
        if w < 1:
            continue
        m = re.match(r"(\w+)\(([^)]+)\):", s)
        kind = m.group(1) if m else (s.split(":")[0] if ":" in s else "misc")
        scope = (m.group(2) if m else kind).split("/")[0].strip().lower()
        who = AUTHORS.get(a, a)
        weeks[w]["scopes"][scope] += 1
        weeks[w]["owner"][scope][who] += 1
        weeks[w]["total"] += 1
        if kind.lower().startswith(("fix", "revert", "hotfix")):
            weeks[w]["fixes"][scope] += 1
    return weeks


def week_dates(w: int) -> tuple[datetime.date, datetime.date]:
    mon = WEEK1_MONDAY + datetime.timedelta(days=7 * (w - 1))
    return mon, mon + datetime.timedelta(days=6)


def fmt(d: datetime.date) -> str:
    return d.strftime("%d/%m/%Y")


def build_rows(w: int, weeks, last_week: int):
    """(status, issues, plan, other) row lists for one week."""
    data = weeks[w]
    mon, sun = week_dates(w)
    current = w == last_week

    status = []
    for i, (scope, n) in enumerate(data["scopes"].most_common(STATUS_ROWS), 1):
        who = data["owner"][scope].most_common(1)[0][0]
        status.append([
            str(i), label(scope), who,
            "In Progress" if current else "Done",
            "%d commits this week" % n,
        ])

    issues = []
    for i, (scope, n) in enumerate(data["fixes"].most_common(ISSUE_ROWS), 1):
        who = data["owner"][scope].most_common(1)[0][0]
        issues.append([
            str(i), "Defects raised in %s" % label(scope), who,
            "In Progress" if current else "Closed",
            "%d fix commit%s merged" % (n, "" if n == 1 else "s"),
        ])
    if not issues:
        issues.append(["1", "No blocking issue raised this week", "", "Closed", ""])

    plan = []
    nxt = weeks.get(w + 1)
    if nxt:
        n_mon, n_sun = week_dates(w + 1)
        for i, (scope, n) in enumerate(nxt["scopes"].most_common(PLAN_ROWS), 1):
            plan.append([
                str(i), label(scope), nxt["owner"][scope].most_common(1)[0][0],
                fmt(n_sun), "Planned for week %d" % (w + 1),
            ])
    else:
        for i, (title, due) in enumerate(
            [(t, d) for t, d in DELIVERABLES if d > sun][:PLAN_ROWS], 1
        ):
            plan.append([str(i), title, "All members", fmt(due), "Remaining deliverable"])

    other = []
    for title, due in DELIVERABLES:
        if mon <= due <= sun:
            other.append([str(len(other) + 1), "%s submitted" % title,
                          "All members", fmt(due), "Deliverable milestone"])
    upcoming = [(t, d) for t, d in DELIVERABLES if d > sun]
    if upcoming and len(other) < OTHER_ROWS:
        t, d = upcoming[0]
        other.append([str(len(other) + 1), "Next deliverable: %s" % t,
                      "All members", fmt(d), "Due in %d day(s)" % (d - sun).days])
    if not other:
        other.append(["1", "No new matter raised", "", "", ""])
    return status, issues, plan, other


SECTIONS = [
    ("I. Status Report", ["#", "Project Task", "In-charge", "Status", "Notes (Work Item in Details)"]),
    ("II. Project Issues", ["#", "Project Issue", "Owner", "Status", "Notes (Solution, Suggestion, etc.)"]),
    ("III. Next Week Plan", ["#", "Project Work Item", "In-charge", "Deadline", "Notes (Task Details, etc.)"]),
    ("IV. Other Project Matters/Suggestions", ["#", "Project Matter/Suggestions", "Raised By", "Date", "Notes"]),
]

# style ids lifted from the template's own rows
S_TITLE, S_LABEL, S_SECTION, S_HDR_A, S_HDR, S_DATA_A, S_DATA = 3, 4, 7, 5, 6, 1, 2


def sheet_xml(template: str, w: int, weeks, last_week: int) -> str:
    mon, sun = week_dates(w)
    status, issues, plan, other = build_rows(w, weeks, last_week)

    rows, r = [], 1

    def add(cells):
        nonlocal r
        xml = '<row r="%d">' % r
        for col, (val, style) in zip("ABCDE", cells):
            if val == "" and style in (S_DATA, S_DATA_A):
                xml += '<c r="%s%d" s="%d"/>' % (col, r, style)
            else:
                xml += ('<c r="%s%d" s="%d" t="inlineStr"><is><t xml:space="preserve">%s</t>'
                        "</is></c>" % (col, r, style, _esc(val)))
        rows.append(xml + "</row>")
        r += 1

    add([("PROJECT REPORT", S_TITLE)])
    add([("Group", S_LABEL), (GROUP, S_LABEL)])
    add([("Week", S_LABEL), ("%s-%s" % (fmt(mon), fmt(sun)), S_LABEL)])
    r += 1  # spacer

    for (title, headers), body in zip(SECTIONS, (status, issues, plan, other)):
        add([(title, S_SECTION)])
        add([(headers[0], S_HDR_A)] + [(h, S_HDR) for h in headers[1:]])
        for line in body:
            add([(line[0], S_DATA_A)] + [(c, S_DATA) for c in line[1:]])
        r += 1  # spacer

    body = "".join(rows)
    xml = re.sub(r'<dimension ref="[^"]*"/>', '<dimension ref="A1:E%d"/>' % (r - 1), template)
    xml = re.sub(r"<sheetData>.*?</sheetData>", lambda _m: "<sheetData>%s</sheetData>" % body, xml, flags=re.S)
    xml = re.sub(r"<legacyDrawing[^>]*/>", "", xml)   # comments belong to sheet1 only
    return xml


def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="write the workbook (default: preview)")
    args = ap.parse_args()

    weeks = git_weeks()
    last_week = max(weeks)
    print("project weeks: W1 (%s) .. W%d (%s)"
          % (fmt(week_dates(1)[0]), last_week, fmt(week_dates(last_week)[1])))

    if not args.write:
        for w in sorted(weeks):
            mon, sun = week_dates(w)
            status, issues, plan, other = build_rows(w, weeks, last_week)
            print("\n== W%d  %s-%s   (%d commits)" % (w, fmt(mon), fmt(sun), weeks[w]["total"]))
            for row in status:
                print("   %s %-42s %-6s %-12s %s" % tuple(row))
            for row in other:
                print("   * %s (%s)" % (row[1], row[3]))
        return

    wb = Workbook(BOOK)
    backup_dir = os.path.join(os.path.dirname(BOOK), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(
        backup_dir,
        os.path.basename(BOOK).replace(".xlsx", ".BAK-%s.xlsx" % time.strftime("%Y%m%d-%H%M%S")),
    )
    shutil.copy(BOOK, backup)
    print("  backup %s" % os.path.relpath(backup, ROOT))

    template = wb.blobs["xl/worksheets/sheet1.xml"].decode("utf-8")
    ct = wb.blobs["[Content_Types].xml"].decode("utf-8")
    rels = wb.blobs["xl/_rels/workbook.xml.rels"].decode("utf-8")
    book = wb.blobs["xl/workbook.xml"].decode("utf-8")

    sheet_tags = []
    max_rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', rels))
    for w in sorted(weeks):
        part = "xl/worksheets/sheet%d.xml" % w
        wb.blobs[part] = sheet_xml(template, w, weeks, last_week).encode("utf-8")
        if part not in wb.names:
            wb.names.append(part)
            ct = ct.replace(
                "</Types>",
                '<Override PartName="/%s" ContentType="application/vnd.openxmlformats-'
                'officedocument.spreadsheetml.worksheet+xml"/></Types>' % part,
            )
        if w == 1:
            rid = re.search(r'Id="(rId\d+)"[^>]*worksheets/sheet1\.xml"', rels)
            rid = rid.group(1) if rid else "rId1"
        else:
            max_rid += 1
            rid = "rId%d" % max_rid
            rels = rels.replace(
                "</Relationships>",
                '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/'
                '2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/></Relationships>'
                % (rid, w),
            )
        sheet_tags.append('<sheet name="W%d" sheetId="%d" r:id="%s"/>' % (w, w, rid))

    book = re.sub(r"<sheets>.*?</sheets>", "<sheets>%s</sheets>" % "".join(sheet_tags), book, flags=re.S)
    wb.blobs["[Content_Types].xml"] = ct.encode("utf-8")
    wb.blobs["xl/_rels/workbook.xml.rels"] = rels.encode("utf-8")
    wb.blobs["xl/workbook.xml"] = book.encode("utf-8")
    wb.save()
    print("  wrote %d weekly sheets (W1..W%d) to %s"
          % (len(weeks), last_week, os.path.relpath(BOOK, ROOT)))


if __name__ == "__main__":
    main()
