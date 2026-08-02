"""Fill section I. Project Report in Report3 and Report4.

Three tables per report — Status Report, Team Involvements, Issues/Suggestions —
describing the work that produced that deliverable. Member assignment follows the
areas each person actually committed to (see gen_weekly_report.AUTHORS).

Usage:
  python3 scripts/reports/gen_project_report.py            # preview
  python3 scripts/reports/gen_project_report.py --docx     # write into the reports
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TESTING = os.path.join(ROOT, "docs", "testing")

REPORTS = {
    "Report3_Software Requirement Specification.docx": {
        "status": [
            ("Use case list finalised", "Completed",
             "87 use cases across Guest, Patient, Doctor, Nurse, Receptionist, Manager and Admin"),
            ("Entity relationship diagram and entity list", "Completed",
             "57 tables across five service databases, generated from database/**/schema.sql"),
            ("Screen flow and screen details", "Completed",
             "55 screens, one per application route; flows derived from the ProtectedRoute guards"),
            ("Non-screen functions", "Completed",
             "41 system functions covering API, background jobs and AI services"),
            ("Non-functional requirements", "Completed",
             "External interfaces, quality attributes, security and design constraints reviewed against the implementation"),
            ("Appendix — message list", "Completed",
             "93 user-facing messages catalogued"),
        ],
        "team": [
            ("Use case list, business rules and functional requirements", "Phat",
             "Consolidated the backlog into the 87 use cases used across all reports"),
            ("Entity relationship diagram and data dictionary", "Chinh",
             "Aligned the ERD with the deployed schema and the TypeORM entities"),
            ("Screen flow, screen details and message list", "Khoa",
             "Mapped every frontend route and its role guard to a documented screen"),
            ("Non-screen functions and AI service requirements", "Nhan",
             "Specified the KYC OCR and booking assistant integrations"),
        ],
        "issues": [
            ("Competing use case lists across documents", "Completed",
             "Reconciled to a single backlog of 87; see docs/SRS_UC_LIST_RECONCILIATION.md"),
            ("Blockchain and digital signature described as delivered", "Completed",
             "Both are dropped features; removed from the requirements and replaced with the AI services actually built"),
            ("Data types drifted from the deployed database", "Completed",
             "ERD regenerated from schema.sql; gender corrected to SMALLINT (ISO 5218) and column widths updated"),
        ],
    },
    "Report4_Software Design Document.docx": {
        "status": [
            ("System architecture and package diagram", "Completed",
             "Microservice architecture with database-per-service and an API gateway"),
            ("Database design for all five service databases", "Completed",
             "57 tables documented with keys, foreign keys and attributes, generated from schema.sql"),
            ("Class diagrams", "Completed",
             "One per use case, aligned to the 87-item backlog"),
            ("Sequence diagrams", "Completed",
             "One per use case, covering the main and alternative flows"),
            ("Design of cross-service references", "Completed",
             "Links crossing a service boundary documented as logical references rather than database foreign keys"),
        ],
        "team": [
            ("System architecture, gateway and deployment design", "Phat",
             "Service boundaries, container topology and CI/CD"),
            ("Database design and entity mapping", "Chinh",
             "Schema, migrations and the data dictionary in section 2"),
            ("Class and sequence diagrams for identity and scheduling", "Khoa",
             "Authentication, RBAC, KYC and appointment scheduling"),
            ("Class and sequence diagrams for clinical and AI flows", "Nhan",
             "Examination, prescription, imaging and the AI services"),
        ],
        "issues": [
            ("Database design listed tables that no longer exist", "Completed",
             "digital_signatures removed; phone_verifications and notification_push_subscriptions added"),
            ("Column definitions predated the tightening migrations", "Completed",
             "Section 2 regenerated from schema.sql after TightenColumnWidths and GenderToSmallint"),
            ("Screen flow diagrams showed a dropped feature", "In Progress",
             "Signature Page branch still present in the section 3.1.a images; replacements generated under docs/diagrams/img"),
        ],
    },
}

TABLES = [
    ("1. Status Report", "status"),
    ("2. Team Involvements", "team"),
    ("3. Issues/Suggestions", "issues"),
]


def rows_for(kind: str, entries) -> list[list[str]]:
    return [[str(i)] + list(e) for i, e in enumerate(entries, 1)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true", help="write into the reports")
    args = ap.parse_args()

    for filename, content in REPORTS.items():
        path = os.path.join(TESTING, filename)
        if not os.path.exists(path):
            print("  SKIP %s (not found)" % filename)
            continue
        print("\n== %s" % filename)
        for heading, key in TABLES:
            rows = rows_for(key, content[key])
            print("   %-22s %d rows" % (heading, len(rows)))
            for r in rows:
                print("      " + " | ".join(c[:46] for c in r))
        if not args.docx:
            continue

        backup_dir = os.path.join(TESTING, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup = os.path.join(
            backup_dir,
            filename.replace(".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")),
        )
        shutil.copy(path, backup)
        names, blobs, xml = docx_table.load(path)
        for heading, key in TABLES:
            xml = docx_table.replace_table_after(xml, heading, rows_for(key, content[key]))
        docx_table.save(path, names, blobs, xml)
        print("   written (backup %s)" % os.path.basename(backup))


if __name__ == "__main__":
    main()
