import pathlib
import fitz
from markdown_it import MarkdownIt

ROOT = pathlib.Path(
    "/Users/huuw_khoa/Desktop/Project/FPT/Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-"
)
IMAGES_DIR = ROOT / "frontend/web/public/images"
DATA_DIR = ROOT / "ai/data"

md = MarkdownIt("commonmark", {"html": True}).enable("table")

PAGE = fitz.paper_rect("a4")
MARGIN_X = 40
HEADER_H = 60
FOOTER_H = 34
BODY_RECT = fitz.Rect(MARGIN_X, HEADER_H + 12, PAGE.width - MARGIN_X, PAGE.height - FOOTER_H)
HEADER_RECT = fitz.Rect(0, 0, PAGE.width, HEADER_H)
FOOTER_RECT = fitz.Rect(0, PAGE.height - FOOTER_H, PAGE.width, PAGE.height)

BODY_CSS = """
body { font-family: sans-serif; font-size: 10.5px; line-height: 1.55; color: #222222; }
h1 { font-size: 19px; color: #0d6b7a; margin: 0 0 10px 0; }
h2 { font-size: 14px; color: #0d6b7a; border-bottom: 1px solid #0d6b7a55; padding-bottom: 3px; margin-top: 16px; }
h3 { font-size: 12px; color: #14808f; margin-top: 10px; margin-bottom: 4px; }
p { margin: 4px 0; }
ul { margin: 4px 0; padding-left: 18px; }
li { margin: 2px 0; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 10px 0; }
th, td { border: 1px solid #cccccc; padding: 4px 8px; font-size: 10px; text-align: left; }
th { font-weight: bold; }
blockquote { border-left: 3px solid #e0ac00; padding: 6px 10px; margin: 8px 0; font-size: 9.5px; color: #6b5200; }
hr { border: none; border-top: 1px solid #cccccc; margin: 12px 0; }
strong { color: #111111; }
em { color: #555555; }
.cover-wrap { text-align: center; margin: 4px 0 16px 0; }
.cover-img { width: 46%; }
"""

HEADER_CSS = """
body { margin: 0; font-family: sans-serif; }
.hdr { background-color: #e8f6f7; border-bottom: 1.2px solid #0d6b7a; padding: 11px %(mx)dpx; }
table { width: 100%%; border-collapse: collapse; }
td { border: none; padding: 0; vertical-align: middle; }
.brand { font-size: 16px; color: #0d6b7a; font-weight: bold; }
.subtitle { font-size: 9px; color: #666666; margin-top: 2px; }
""" % {"mx": MARGIN_X}

FOOTER_CSS = """
body { margin: 0; font-family: sans-serif; }
.ftr { border-top: 0.8px solid #dddddd; padding: 8px %(mx)dpx 0 %(mx)dpx; }
table { width: 100%%; border-collapse: collapse; }
td { border: none; padding: 0; font-size: 7.5px; color: #777777; }
td.pg { text-align: right; }
""" % {"mx": MARGIN_X}


def header_story(doc_title: str) -> fitz.Story:
    html = f"""<html><head><style>{HEADER_CSS}</style></head><body>
<div class="hdr"><table><tr>
<td style="width:46px;"><img src="logo.png" style="width:36px;height:36px;"></td>
<td><div class="brand">Nha Khoa S.M.I.L.E</div><div class="subtitle">{doc_title}</div></td>
</tr></table></div>
</body></html>"""
    return fitz.Story(html=html, archive=fitz.Archive(str(IMAGES_DIR)))


def footer_story(page_no: int) -> fitz.Story:
    html = f"""<html><head><style>{FOOTER_CSS}</style></head><body>
<div class="ftr"><table><tr>
<td>Tài liệu nội bộ — cần nha sĩ/quản lý rà soát trước khi dùng chính thức.</td>
<td class="pg">{page_no}</td>
</tr></table></div>
</body></html>"""
    return fitz.Story(html=html)


def md_to_pdf(md_path: pathlib.Path, pdf_path: pathlib.Path, doc_title: str, with_cover: bool):
    text = md_path.read_text(encoding="utf-8")
    body_html = md.render(text)
    cover_html = (
        '<div class="cover-wrap"><img class="cover-img" src="glassy_teeth.png"></div>'
        if with_cover
        else ""
    )
    html = f"<html><head><style>{BODY_CSS}</style></head><body>{cover_html}{body_html}</body></html>"

    story = fitz.Story(html=html, archive=fitz.Archive(str(IMAGES_DIR)))
    writer = fitz.DocumentWriter(str(pdf_path))

    page_no = 0
    more = 1
    while more:
        page_no += 1
        dev = writer.begin_page(PAGE)

        more, _ = story.place(BODY_RECT)
        story.draw(dev)

        hstory = header_story(doc_title)
        hstory.place(HEADER_RECT)
        hstory.draw(dev)

        fstory = footer_story(page_no)
        fstory.place(FOOTER_RECT)
        fstory.draw(dev)

        writer.end_page()

    writer.close()
    print(f"Wrote {pdf_path} ({page_no} pages)")


if __name__ == "__main__":
    md_to_pdf(
        DATA_DIR / "policy.md",
        DATA_DIR / "policy.pdf",
        "Chính sách phòng khám",
        with_cover=False,
    )
    md_to_pdf(
        DATA_DIR / "caution.md",
        DATA_DIR / "caution.pdf",
        "Cảnh báo & hỏi đáp y tế nha khoa",
        with_cover=True,
    )
