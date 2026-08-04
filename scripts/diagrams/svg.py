"""A tiny SVG builder — enough for boxes, orthogonal connectors and labels.

Written by hand because this box has no PlantUML, no Graphviz and no headless
browser, and an SVG is what actually goes into the Word report.
"""

from __future__ import annotations

from xml.sax.saxutils import escape

# Character-width factors for the fallback sans stack, used to size boxes and
# label plates. Approximate on purpose — SVG has no text metrics without a font
# engine, and being slightly generous is harmless.
_W_SANS = 0.55
_W_MONO = 0.60


def text_width(s: str, size: float, mono: bool = False) -> float:
    return len(s) * size * (_W_MONO if mono else _W_SANS)


def truncate(s: str, size: float, max_px: float, mono: bool = False) -> str:
    if text_width(s, size, mono) <= max_px:
        return s
    keep = max(1, int(max_px / (size * (_W_MONO if mono else _W_SANS))) - 1)
    return s[:keep] + "…"


class Svg:
    def __init__(self, width: float, height: float, title: str, pad: float = 24):
        self.w = width + pad * 2
        self.h = height + pad * 2
        self.pad = pad
        self.title = title
        self.parts: list[str] = []

    # -- primitives ---------------------------------------------------------
    def rect(self, x, y, w, h, fill, stroke, rx=4, sw=1.2, extra=""):
        self.parts.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>'
        )

    def line(self, pts, stroke, sw=1.2, dash="", marker=True):
        d = " ".join(("M" if i == 0 else "L") + f"{x:.1f},{y:.1f}" for i, (x, y) in enumerate(pts))
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        arrow = ' marker-end="url(#arrow)"' if marker else ""
        self.parts.append(
            f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}"'
            f'{dash_attr}{arrow} stroke-linejoin="round"/>'
        )

    def text(self, x, y, s, size=12, fill="#0F1B1E", anchor="start", weight="400",
             mono=False, opacity=1.0):
        family = (
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            if mono
            else "Segoe UI, Helvetica Neue, Arial, sans-serif"
        )
        op = f' opacity="{opacity}"' if opacity != 1.0 else ""
        self.parts.append(
            f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{op}>{escape(s)}</text>'
        )

    def label_plate(self, cx, cy, s, size=10, fill="#4A5C63", bg="#FFFFFF"):
        """A short edge label on an opaque plate so it stays readable over lines."""
        w = text_width(s, size) + 8
        h = size + 5
        self.rect(cx - w / 2, cy - h / 2, w, h, bg, "none", rx=3, sw=0)
        self.text(cx, cy + size * 0.35, s, size=size, fill=fill, anchor="middle")

    # -- output -------------------------------------------------------------
    def render(self) -> str:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w:.0f}" height="{self.h:.0f}" '
            f'viewBox="0 0 {self.w:.0f} {self.h:.0f}" font-size="12">'
            f"<title>{escape(self.title)}</title>"
            '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            'markerHeight="7" orient="auto-start-reverse">'
            '<path d="M0,1 L9,5 L0,9 z" fill="#5A7D86"/></marker></defs>'
            f'<rect width="100%" height="100%" fill="#FFFFFF"/>'
            f'<g transform="translate({self.pad},{self.pad})">'
            + "".join(self.parts)
            + "</g></svg>"
        )

    def save(self, path: str) -> None:
        import os

        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(self.render())
