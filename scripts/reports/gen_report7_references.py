"""Build the Report 7 reference list in VII. Appendix from the document's footnotes.

Report 7 cites its sources as 15 footnotes holding bare URLs; VII. Appendix has a
"1. References" heading and nothing under it. This turns those footnotes into an
alphabetised reference list in the report's citation style:

    Author. (Year). Title. (Publisher) Retrieved <date>, from <URL>

Corporate authors are used where the source has no named author, and (n.d.) where
no publication date is stated — inventing either would be worse than omitting it.
The footnotes are left in place: they are the in-text citation markers, and
deleting them would strip the reference numbers out of the body text.

Usage:
  python3 scripts/reports/gen_report7_references.py            # preview
  python3 scripts/reports/gen_report7_references.py --docx     # write into Report 7
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import time
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table as D  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORT7 = os.path.join(ROOT, "docs", "testing", "Report7_Final Project Report.docx")
ANCHOR = "1. References"
RETRIEVED = "August 4, 2026"

# (author, date, title, publisher, url) — one per footnote, sorted on output.
# "n.d." is used wherever the source states no publication date.
REFERENCES = [
    ("Bệnh viện Răng Hàm Mặt Trung ương", "n.d.",
     "Bệnh viện Răng Hàm Mặt Trung ương", "bvranghammat.com",
     "https://bvranghammat.com/"),
    ("Docker, Inc.", "n.d.",
     "Docker: Accelerated container application development", "Docker",
     "https://www.docker.com/"),
    ("GeeksforGeeks", "n.d.",
     "U-Net architecture explained", "GeeksforGeeks",
     "https://www.geeksforgeeks.org/machine-learning/u-net-architecture-explained/"),
    ("GitHub, Inc.", "n.d.",
     "GitHub: Let's build from here", "GitHub",
     "https://github.com/"),
    ("International Organization for Standardization", "2016",
     "ISO/IEC 25022:2016 — Systems and software engineering — Systems and software quality "
     "requirements and evaluation (SQuaRE) — Measurement of quality in use", "ISO",
     "https://www.iso.org/standard/35746.html"),
    ("International Organization for Standardization", "2016",
     "ISO/IEC 25023:2016 — Systems and software engineering — Systems and software quality "
     "requirements and evaluation (SQuaRE) — Measurement of system and software product quality",
     "ISO", "https://www.iso.org/standard/35747.html"),
    ("Microsoft", "n.d.",
     "Microsoft Excel for the web", "Microsoft",
     "https://excel.cloud.microsoft/en-us/"),
    ("Microsoft", "n.d.",
     "Microsoft Word for the web", "Microsoft",
     "https://word.cloud.microsoft/en-us/"),
    ("Nha Khoa Lan Anh", "n.d.",
     "Nha Khoa Lan Anh — Hệ thống nha khoa", "nhakhoalananh.com",
     "https://nhakhoalananh.com/"),
    ("[AUTHOR]", "n.d.",
     "Intro to PostgreSQL", "Medium — CODEX",
     "https://medium.com/codex/intro-to-postgresql-c8da31335c34"),
    ("Python Software Foundation", "n.d.",
     "Welcome to Python.org", "Python Software Foundation",
     "https://www.python.org/"),
    ("Redis Ltd.", "n.d.",
     "Redis: The real-time data platform", "Redis",
     "https://redis.io/"),
    ("Software Freedom Conservancy", "n.d.",
     "Git — distributed version control system", "Git",
     "https://git-scm.com/"),
    ("Vercel", "n.d.",
     "Next.js: The React framework for the web", "Vercel",
     "https://nextjs.org/"),
    ("Vietnam Implants", "n.d.",
     "Vietnam Implants — Nha khoa cấy ghép implant", "vietnamimplants.com",
     "https://vietnamimplants.com/"),
]


def render(ref) -> str:
    author, date, title, publisher, url = ref
    return "%s (%s). %s. (%s) Retrieved %s, from %s" % (
        author if author.endswith(".") else author + ".", date, title, publisher, RETRIEVED, url
    )


def paragraph(text: str) -> str:
    """A hanging-indent reference entry, matching the report's body font."""
    return (
        '<w:p><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/>'
        '<w:ind w:left="567" w:hanging="567"/><w:jc w:val="both"/></w:pPr>'
        '<w:r><w:rPr><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
        '<w:t xml:space="preserve">%s</w:t></w:r></w:p>' % escape(text)
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    refs = sorted(REFERENCES, key=lambda r: (r[0].lower(), r[2].lower()))
    for i, r in enumerate(refs, 1):
        print("  %2d. %s" % (i, render(r)))

    unknown = [r for r in refs if "[AUTHOR]" in r[0]]
    if unknown:
        print("\n  %d entry needs an author filled in by hand:" % len(unknown))
        for r in unknown:
            print("     %s — %s" % (r[2], r[4]))

    if not args.docx:
        print("\n  preview only; pass --docx to write into Report 7")
        return

    names, blobs, xml = D.load(REPORT7)
    bl = D.blocks(xml)
    idx = next((i for i, (k, s, e) in enumerate(bl)
                if k == "p" and D.text(xml[s:e]).strip() == ANCHOR), None)
    if idx is None:
        raise SystemExit("could not find the %r paragraph" % ANCHOR)

    # a second run must not duplicate the list
    tail = D.text(xml[bl[idx][2]:])
    if "Retrieved %s, from" % RETRIEVED in tail:
        print("\n  references already present — nothing to do")
        return

    block = "".join(paragraph(render(r)) for r in refs)
    xml = xml[: bl[idx][2]] + block + xml[bl[idx][2]:]

    backup_dir = os.path.join(os.path.dirname(REPORT7), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT7).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT7, backup)
    D.save(REPORT7, names, blobs, xml)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote  %s — %d references" % (os.path.relpath(REPORT7, ROOT), len(refs)))


if __name__ == "__main__":
    main()
