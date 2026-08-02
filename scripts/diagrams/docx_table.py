"""Minimal .docx table rewriting — no third-party packages available on this box.

Rewrites the rows of an existing table in place, reusing the document's own header
and body row as templates so the result keeps the report's fonts and borders.
"""

from __future__ import annotations

import os
import re
import zipfile
from xml.sax.saxutils import escape

_TXT = re.compile(r"<w:t(?: [^>]*)?>.*?</w:t>", re.S)
_TAG = re.compile(r"<(/?)w:(p|tbl)(?=[ >/])([^>]*)>")


def load(path: str):
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        blobs = {n: z.read(n) for n in names}
    return names, blobs, blobs["word/document.xml"].decode("utf-8")


def save(path: str, names, blobs, xml: str) -> None:
    blobs["word/document.xml"] = xml.encode("utf-8")
    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as out:
        for n in names:
            out.writestr(n, blobs[n])
    os.replace(tmp, path)


def blocks(xml: str) -> list[tuple[str, int, int]]:
    """Top-level (kind, start, end) blocks inside <w:body>."""
    s = xml.find("<w:body>") + len("<w:body>")
    e = xml.find("</w:body>")
    out, depth, start, kind = [], 0, 0, ""
    for m in _TAG.finditer(xml, s, e):
        closing, name, attrs = m.group(1), m.group(2), m.group(3)
        if attrs.endswith("/"):
            continue
        if not closing:
            if depth == 0:
                start, kind = m.start(), name
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append((kind, start, m.end()))
    return out


def text(chunk: str) -> str:
    return "".join(re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", chunk, re.S))


def rows(tbl: str) -> list[str]:
    return re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S)


def _put(chunk: str, value: str, rpr: str = "") -> str:
    """Set the first run's text, drop later runs; inject a run into an empty cell."""
    new = '<w:t xml:space="preserve">%s</w:t>' % escape(value)
    found = list(_TXT.finditer(chunk))
    if found:
        return chunk[: found[0].start()] + new + _TXT.sub("", chunk[found[0].end() :])
    k = chunk.rfind("</w:p>")
    return chunk if k == -1 else chunk[:k] + "<w:r>%s%s</w:r>" % (rpr, new) + chunk[k:]


def fill_row(template: str, values: list[str]) -> str:
    rm = re.search(r"<w:r>(<w:rPr>.*?</w:rPr>)?<w:t", template, re.S)
    rpr = rm.group(1) if rm and rm.group(1) else ""
    out, last = [], 0
    for m, val in zip(re.finditer(r"<w:tc>.*?</w:tc>", template, re.S), values):
        out.append(template[last : m.start()] + _put(m.group(0), val, rpr))
        last = m.end()
    return "".join(out) + template[last:]


_RUN = re.compile(r"<w:r(?: [^>]*)?>.*?</w:r>", re.S)
_BOLD = re.compile(r"<w:b(?: [^>]*)?/>")


def _run_styles(chunk: str) -> tuple[str, str]:
    """(bold rPr, plain rPr) taken from the chunk's own runs."""
    bold = plain = ""
    for r in _RUN.findall(chunk):
        rpr = re.search(r"<w:rPr>.*?</w:rPr>", r, re.S)
        rpr = rpr.group(0) if rpr else ""
        if _BOLD.search(r):
            bold = bold or rpr
        else:
            plain = plain or rpr
    if not plain and bold:
        plain = _BOLD.sub("", bold)
    if not bold and plain:
        bold = plain.replace("<w:rPr>", "<w:rPr><w:b/>", 1) if plain else "<w:rPr><w:b/></w:rPr>"
    return bold, plain


def _fill_cell_lines(cell: str, lines, rpr: str) -> str:
    """Rebuild a cell as ONE paragraph with <w:br/> between the lines.

    One paragraph per line would inherit the paragraph's space-before/after on
    every line and leave the cell looking airy; a single paragraph broken by
    <w:br/> is how the report's own description cells are written.

    A line may be a plain string, or a (text, bold) pair — the report bolds the
    "Primary key:" / "Foreign keys:" / "Attributes:" headers and leaves the
    bullets underneath them in the normal weight.
    """
    m = re.search(r"<w:p(?: [^>]*)?>.*?</w:p>", cell, re.S)
    if not m:
        return _put(cell, " ".join(str(x) for x in lines), rpr)
    para = m.group(0)
    head = cell[: m.start()]
    tail = re.sub(r"<w:p(?: [^>]*)?>.*?</w:p>", "", cell[m.start() :], flags=re.S)
    bold_rpr, plain_rpr = _run_styles(para)

    # A multi-line description reads as a block, so drop the paragraph's trailing
    # space; the template row may carry a w:after meant for single-line cells.
    tight = '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>'
    if re.search(r"<w:spacing\b[^>]*/>", para):
        para = re.sub(r"<w:spacing\b[^>]*/>", tight, para, count=1)
    elif "<w:pPr>" in para:
        para = para.replace("<w:pPr>", "<w:pPr>" + tight, 1)

    runs = []
    for i, line in enumerate(lines or [""]):
        text, bold = line if isinstance(line, tuple) else (line, False)
        br = "<w:br/>" if i else ""
        runs.append(
            '<w:r>%s%s<w:t xml:space="preserve">%s</w:t></w:r>'
            % (bold_rpr if bold else plain_rpr, br, escape(text))
        )
    body = "".join(runs)

    pPr = re.search(r"<w:pPr>.*?</w:pPr>", para, re.S)
    open_tag = re.match(r"<w:p(?: [^>]*)?>", para).group(0)
    return head + open_tag + (pPr.group(0) if pPr else "") + body + "</w:p>" + tail


def fill_row_multiline(template: str, values: list) -> str:
    """Like fill_row, but a value may be a list of strings -> one paragraph each."""
    rm = re.search(r"<w:r>(<w:rPr>.*?</w:rPr>)?<w:t", template, re.S)
    rpr = rm.group(1) if rm and rm.group(1) else ""
    out, last = [], 0
    for m, val in zip(re.finditer(r"<w:tc>.*?</w:tc>", template, re.S), values):
        cell = m.group(0)
        filled = _fill_cell_lines(cell, val, rpr) if isinstance(val, list) else _put(cell, val, rpr)
        out.append(template[last : m.start()] + filled)
        last = m.end()
    return "".join(out) + template[last:]


def replace_table_after(xml: str, heading: str, body_rows: list[list[str]], multiline: bool = False) -> str:
    """Replace the rows of the first table following the paragraph `heading`."""
    bl = blocks(xml)
    try:
        idx = next(
            i for i, (k, s, e) in enumerate(bl)
            if k == "p" and text(xml[s:e]).strip() == heading
        )
    except StopIteration as exc:
        raise LookupError("no paragraph reads exactly %r" % heading) from exc
    # The table is not always the very next block — a caption or figure can sit
    # between. Scan forward, but stop at the next heading so a following section's
    # table is never picked up by mistake.
    ts = te = None
    for kind, s, e in bl[idx + 1 :]:
        if kind == "tbl":
            ts, te = s, e
            break
        if re.search(r'<w:pStyle w:val="Heading\d"', xml[s:e]):
            break
    if ts is None:
        raise LookupError("no table follows %r before the next heading" % heading)
    tbl = xml[ts:te]
    existing = rows(tbl)
    if len(existing) < 2:
        raise LookupError("table after %r has no body row to use as a template" % heading)
    prefix = tbl[: tbl.find("<w:tr")]
    fill = fill_row_multiline if multiline else fill_row
    filled = "".join(fill(existing[1], r) for r in body_rows)
    return xml[:ts] + prefix + existing[0] + filled + "</w:tbl>" + xml[te:]
