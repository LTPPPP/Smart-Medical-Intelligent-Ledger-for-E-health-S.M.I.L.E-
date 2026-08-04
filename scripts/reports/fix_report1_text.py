"""Apply the reviewer's copy corrections to Report 1.

Word splits a sentence across several runs, so a plain string replace on
document.xml misses anything that straddles a run boundary (two of these do).
Each edit is therefore mapped onto the paragraph's concatenated text, then written
back into the runs it actually covers, leaving every other run untouched.

Usage:
  python3 scripts/reports/fix_report1_text.py            # preview
  python3 scripts/reports/fix_report1_text.py --docx     # apply
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
REPORT1 = os.path.join(ROOT, "docs", "testing", "Final", "Report1_Project Introduction.docx")

RUN = re.compile(r"<w:r(?: [^>]*)?>.*?</w:r>", re.S)
TXT = re.compile(r"(<w:t(?: [^>]*)?>)(.*?)(</w:t>)", re.S)

# (page, find, replace) — reviewer's list
EDITS = [
    (16,
     "they lack the advanced AI-driven diagnostics integrated ecosystems.",
     "they lack advanced AI-driven diagnostics and integrated ecosystems."),
    (18,
     "serve the broader Southeast Asian dental healthcare",
     "serve the broader Southeast Asian dental healthcare market."),
    (19,
     "care continuity.Each of these features",
     "care continuity. Each of these features"),
    (20,
     "expand into broader Southeast Asian healthcare",
     "expand into broader Southeast Asian healthcare markets."),
]


def replace_in_paragraph(para: str, find: str, repl: str) -> str | None:
    """Rewrite `find` as `repl` across whatever runs it spans. None if absent."""
    pieces = []           # (start, end, match) for each <w:t> body, in paragraph order
    offset = 0
    for m in TXT.finditer(para):
        body = m.group(2)
        pieces.append([offset, offset + len(body), m])
        offset += len(body)
    whole = "".join(p[2].group(2) for p in pieces)
    at = whole.find(find)
    if at < 0:
        return None
    end = at + len(find)

    out, cursor = [], 0
    written = False
    for start, stop, m in pieces:
        body = m.group(2)
        if stop <= at or start >= end:
            new_body = body            # untouched run
        else:
            head = body[: max(0, at - start)]
            tail = body[max(0, end - start):] if end < stop else ""
            # the whole replacement goes into the first run the match touches
            new_body = head + (escape(repl) if not written else "") + tail
            written = True
        out.append(para[cursor:m.start(2)] + new_body)
        cursor = m.end(2)
    return "".join(out) + para[cursor:]


def apply(xml: str, find: str, repl: str) -> tuple[str, bool]:
    for kind, s, e in D.blocks(xml):
        if kind != "p":
            continue
        para = xml[s:e]
        if find not in D.text(para):
            continue
        new = replace_in_paragraph(para, find, repl)
        if new is not None:
            return xml[:s] + new + xml[e:], True
    return xml, False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    names, blobs, xml = D.load(REPORT1)
    applied, missing = [], []
    for page, find, repl in EDITS:
        xml, ok = apply(xml, find, repl)
        (applied if ok else missing).append((page, find, repl))
        print("  %-8s p.%-3d %r\n           -> %r" % ("OK" if ok else "NOT FOUND", page, find, repl))

    if missing:
        print("\n  %d edit(s) could not be located — nothing written" % len(missing))
        return
    if not args.docx:
        print("\n  preview only; pass --docx to apply")
        return

    backup_dir = os.path.join(os.path.dirname(REPORT1), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT1).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT1, backup)
    D.save(REPORT1, names, blobs, xml)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote  %s" % os.path.relpath(REPORT1, ROOT))


if __name__ == "__main__":
    main()
