"""Insert the section 2.2 installation figures into Report 6.

Each figure goes directly under its heading, followed by a centred caption, so the
reader sees the shape of the procedure before the numbered steps.

Usage:
  python3 scripts/reports/add_install_images.py            # preview
  python3 scripts/reports/add_install_images.py --docx     # write into Report 6
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import struct
import sys
import time
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORT6 = os.path.join(ROOT, "docs", "testing", "Report6_Software User Guides.docx")
IMG = os.path.join(ROOT, "docs", "diagrams", "img")

EMU_PER_INCH = 914400
MAX_WIDTH_IN = 6.2          # A4 minus the document's own margins

# Screenshots you capture yourself. Drop the file into docs/diagrams/img/ under the
# name below and re-run this script — anything missing is skipped, so it is safe to
# add them one at a time. Vendor pages and Windows installer wizards have to come
# from a real machine; they are not drawn here.
SCREENSHOTS = [
    ("Step 2 — Install Docker Desktop", "shot-docker-download.png",
     "Docker Desktop download page (docker.com/products/docker-desktop)"),
    ("Step 3 — Configure and verify", "shot-docker-resources.png",
     "Docker Desktop > Settings > Resources — at least 4 CPUs and 8 GB"),
    ("Step 1 — Download Installer", "shot-node-download.png",
     "Node.js download page — the 20 LTS 64-bit package"),
    ("Step 2 — Execute Setup", "shot-node-path.png",
     "Node.js installer — 'Add to PATH' left checked"),
    ("Step 1 — Download Installers", "shot-python-download.png",
     "Python download page — 3.11 and 3.13 installers"),
    ("Step 2 — Execute Installation", "shot-python-path.png",
     "Python installer — 'Add python.exe to PATH' ticked before Install"),
    ("Step 2 — Installation Process", "shot-postgres-download.png",
     "PostgreSQL EnterpriseDB installer download"),
    ("Windows Setup", "shot-postgres-components.png",
     "PostgreSQL installer — Server, pgAdmin 4 and Command Line Tools selected"),
]

# heading text -> (png, caption)
USER_MANUAL = [
    ("3.1 Overview", "flow-overview.png",
     "The five documented flows and the actor that drives each one"),
    ("3.2 FLOW 1 — PATIENT ONBOARDING AND IDENTITY VERIFICATION", "flow1-onboarding.png",
     "Flow 1 — registration, phone OTP, KYC submission and the administrator's decision"),
    ("3.3 FLOW 2 — APPOINTMENT BOOKING AND REMINDER", "flow2-booking.png",
     "Flow 2 — booking wizard, confirmation and reminder"),
    ("3.4 FLOW 3 — CLINICAL VISIT: FROM CHECK-IN TO SIGNED RECORD", "flow3-visit.png",
     "Flow 3 — check-in, examination, prescription and record signature"),
    ("3.5 FLOW 4 — PAYMENT AND REFUND", "flow4-payment.png",
     "Flow 4 — VNPay checkout and the refund decision"),
    ("3.6 FLOW 5 — CLINIC ADMINISTRATION AND OVERSIGHT", "flow5-administration.png",
     "Flow 5 — catalog and role configuration, leave approval and reporting"),
]

FIGURES = [
    ("2.2 Installation Instruction", "install-overview.png",
     "Installation overview — four prerequisites, then the stack"),
    ("2.2.1 Install Docker Desktop", "install-docker.png",
     "Docker Desktop — enable WSL 2, install, configure resources, verify"),
    ("2.2.2 Install Node.js 20 LTS", "install-node.png",
     "Node.js 20 LTS — download, run setup, verify from a new terminal"),
    ("2.2.3 Installing Python 3.11+", "install-python.png",
     "Python 3.11 and 3.13 — install both, then create one virtual environment per AI service"),
    ("2.2.4 Installing and Configuring PostgreSQL 16", "install-postgres.png",
     "PostgreSQL 16 — install the server, then initialise the six logical databases"),
]


def png_size(path: str) -> tuple[int, int]:
    with open(path, "rb") as fh:
        head = fh.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("%s is not a PNG" % path)
    return struct.unpack(">II", head[16:24])


def drawing_paragraph(rid: str, doc_id: int, name: str, cx: int, cy: int) -> str:
    return (
        '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr>'
        '<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>'
        '<wp:inline distT="0" distB="0" distL="0" distR="0">'
        '<wp:extent cx="%d" cy="%d"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="%d" name="%s"/>'
        "<wp:cNvGraphicFramePr><a:graphicFrameLocks "
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>'
        "</wp:cNvGraphicFramePr>"
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:nvPicPr><pic:cNvPr id="0" name="%s"/><pic:cNvPicPr/></pic:nvPicPr>'
        '<pic:blipFill><a:blip r:embed="%s"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        '<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></pic:spPr>'
        "</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>"
        % (cx, cy, doc_id, escape(name), escape(name), rid, cx, cy)
    )


def caption_paragraph(text: str) -> str:
    return (
        '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>'
        '<w:r><w:rPr><w:i/><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="595959"/></w:rPr>'
        "<w:t xml:space=\"preserve\">%s</w:t></w:r></w:p>" % escape(text)
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    available_shots = [t for t in SCREENSHOTS if os.path.exists(os.path.join(IMG, t[1]))]
    pending = [t for t in SCREENSHOTS if t not in available_shots]
    missing = [f for _h, f, _c in FIGURES + USER_MANUAL
               if not os.path.exists(os.path.join(IMG, f))]
    if missing:
        raise SystemExit(
            "missing figures: %s\nRun: python3 scripts/reports/gen_install_figures.py "
            "then node scripts/diagrams/rasterize.js" % ", ".join(missing)
        )

    for heading, png, caption in FIGURES + USER_MANUAL:
        w, h = png_size(os.path.join(IMG, png))
        inch = min(MAX_WIDTH_IN, w / 192)
        print("  %-46s %-22s %4dx%-4d -> %.2f in wide" % (heading[:46], png, w, h, inch))
    if available_shots:
        print("\n  screenshots found and will be inserted:")
        for h, f, _c in available_shots:
            print("     %-30s %s" % (f, h))
    if pending:
        print("\n  screenshots not supplied yet (capture and drop into docs/diagrams/img/):")
        for _h, f, c in pending:
            print("     %-30s %s" % (f, c))
    if not args.docx:
        return

    names, blobs, xml = docx_table.load(REPORT6)
    rels = blobs["word/_rels/document.xml.rels"].decode("utf-8")
    next_rid = max(int(i) for i in re.findall(r'Id="rId(\d+)"', rels)) + 1
    next_doc_id = max([int(i) for i in re.findall(r'<wp:docPr id="(\d+)"', xml)] or [0]) + 1
    next_media = max(
        [int(m) for m in re.findall(r"word/media/image(\d+)\.png", " ".join(names))] or [0]
    ) + 1

    # insert bottom-up so earlier block offsets stay valid
    for heading, png, caption in reversed(FIGURES + USER_MANUAL + available_shots):
        bl = docx_table.blocks(xml)
        idx = next(
            (i for i, (k, s, e) in enumerate(bl)
             if k == "p" and docx_table.text(xml[s:e]).strip() == heading),
            None,
        )
        if idx is None:
            print("  SKIP %r (heading not found)" % heading)
            continue
        # the figure carries its filename in wp:docPr/@name, so a second run is a no-op
        if 'name="%s"' % png in xml:
            print("  SKIP %s (already present)" % png)
            continue

        part = "word/media/image%d.png" % next_media
        blobs[part] = open(os.path.join(IMG, png), "rb").read()
        if part not in names:
            names.append(part)
        rid = "rId%d" % next_rid
        rels = rels.replace(
            "</Relationships>",
            '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
            'relationships/image" Target="media/image%d.png"/></Relationships>'
            % (rid, next_media),
        )

        w, h = png_size(os.path.join(IMG, png))
        inch = min(MAX_WIDTH_IN, w / 192)
        cx = int(inch * EMU_PER_INCH)
        cy = int(cx * h / w)
        block = drawing_paragraph(rid, next_doc_id, png, cx, cy) + caption_paragraph(caption)
        xml = xml[: bl[idx][2]] + block + xml[bl[idx][2] :]

        next_rid += 1
        next_doc_id += 1
        next_media += 1
        print("  inserted %s under %r" % (png, heading))

    blobs["word/_rels/document.xml.rels"] = rels.encode("utf-8")

    backup_dir = os.path.join(os.path.dirname(REPORT6), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT6).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT6, backup)
    docx_table.save(REPORT6, names, blobs, xml)
    print("  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote %s" % os.path.relpath(REPORT6, ROOT))


if __name__ == "__main__":
    main()
