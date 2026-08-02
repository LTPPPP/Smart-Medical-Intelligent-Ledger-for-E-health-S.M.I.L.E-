"""Build the figures for Report 6 section 2.2 Installation Instruction.

These are diagrams of the documented procedure — the download/install/verify
sequence for each prerequisite and the stack the installation produces. They are
NOT screenshots: vendor download pages have to be captured from a real browser,
and drawing an imitation of one would be a fabrication.

Writes docs/diagrams/img/install-*.svg

Usage:  python3 scripts/reports/gen_install_figures.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

from svg import Svg, text_width, truncate  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "docs", "diagrams", "img")

INK, SOFT, FAINT = "#0F1B1E", "#4A5C63", "#80959C"
EDGE = "#5A7D86"
STEP_FILL, STEP_LINE = "#DCEBFA", "#4A7EBB"
CMD_FILL, CMD_LINE = "#12211F", "#12211F"
OK_FILL, OK_LINE = "#E7F3EA", "#4E8F63"

W, H, GAP = 250.0, 96.0, 54.0
TITLE_H = 50.0


def steps_figure(name, title, subtitle, steps):
    """steps = [(heading, [lines...], kind)] where kind is 'step' | 'cmd' | 'done'."""
    width = len(steps) * W + (len(steps) - 1) * GAP
    body_h = max(H, max(H, 34 + 15 * max(len(s[1]) for s in steps)))
    height = TITLE_H + body_h
    svg = Svg(max(width, text_width(subtitle, 11)), height, title)

    svg.text(0, 18, title, size=17, weight="600", fill=INK)
    svg.text(0, 36, subtitle, size=11, fill=SOFT)

    for i, (heading, lines, kind) in enumerate(steps):
        x = i * (W + GAP)
        y = TITLE_H
        fill, line = {"step": (STEP_FILL, STEP_LINE), "cmd": (CMD_FILL, CMD_LINE),
                      "done": (OK_FILL, OK_LINE)}[kind]
        svg.rect(x, y, W, body_h, fill, line, rx=6)
        head_ink = "#FFFFFF" if kind == "cmd" else INK
        svg.text(x + 14, y + 22, heading, size=12.5, weight="600", fill=head_ink)
        for j, ln in enumerate(lines):
            mono = kind == "cmd"
            svg.text(x + 14, y + 42 + j * 15,
                     truncate(ln, 10 if mono else 10.5, W - 28, mono=mono),
                     size=10 if mono else 10.5,
                     fill="#9FD8C8" if mono else SOFT, mono=mono)
        if i < len(steps) - 1:
            cy = y + body_h / 2
            svg.line([(x + W, cy), (x + W + GAP, cy)], EDGE, sw=1.2)
    return svg, name


FIGURES = [
    ("install-overview", "Installation overview", "Four prerequisites, then the stack itself", [
        ("1. Docker Desktop", ["Container runtime for the", "six application services", "and the databases"], "step"),
        ("2. Node.js 20 LTS", ["Runs the NestJS services", "and the Next.js web", "application"], "step"),
        ("3. Python 3.11 / 3.13", ["Runs kyc_ocr_service and", "booking_langgraph_service", "in separate venvs"], "step"),
        ("4. PostgreSQL 16", ["Six logical databases,", "one per service boundary"], "step"),
        ("5. Start the stack", ["make up", "docker compose ps"], "cmd"),
    ]),
    ("install-docker", "2.2.1 Install Docker Desktop", "Windows requires WSL 2 first", [
        ("Step 1 — Enable WSL 2", ["PowerShell as Administrator", "Windows only", "Restart if prompted"], "step"),
        ("wsl --install", ["Installs the WSL 2 kernel", "and a default distribution"], "cmd"),
        ("Step 2 — Install", ["Download from docker.com", "Keep 'Use WSL 2' ticked", "Launch Docker Desktop"], "step"),
        ("Step 3 — Configure", ["Settings > Resources", "At least 4 CPUs and 8 GB", "— six services run at once"], "step"),
        ("Verify", ["docker --version", "docker compose version", "docker run hello-world"], "cmd"),
    ]),
    ("install-node", "2.2.2 Install Node.js 20 LTS", "Required by every NestJS service and the web application", [
        ("Step 1 — Download", ["nodejs.org/en/download", "Choose the 20 LTS", "64-bit package"], "step"),
        ("Step 2 — Run setup", ["Accept the defaults", "Keep 'Add to PATH'", "checked"], "step"),
        ("Step 3 — Verify", ["Open a new terminal", "so PATH is picked up"], "step"),
        ("Expected output", ["node --version", "  v20.x.x", "npm --version", "  10.x.x"], "cmd"),
    ]),
    ("install-python", "2.2.3 Install Python 3.11 and 3.13", "Two versions: one per AI service", [
        ("Step 1 — Download", ["python.org/downloads", "3.11 for kyc_ocr_service", "3.13 for booking assistant"], "step"),
        ("Step 2 — Run setup", ["Tick 'Add python.exe", "to PATH' on the first", "screen before installing"], "step"),
        ("Step 3 — KYC OCR venv", ["cd ai/kyc_ocr_service", "python3.11 -m venv .venv", "pip install -r requirements.txt"], "cmd"),
        ("Step 4 — Booking venv", ["cd ai/booking_langgraph_service", "python3.13 -m venv .venv", "pip install -r requirements.txt"], "cmd"),
    ]),
    ("install-postgres", "2.2.4 Install PostgreSQL 16", "One server, six logical databases", [
        ("Step 1 — Download", ["postgresql.org/download", "EnterpriseDB installer", "for Windows (64-bit)"], "step"),
        ("Step 2 — Install", ["Keep Server, pgAdmin 4", "and Command Line Tools", "Port 5432, set password"], "step"),
        ("Step 3 — Initialise", ["psql -h localhost -U postgres", "  -f docker/init-db.sql"], "cmd"),
        ("Databases created", ["auth_service_db", "account_service_db", "core_medical_service_db",
                               "core_clinic_service_db", "payment_service_db", "booking_orchestrator_db"], "done"),
    ]),
]


def generate() -> None:
    os.makedirs(OUT, exist_ok=True)
    for name, title, subtitle, steps in FIGURES:
        svg, _ = steps_figure(name, title, subtitle, steps)
        path = os.path.join(OUT, "%s.svg" % name)
        svg.save(path)
        print("  wrote %s (%.0f x %.0f)" % (os.path.relpath(path, ROOT), svg.w, svg.h))


if __name__ == "__main__":
    generate()
