"""Correct the service count and complete the Code Packages table in Report 4.

The table said "all three NestJS microservices" and listed only IAM and Clinical
EMR. The repository has four NestJS services — gateway, iam, clinical-emr and
payment under backend/service — plus two Python AI services under ai/.

Usage:
  python3 scripts/reports/fix_report4_packages.py            # preview
  python3 scripts/reports/fix_report4_packages.py --docx     # apply
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table as D  # noqa: E402
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORT4 = os.path.join(ROOT, "docs", "testing", "Report4_Software Design Document.docx")

HEADING = "1.2 Package Diagram"

# The complete table. Ports and responsibilities are taken from docker-compose.yml
# and the service source under backend/service and ai/.
PACKAGES = [
    ("SMILE Front-End",
     "Containing the user interface built with Next.js 15 App Router and React 19, including "
     "all pages, features, shared components, API client, and state management."),
    ("SMILE Back-end",
     "Containing all four NestJS microservices — Gateway, IAM, Clinical EMR and Payment — that "
     "handle business logic, data access, and API responses for the S.M.I.L.E platform. The two "
     "Python AI services are packaged separately under ai/."),
    ("Gateway Service",
     "Single entry point for the platform (port 8080). Reverse-proxies every client request to "
     "the owning microservice, verifies the JWT, applies CORS, and aggregates the Swagger "
     "documentation of the services behind it."),
    ("IAM Service",
     "Identity and Access Management microservice (port 8081) handling authentication, "
     "authorization, account management, OAuth2 social login, RBAC, KYC verification, "
     "notifications, audit logging, and user profile management."),
    ("Clinical EMR Service",
     "Electronic Medical Records microservice (port 8082) handling all clinical operations: "
     "appointments, doctor schedules, patient records, examinations, prescriptions, dental "
     "imaging, and reporting."),
    ("Payment Service",
     "Payment microservice (port 3006) integrating the VNPay gateway: it builds signed checkout "
     "URLs, verifies callback signatures idempotently, and manages the refund request and "
     "approval workflow."),
    ("AI Services",
     "Two Python services packaged under ai/. KYC OCR Service (Python 3.11) extracts Citizen ID "
     "fields from uploaded documents using YOLOv11 and VietOCR and returns a quality checklist. "
     "Booking Assistant Service (Python 3.13, LangGraph) turns a chat conversation into a "
     "structured appointment booking request."),
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    names, blobs, xml = D.load(REPORT4)

    rows = [["%02d" % i, name, desc] for i, (name, desc) in enumerate(PACKAGES, 1)]
    before = None
    bl = D.blocks(xml)
    i = next(i for i, (k, s, e) in enumerate(bl) if k == "p" and D.text(xml[s:e]).strip() == HEADING)
    j = next(j for j, (k, s, e) in enumerate(bl) if j > i and k == "tbl")
    before = len(D.rows(xml[bl[j][1]:bl[j][2]])) - 1

    xml = D.replace_table_after(xml, HEADING, rows)
    print("  OK        Code Packages table: %d -> %d rows" % (before, len(rows)))
    for no, name, desc in rows:
        print("     %s %-22s %s" % (no, name, desc[:64]))

    if not args.docx:
        print("\n  preview only; pass --docx to apply")
        return

    backup_dir = os.path.join(os.path.dirname(REPORT4), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT4).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT4, backup)
    D.save(REPORT4, names, blobs, xml)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote  %s" % os.path.relpath(REPORT4, ROOT))


if __name__ == "__main__":
    main()
