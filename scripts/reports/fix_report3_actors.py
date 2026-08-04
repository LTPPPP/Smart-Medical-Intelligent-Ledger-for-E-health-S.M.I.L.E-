"""Add the external system actors to Report 3 section 2.1.b.

The System Actors table listed only the five human roles, although the use case
list already names an external service as a secondary actor. Google OAuth and
VNPay are the two systems the platform hands control to, so they belong in the
table with a description of what they do and where.

Usage:
  python3 scripts/reports/fix_report3_actors.py            # preview
  python3 scripts/reports/fix_report3_actors.py --docx     # apply
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
REPORT3 = os.path.join(ROOT, "docs", "testing", "Report3_Software Requirement Specification.docx")
HEADING = "b. System Actors"

# Appended after the existing human actors. Behaviour taken from the IAM service
# (oauth_connections, Google callback) and the Payment service (VNPay signing,
# callback verification and the refund workflow).
NEW_ACTORS = [
    ("Google OAuth Service",
     "External identity provider used for federated sign-in. When a user chooses "
     "“Continue with Google”, the system redirects to Google, receives an authorization "
     "code on the callback route, and links the returned Google identity to the account so the "
     "user can sign in without a password. Secondary actor of Login with Google; it never "
     "receives clinical data."),
    ("VNPay Gateway",
     "External payment gateway used to collect appointment charges. The Payment Service builds a "
     "signed checkout URL and hands the patient to VNPay; VNPay redirects back to the callback "
     "route, where the signature is verified before the payment is marked paid. The same "
     "integration settles approved refunds. Secondary actor of the payment and refund use cases."),
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    names, blobs, xml = D.load(REPORT3)
    bl = D.blocks(xml)
    i = next(i for i, (k, s, e) in enumerate(bl)
             if k == "p" and D.text(xml[s:e]).strip() == HEADING)
    j = next(j for j, (k, s, e) in enumerate(bl) if j > i and k == "tbl")
    existing = D.rows(xml[bl[j][1]:bl[j][2]])[1:]

    rows = []
    for n, r in enumerate(existing, 1):
        cells = [D.text(c).strip() for c in re.findall(r"<w:tc>.*?</w:tc>", r, re.S)]
        rows.append([str(n)] + cells[1:3])
    for n, (actor, desc) in enumerate(NEW_ACTORS, len(existing) + 1):
        rows.append([str(n), actor, desc])

    print("System Actors: %d -> %d rows" % (len(existing), len(rows)))
    for r in rows:
        mark = "  +" if int(r[0]) > len(existing) else "   "
        print("%s %s %-22s %s" % (mark, r[0], r[1], r[2][:58]))

    if not args.docx:
        print("\n  preview only; pass --docx to apply")
        return

    xml = D.replace_table_after(xml, HEADING, rows)
    backup_dir = os.path.join(os.path.dirname(REPORT3), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT3).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT3, backup)
    D.save(REPORT3, names, blobs, xml)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote  %s" % os.path.relpath(REPORT3, ROOT))


if __name__ == "__main__":
    main()
