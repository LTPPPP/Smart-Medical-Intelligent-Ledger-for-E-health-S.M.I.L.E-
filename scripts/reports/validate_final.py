"""Validate the Final deliverable folder and write docs/testing/Final/fix.md.

Checks each report against the repository and against the other reports:
dropped features still described as delivered, data types that no longer match the
database, table counts that disagree with the code, leftover template placeholders,
and PDFs that are older than the document they were exported from.

Usage:  python3 scripts/reports/validate_final.py [--write]
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table as D  # noqa: E402
from xlsx import Workbook  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FINAL = os.path.join(ROOT, "docs", "testing", "Final")
PDF = os.path.join(FINAL, "PDF")
OUT = os.path.join(FINAL, "fix.md")

# Terms that must not appear: dropped features, or values the database contradicts.
FORBIDDEN = [
    ("blockchain", "Blockchain is a dropped feature"),
    ("hyperledger", "Hyperledger is a dropped feature"),
    ("ipfs", "IPFS is a dropped feature"),
    ("digital_signature", "The digital_signatures table was dropped"),
    ("digitalsignature", "The DigitalSignature entity was dropped"),
    ("gender: varchar", "gender is SMALLINT (ISO 5218), not VARCHAR"),
    ("gender | varchar", "gender is SMALLINT (ISO 5218), not VARCHAR"),
    ("blood_type", "patients.blood_type was dropped by GenderToSmallintDropBloodType"),
]

# Template text that should have been replaced before submission.
PLACEHOLDERS = [
    ("<group name>", "Group name placeholder"),
    ("groupname", "Group name placeholder in a file name or cell"),
    ("kiennt", "Template sample member name"),
    ("tuantv", "Template sample member name"),
    ("anhlm", "Template sample member name"),
    ("huynmg", "Template sample member name"),
    ("descript the overview", "Unfilled section prompt"),
    ("<dd/mm/yyyy", "Unfilled date placeholder"),
    ("hanoi, august 2019", "Stale cover date from the template"),
    ("lorem ipsum", "Filler text"),
    ("<<feature name", "Unfilled section template"),
    ("<<function name", "Unfilled section template"),
]

# Files where a forbidden term is legitimate, because the document's job is to
# record that the feature was removed.
EXEMPT = {
    "Report3_Project Tracking.xlsx": {"blockchain", "hyperledger", "ipfs", "digital_signature"},
}

Finding = dict


def docx_text(path: str) -> str:
    _names, _blobs, xml = D.load(path)
    return D.text(xml)


def xlsx_text(path: str) -> str:
    wb = Workbook(path)
    out = []
    for sheet in wb.sheets:
        for row in wb.grid(sheet):
            out.extend(c for c in row if c)
    return "\n".join(out)


def pdf_text(path: str) -> str:
    """Rough text extraction — enough to spot forbidden words in an exported PDF."""
    raw = open(path, "rb").read()
    chunks = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", raw, re.S):
        data = m.group(1)
        try:
            import zlib

            data = zlib.decompress(data)
        except Exception:
            continue
        chunks.append(data)
    text = b" ".join(chunks).decode("latin-1", "ignore")
    # PDF text operators: (literal) Tj  /  [(a)-1(b)] TJ
    return " ".join(re.findall(r"\((?:\\.|[^\\()])*\)", text)).replace("(", "").replace(")", "")


def scan(name: str, text: str, kind: str) -> list[Finding]:
    low = text.lower()
    exempt = EXEMPT.get(os.path.basename(name), set())
    out = []
    for needle, why in FORBIDDEN:
        n = low.count(needle)
        if n and needle not in exempt:
            out.append(dict(file=name, kind=kind, severity="High",
                            issue="Contains %r (%d occurrence%s)" % (needle, n, "" if n == 1 else "s"),
                            why=why))
    for needle, why in PLACEHOLDERS:
        n = low.count(needle)
        if n:
            out.append(dict(file=name, kind=kind, severity="Medium",
                            issue="Template placeholder %r (%d)" % (needle, n), why=why))
    return out


def structural_checks() -> list[Finding]:
    """Counts that must agree with the repository."""
    from schema_reader import load_schema
    from screens import SCREENS, SYSTEM_FUNCTIONS

    out = []
    tables = len(load_schema())
    srs = os.path.join(FINAL, "Report3_Software Requirement Specification.docx")
    if os.path.exists(srs):
        _n, _b, xml = D.load(srs)
        bl = D.blocks(xml)

        def rows_after(heading):
            i = next((i for i, (k, s, e) in enumerate(bl)
                      if k == "p" and D.text(xml[s:e]).strip() == heading), None)
            if i is None:
                return None
            j = next((j for j, (k, s, e) in enumerate(bl) if j > i and k == "tbl"), None)
            return len(D.rows(xml[bl[j][1]:bl[j][2]])) - 1 if j is not None else None

        for heading, expected, what in [
            ("Entities List", tables, "tables in database/**/schema.sql"),
            ("b. Screen Details", len(SCREENS), "routes in frontend/web/src/app"),
            ("c. Non-Screen Functions", len(SYSTEM_FUNCTIONS), "documented system functions"),
        ]:
            got = rows_after(heading)
            if got is None:
                out.append(dict(file=os.path.basename(srs), kind="docx", severity="High",
                                issue="Section %r not found" % heading,
                                why="Expected a table with %d rows (%s)" % (expected, what)))
            elif got != expected:
                out.append(dict(file=os.path.basename(srs), kind="docx", severity="High",
                                issue="%r has %d rows, expected %d" % (heading, got, expected),
                                why="Must match the %s" % what))
    return out


def report6_figures() -> list[Finding]:
    p = os.path.join(FINAL, "Report6_Software User Guides.docx")
    if not os.path.exists(p):
        return []
    names, _b, xml = D.load(p)
    drawings = xml.count("<w:drawing>")
    if drawings < 12:
        return [dict(file=os.path.basename(p), kind="docx", severity="High",
                     issue="Only %d figure(s) embedded" % drawings,
                     why="The installation and user-manual figures are missing; the working copy "
                         "in docs/testing has 12. Re-run scripts/reports/add_install_images.py --docx")]
    return []


def stale_versions() -> list[Finding]:
    """Final copies that are behind the corrected working copies in docs/testing."""
    work = os.path.join(ROOT, "docs", "testing")
    out = []
    for f in sorted(os.listdir(FINAL)):
        if not f.endswith(".docx"):
            continue
        w = os.path.join(work, f)
        if not os.path.exists(w):
            continue
        try:
            a, b = docx_text(os.path.join(FINAL, f)), docx_text(w)
        except Exception:
            continue
        if a != b:
            out.append(dict(file=f, kind="docx", severity="High",
                            issue="Differs from the corrected copy in docs/testing",
                            why="The Final folder holds an earlier version — copy the working "
                                "file over it, then re-export the PDF"))
    return out


def pdf_freshness() -> list[Finding]:
    out = []
    if not os.path.isdir(PDF):
        return out
    for f in sorted(os.listdir(FINAL)):
        if not f.endswith(".docx"):
            continue
        pdf = os.path.join(PDF, f[:-5] + ".pdf")
        if not os.path.exists(pdf):
            out.append(dict(file=f, kind="pdf", severity="Medium",
                            issue="No PDF export in Final/PDF",
                            why="Every report should ship with a matching PDF"))
            continue
        if os.path.getmtime(pdf) < os.path.getmtime(os.path.join(FINAL, f)) - 60:
            out.append(dict(file=os.path.basename(pdf), kind="pdf", severity="High",
                            issue="PDF is older than the .docx it was exported from",
                            why="Re-export after the document changed"))
    for f in sorted(os.listdir(PDF)):
        if f.endswith((".xlsx", ".xls")):
            out.append(dict(file="PDF/" + f, kind="pdf", severity="Low",
                            issue="Spreadsheet sitting in the PDF folder",
                            why="Export it to PDF or move it out of Final/PDF"))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="write Final/fix.md")
    args = ap.parse_args()

    findings: list[Finding] = []
    for f in sorted(os.listdir(FINAL)):
        p = os.path.join(FINAL, f)
        if not os.path.isfile(p):
            continue
        try:
            if f.endswith(".docx"):
                findings += scan(f, docx_text(p), "docx")
            elif f.endswith(".xlsx"):
                findings += scan(f, xlsx_text(p), "xlsx")
        except Exception as exc:  # a corrupt part should be reported, not crash the run
            findings.append(dict(file=f, kind="?", severity="High",
                                 issue="Could not be read (%s)" % exc.__class__.__name__, why=str(exc)[:120]))
    if os.path.isdir(PDF):
        for f in sorted(os.listdir(PDF)):
            if f.endswith(".pdf"):
                try:
                    findings += scan("PDF/" + f, pdf_text(os.path.join(PDF, f)), "pdf")
                except Exception:
                    pass
    findings += stale_versions()
    findings += structural_checks()
    findings += report6_figures()
    findings += pdf_freshness()

    order = {"High": 0, "Medium": 1, "Low": 2}
    findings.sort(key=lambda x: (order[x["severity"]], x["file"]))

    print("%d finding(s)\n" % len(findings))
    for x in findings:
        print("  [%-6s] %-46s %s" % (x["severity"], x["file"][:46], x["issue"]))

    if not args.write:
        return

    lines = [
        "# Final package — validation findings",
        "",
        "Generated by `python3 scripts/reports/validate_final.py --write` on %s."
        % datetime.date.today().strftime("%d/%m/%Y"),
        "",
        "Checked: dropped features still described as delivered, values the database "
        "contradicts, table counts that disagree with the code, leftover template "
        "placeholders, and PDF exports older than their source document.",
        "",
        "| # | Severity | File | Finding | Why it matters / fix |",
        "|---|---|---|---|---|",
    ]
    for i, x in enumerate(findings, 1):
        lines.append("| %d | %s | `%s` | %s | %s |"
                     % (i, x["severity"], x["file"], x["issue"].replace("|", "\\|"),
                        x["why"].replace("|", "\\|")))
    if not findings:
        lines.append("| — | — | — | No issues found | — |")
    lines += ["", "## Counts the documents must agree with", ""]

    from schema_reader import load_schema
    from screens import SCREENS, SYSTEM_FUNCTIONS

    lines += [
        "| Quantity | Value | Source of truth |",
        "|---|---|---|",
        "| Database tables / entities | %d | `database/**/schema.sql` |" % len(load_schema()),
        "| Screens | %d | routes under `frontend/web/src/app` |" % len(SCREENS),
        "| Non-screen functions | %d | `scripts/diagrams/screens.py` |" % len(SYSTEM_FUNCTIONS),
        "| Use cases | 87 | the backlog (Report3 §2.1.c) |",
        "",
        "Regenerate the document tables with `make diagrams-docx`, then re-export the PDFs.",
        "",
    ]
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print("\n  wrote %s" % os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
