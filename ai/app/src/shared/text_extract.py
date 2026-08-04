"""Extract text from documents."""

from __future__ import annotations

import io
import re

import docx
import fitz  # pymupdf
from markdown_it import MarkdownIt

_MD = MarkdownIt()
_HTML_TAG_RE = re.compile(r"<[^>]+>")


class UnsupportedDocumentType(ValueError):
    pass


def extract_text(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _extract_pdf(content)
    if lower.endswith(".docx"):
        return _extract_docx(content)
    if lower.endswith(".md") or lower.endswith(".markdown"):
        return _extract_markdown(content)
    raise UnsupportedDocumentType(
        f"Unsupported file type for '{filename}': only .pdf, .docx, .md are accepted"
    )


def _extract_pdf(content: bytes) -> str:
    with fitz.open(stream=content, filetype="pdf") as doc:
        return "\n".join(page.get_text() for page in doc)


def _extract_docx(content: bytes) -> str:
    document = docx.Document(io.BytesIO(content))
    return "\n".join(p.text for p in document.paragraphs)


def _extract_markdown(content: bytes) -> str:
    raw = content.decode("utf-8")
    html = _MD.render(raw)
    return _HTML_TAG_RE.sub(" ", html)
