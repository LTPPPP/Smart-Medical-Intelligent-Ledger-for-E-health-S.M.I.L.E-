"""Fill 'Report3_Project Tracking.xlsx' — WBS, Issues, Defects and Q&A.

  WBS      the 55 screens documented in Report3 §3.1.b. The iteration each screen
           was planned into is taken from the week its page first appeared in git,
           so the plan matches what was actually built when.
  Issues   the defect-heavy areas surfaced by the weekly report, plus the document
           corrections raised while reconciling Report3 and Report4.
  Defects  concrete defects found by checking the documents against the code.
  Q&A      the open questions those checks raised.

Usage:
  python3 scripts/reports/gen_project_tracking.py           # preview
  python3 scripts/reports/gen_project_tracking.py --write   # write the workbook
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import shutil
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

from screens import SCREENS  # noqa: E402
from xlsx import Workbook  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BOOK = os.path.join(ROOT, "docs", "testing", "Report3_Project Tracking.xlsx")
WEB_APP = os.path.join(ROOT, "frontend", "web", "src", "app")

OWNER = "ChinhBCCE181383"
WEEK1_MONDAY = datetime.date(2026, 5, 11)

# Screens carrying several entities or a multi-step workflow are Complex; single
# purpose pages with a handful of fields are Simple; everything else Medium.
COMPLEX = {
    "/examinations/[id]", "/appointments/[id]", "/appointments/new", "/dashboard",
    "/admin/users-management", "/patients/[id]", "/patients/[id]/medical-records/[recordId]",
    "/dental-images", "/appointments/[id]/payment", "/treatment-plans", "/clinics/[id]",
    "/schedules/doctors", "/admin/kyc-management", "/chat",
}
SIMPLE = {
    "/", "/login", "/register", "/forgot-password", "/reset-password", "/unauthorized",
    "/google-callback", "/auth/google/callback", "/profile", "/specialties",
    "/prescriptions", "/schedules/shifts", "/schedules/leaves/new", "/admin",
    "/dashboards/doctor", "/dashboards/patient", "/appointments/[id]/payment/callback",
}


def level_of(route: str) -> str:
    if route in COMPLEX:
        return "Complex"
    if route in SIMPLE:
        return "Simple"
    return "Medium"


def first_seen() -> dict[str, datetime.date]:
    """route -> the date its page.tsx was first committed.

    The page file is located on disk first (route groups like (pages) and dynamic
    segments like [id] make a pathspec glob unreliable), then asked of git.
    """
    import glob as _glob

    from route_reader import route_of

    out: dict[str, datetime.date] = {}
    for path in _glob.glob(os.path.join(WEB_APP, "**", "page.tsx"), recursive=True):
        rel = os.path.relpath(path, ROOT)
        dates = subprocess.run(
            ["git", "log", "--all", "--diff-filter=A", "--format=%ad", "--date=short", "--", rel],
            capture_output=True, text=True, cwd=ROOT,
        ).stdout.split()
        if dates:
            out[route_of(path)] = datetime.date.fromisoformat(dates[-1])
    return out


def iteration_of(day: datetime.date | None) -> str:
    if not day:
        return "Iteration 2"
    week = (day - WEEK1_MONDAY).days // 7 + 1
    return "Iteration %d" % min(4, max(1, (week - 1) // 3 + 1))


def wbs_rows() -> list[list[str]]:
    seen = first_seen()
    rows = []
    for i, s in enumerate(SCREENS):
        rows.append([
            str(i), s.name, s.feature, level_of(s.route),
            s.description, iteration_of(seen.get(s.route)), "Done",
        ])
    return rows


# ── Issues ────────────────────────────────────────────────────────────────────
# (issue, potential impact, priority, owner, open, close, status, notes)
# Delivery issues sit with whoever owned that area in git (see the weekly report);
# the document corrections were raised and closed by OWNER.
ISSUES = [
    ("Web frontend carried the largest share of defect fixes",
     "Rework late in the schedule; UI regressions reaching the demo", "High", "Khoa",
     "20/07/2026", "02/08/2026", "Closed",
     "Raised from the weekly report; fix commits concentrated in the web package in W11-W12"),
    ("Seed data and database migrations required repeated correction",
     "Unreliable demo data and failed environment resets", "Medium", "Nhan",
     "27/07/2026", "02/08/2026", "Closed",
     "Weekly report W12; resolved by consolidating the seed scripts"),
    ("Appointment booking defects across scheduling and payment",
     "Double booking or unpaid appointments reaching a clinic", "High", "Khoa",
     "20/07/2026", "02/08/2026", "Closed",
     "Weekly report W11-W12; covered by the no-double-booking exclusion constraints"),
    ("Four competing use case lists across the documents",
     "Requirements traceability breaks between SRS, SDD and the diagrams", "High", OWNER,
     "30/07/2026", "30/07/2026", "Closed",
     "Document change: reconciled to a single backlog of 87 use cases"),
    ("Blockchain, Hyperledger and IPFS specified as delivered",
     "The SRS commits the team to a dropped feature", "High", OWNER,
     "01/08/2026", "01/08/2026", "Closed",
     "Document change: SI-4, R-4, P-4 and DC-3 rewritten around the AI services actually built"),
    ("Digital signature entity and screens documented but not implemented",
     "Reviewers expect a feature that does not exist", "High", OWNER,
     "01/08/2026", "01/08/2026", "Closed",
     "Document change: removed from the entity list, ERD and the SDD database design"),
    ("Entity attributes drifted from the deployed database",
     "Design documents mislead implementation and testing", "High", OWNER,
     "01/08/2026", "01/08/2026", "Closed",
     "Document change: gender corrected to SMALLINT (ISO 5218); column widths refreshed from schema.sql"),
    ("Screen list omitted twelve implemented screens",
     "Test coverage planned against an incomplete screen list", "Medium", OWNER,
     "01/08/2026", "01/08/2026", "Closed",
     "Document change: §3.1.b regenerated from the app router — Register, KYC, audit log, refunds and others added"),
    ("Section 3.1 numbering skipped letter c",
     "Cross references to §3.1.c point at the wrong section", "Low", OWNER,
     "01/08/2026", "01/08/2026", "Closed",
     "Document change: Non-Screen Functions renumbered from d to c"),
    ("Screen flow diagrams still show a dropped feature",
     "Report 3 contradicts itself between diagram and table", "Medium", OWNER,
     "01/08/2026", "", "Open",
     "Document change: replacement images generated under docs/diagrams/img; Word images not yet swapped"),
]

# ── Defects ───────────────────────────────────────────────────────────────────
# (feature, function/screen, tester, description, assign to, status, notes)
DEFECTS = [
    ("Patient Management", "Patient Images", OWNER,
     "No link anywhere in the frontend navigates to /patients/[id]/images; the page is reachable only by typing the URL",
     "Nhan", "Open", "Found by scanning Link/router.push targets across frontend/web"),
    ("Patient Management", "Medical Record Detail", OWNER,
     "/patients/[id]/medical-records/[recordId] has no inbound link, although the 'new record' page is linked",
     "Nhan", "Open", "MedicalRecordList links only to medical-records/new"),
    ("Schedule Management", "Update Schedule", OWNER,
     "/schedules/doctors/edit/[scheduleId] has no inbound link from the doctor schedule list",
     "Phat", "Open", "Edit action missing from the schedule table"),
    ("Clinic Management", "Clinic Page", OWNER,
     "Guest cannot open /clinics or /specialties although UC-23, UC-24 and UC-62 grant Guest those use cases",
     "Khoa", "Open", "Routes are absent from PUBLIC_ROUTES, so the middleware redirects to login"),
    ("Appointment Management", "Appointment List", OWNER,
     "AppointmentEntity declares clinic_id NOT NULL but no migration adds the constraint, so the column is nullable",
     "Phat", "Open", "Entity drift recorded in clinic-service/schema.sql"),
    ("User Management", "Notification Centre", OWNER,
     "notification_push_subscriptions existed only as a migration and was missing from schema.sql",
     OWNER, "Closed", "Backfilled into database/iam-service/user-service/schema.sql"),
    ("Appointment Management", "Appointment List", OWNER,
     "appointment_notification_logs.scheduled_for existed only as a migration and was missing from schema.sql",
     OWNER, "Closed", "Backfilled together with the uq_reminder_logs_dedupe index"),
]

# ── Q&A ───────────────────────────────────────────────────────────────────────
# (date, question, by, priority, status, note)
QA = [
    ("30/07/2026", "Which use case list is authoritative when four versions disagree?", OWNER,
     "High", "Closed", "The backlog decides; the count stays at 87 and the other documents follow it"),
    ("01/08/2026", "Are blockchain and digital signature still in scope?", OWNER,
     "High", "Closed", "No — both dropped; the documents now describe the KYC OCR and booking assistant services"),
    ("01/08/2026", "Should the ERD follow the TypeORM entities or the deployed schema?", OWNER,
     "Medium", "Closed", "schema.sql, because it reflects the post-migration database and records entity drift"),
    ("01/08/2026", "Should Guest be able to browse clinics and specialties without an account?",
     OWNER, "Medium", "Open", "The use cases say yes; the middleware currently says no — needs a decision"),
    ("01/08/2026", "Do password reset screens belong in the signed-in actor flows?", OWNER,
     "Low", "Open", "Kept for now, matching the original diagrams; arguably guest-only"),
    ("01/08/2026", "Should in-page actions such as Ban and Unban be screens or system functions?",
     OWNER, "Medium", "Closed", "System functions — they have no route, so they moved to §3.1.c"),
    ("01/08/2026", "What date should Report 7 carry?", OWNER,
     "Medium", "Closed", "14/08/2026, two weeks after the last development week"),
]

SHEETS = {
    "WBS": dict(first_row=8, cols="ABCDEFG", styles=["19", "20", "20", "20", "20", "21", "21"]),
    "Issues": dict(first_row=4, cols="ABCDEFGHI",
                   styles=["6", "9", "9", "2", "1", "3", "3", "2", "3"]),
    "Defects": dict(first_row=4, cols="ABCDEFG", styles=["4"] * 7),
    "Q&A": dict(first_row=4, cols="ABCDEF", styles=["8", "8", "8", "13", "13", "8"]),
}


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_rows(spec, rows) -> str:
    out = []
    for n, row in enumerate(rows):
        r = spec["first_row"] + n
        xml = '<row r="%d">' % r
        for col, style, val in zip(spec["cols"], spec["styles"], row):
            if val == "":
                xml += '<c r="%s%d" s="%s"/>' % (col, r, style)
            else:
                xml += ('<c r="%s%d" s="%s" t="inlineStr"><is><t xml:space="preserve">%s</t>'
                        "</is></c>" % (col, r, style, esc(val)))
        out.append(xml + "</row>")
    return "".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    data = {
        "WBS": wbs_rows(),
        "Issues": [[str(i)] + list(x) for i, x in enumerate(ISSUES, 1)],
        "Defects": [list(x) for x in DEFECTS],
        "Q&A": [list(x) for x in QA],
    }
    # Issues sheet column order is # | Issue | Impact | Priority | Owner | Open | Close | Status | Notes
    data["Issues"] = [
        [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]] for r in data["Issues"]
    ]

    for name, rows in data.items():
        print("\n== %s — %d rows" % (name, len(rows)))
        for r in rows[:4]:
            print("   " + " | ".join(c[:34] for c in r))
        if len(rows) > 4:
            print("   ... %d more" % (len(rows) - 4))
    if not args.write:
        return

    wb = Workbook(BOOK)
    backup_dir = os.path.join(os.path.dirname(BOOK), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(BOOK).replace(
        ".xlsx", ".BAK-%s.xlsx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(BOOK, backup)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))

    for name, rows in data.items():
        part = wb.sheets[name]
        xml = wb.blobs[part].decode("utf-8")
        spec = SHEETS[name]
        keep = re.findall(r'<row r="(\d+)"[^>]*>.*?</row>', xml, re.S)
        head = "".join(
            m.group(0) for m in re.finditer(r'<row r="(\d+)"[^>]*>.*?</row>', xml, re.S)
            if int(m.group(1)) < spec["first_row"]
        )
        body = render_rows(spec, rows)
        last = spec["first_row"] + len(rows) - 1
        xml = re.sub(r"<sheetData>.*?</sheetData>",
                     lambda _m: "<sheetData>%s%s</sheetData>" % (head, body), xml, flags=re.S)
        xml = re.sub(r'<dimension ref="[^"]*"/>',
                     '<dimension ref="A1:%s%d"/>' % (spec["cols"][-1], last), xml)
        wb.blobs[part] = xml.encode("utf-8")
        print("  %-8s %d rows (rows %d-%d)" % (name, len(rows), spec["first_row"], last))

    # the auto-numbering formulas are gone, so the cached calculation chain must go too
    for part in ["xl/calcChain.xml"]:
        if part in wb.names:
            wb.names.remove(part)
            wb.blobs.pop(part, None)
            ct = wb.blobs["[Content_Types].xml"].decode("utf-8")
            wb.blobs["[Content_Types].xml"] = re.sub(
                r'<Override PartName="/xl/calcChain\.xml"[^/]*/>', "", ct).encode("utf-8")
            rels = wb.blobs["xl/_rels/workbook.xml.rels"].decode("utf-8")
            wb.blobs["xl/_rels/workbook.xml.rels"] = re.sub(
                r'<Relationship[^>]*calcChain\.xml"/>', "", rels).encode("utf-8")
    wb.save()
    print("  wrote %s" % os.path.relpath(BOOK, ROOT))


if __name__ == "__main__":
    main()
