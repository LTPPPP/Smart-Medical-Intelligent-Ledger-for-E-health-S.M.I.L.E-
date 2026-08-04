"""Minimal .xlsx reading and in-place cell editing — no openpyxl on this box.

Only what the project reports need: read every sheet as a grid of strings, and
write values back into existing cells (inline strings, so no sharedStrings
bookkeeping is required).
"""

from __future__ import annotations

import os
import re
import zipfile
from xml.sax.saxutils import escape

CELL = re.compile(r"<c\b[^>]*?r=\"([A-Z]+)(\d+)\"[^>]*?(?:/>|>(.*?)</c>)", re.S)
ROW = re.compile(r"<row\b[^>]*?r=\"(\d+)\"[^>]*?(?:/>|>(.*?)</row>)", re.S)
T_ATTR = re.compile(r'\bt="(\w+)"')


def col_to_index(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def index_to_col(idx: int) -> str:
    s = ""
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        s = chr(65 + rem) + s
    return s


class Workbook:
    def __init__(self, path: str):
        self.path = path
        with zipfile.ZipFile(path) as z:
            self.names = z.namelist()
            self.blobs = {n: z.read(n) for n in self.names}
        self.shared = self._shared_strings()
        self.sheets = self._sheet_map()

    # -- reading ------------------------------------------------------------
    def _shared_strings(self) -> list[str]:
        raw = self.blobs.get("xl/sharedStrings.xml")
        if not raw:
            return []
        xml = raw.decode("utf-8")
        out = []
        for si in re.findall(r"<si>(.*?)</si>", xml, re.S):
            out.append("".join(re.findall(r"<t[^>]*>(.*?)</t>", si, re.S)))
        return [_unescape(s) for s in out]

    def _sheet_map(self) -> dict[str, str]:
        wb = self.blobs["xl/workbook.xml"].decode("utf-8")
        rels = self.blobs["xl/_rels/workbook.xml.rels"].decode("utf-8")
        rid_to_target = dict(
            re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels)
        )
        out = {}
        for m in re.finditer(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wb):
            target = rid_to_target.get(m.group(2), "")
            target = target if target.startswith("xl/") else "xl/" + target.lstrip("/")
            out[_unescape(m.group(1))] = target
        return out

    def cell_text(self, sheet: str, cell_xml: str, t: str | None) -> str:
        if t == "s":
            v = re.search(r"<v>(.*?)</v>", cell_xml, re.S)
            return self.shared[int(v.group(1))] if v else ""
        if t in ("inlineStr", "str"):
            return _unescape("".join(re.findall(r"<t[^>]*>(.*?)</t>", cell_xml, re.S)))
        v = re.search(r"<v>(.*?)</v>", cell_xml, re.S)
        return _unescape(v.group(1)) if v else ""

    def grid(self, sheet: str) -> list[list[str]]:
        xml = self.blobs[self.sheets[sheet]].decode("utf-8")
        rows: dict[int, dict[int, str]] = {}
        for rnum, body in ROW.findall(xml):
            body = body or ""
            cells: dict[int, str] = {}
            for col, _r, inner in CELL.findall(body):
                m = re.search(r"<c\b[^>]*?r=\"%s%s\"[^>]*?(?:/>|>)" % (col, rnum), body)
                t = T_ATTR.search(m.group(0)).group(1) if m and T_ATTR.search(m.group(0)) else None
                cells[col_to_index(col)] = self.cell_text(sheet, inner or "", t)
            rows[int(rnum)] = cells
        if not rows:
            return []
        width = max((max(c) + 1 if c else 0) for c in rows.values())
        return [
            [rows.get(r, {}).get(c, "") for c in range(width)]
            for r in range(1, max(rows) + 1)
        ]

    # -- writing ------------------------------------------------------------
    def set_cell(self, sheet: str, ref: str, value: str) -> None:
        """Write an inline string into a cell, creating the cell/row if needed."""
        target = self.sheets[sheet]
        xml = self.blobs[target].decode("utf-8")
        col = re.match(r"([A-Z]+)(\d+)", ref)
        colname, rownum = col.group(1), col.group(2)
        new_cell = '<c r="%s" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (
            ref,
            escape(value),
        )
        pat = re.compile(r'<c\b[^>]*?r="%s"[^>]*?(?:/>|>.*?</c>)' % ref, re.S)
        if pat.search(xml):
            # keep the cell's style so the sheet's formatting survives
            old = pat.search(xml).group(0)
            style = re.search(r'\ss="(\d+)"', old)
            if style:
                new_cell = new_cell.replace("<c ", '<c s="%s" ' % style.group(1), 1)
            xml = pat.sub(lambda _m: new_cell, xml, count=1)
        else:
            rowpat = re.compile(r'(<row\b[^>]*?r="%s"[^>]*?>)(.*?)(</row>)' % rownum, re.S)
            m = rowpat.search(xml)
            if m:
                cells = m.group(2)
                after = [
                    c for c in CELL.findall(cells)
                    if col_to_index(c[0]) > col_to_index(colname)
                ]
                if after:
                    anchor = re.search(
                        r'<c\b[^>]*?r="%s%s"' % (after[0][0], rownum), cells
                    )
                    cells = cells[: anchor.start()] + new_cell + cells[anchor.start() :]
                else:
                    cells = cells + new_cell
                xml = xml[: m.start()] + m.group(1) + cells + m.group(3) + xml[m.end() :]
            else:
                data_end = xml.find("</sheetData>")
                xml = (
                    xml[:data_end]
                    + '<row r="%s">%s</row>' % (rownum, new_cell)
                    + xml[data_end:]
                )
        self.blobs[target] = xml.encode("utf-8")

    def save(self, path: str | None = None) -> None:
        path = path or self.path
        tmp = path + ".tmp"
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as out:
            for n in self.names:
                out.writestr(n, self.blobs[n])
        os.replace(tmp, path)


def _unescape(s: str) -> str:
    return (
        s.replace("&lt;", "<").replace("&gt;", ">")
        .replace("&quot;", '"').replace("&apos;", "'").replace("&amp;", "&")
    )


if __name__ == "__main__":
    import sys

    wb = Workbook(sys.argv[1])
    for name in wb.sheets:
        g = wb.grid(name)
        print("\n=== sheet %r — %d rows" % (name, len(g)))
        for i, row in enumerate(g[: int(sys.argv[2]) if len(sys.argv) > 2 else 30], 1):
            if any(c.strip() for c in row):
                print("  %3d | %s" % (i, " | ".join(c[:34] for c in row)))
