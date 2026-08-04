"""Build the figures for Report 6 section 3 User Manual.

One workflow figure per documented flow, drawn from the sequences and state
transitions written in the report itself, plus an overview for section 3.1 (which
carries an explicit "insert the features workflow" placeholder).

Writes docs/diagrams/img/flow-*.svg

Usage:  python3 scripts/reports/gen_userguide_figures.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

from svg import Svg, text_width, truncate  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "docs", "diagrams", "img")

INK, SOFT = "#0F1B1E", "#4A5C63"
EDGE = "#5A7D86"
ACTOR = {
    "PATIENT": ("#E3F0FB", "#3E7EB8"),
    "DOCTOR": ("#E7F3EA", "#4E8F63"),
    "ADMIN": ("#FBEEE3", "#B87A3E"),
    "RECEPTIONIST": ("#F0E9FA", "#7A5EB8"),
    "SYSTEM": ("#ECEFF1", "#6B7A80"),
}

BOX_W, BOX_H, H_GAP, V_GAP = 214.0, 60.0, 46.0, 16.0
TITLE_H, LANE_LABEL_W = 52.0, 108.0


def lane_figure(name, title, subtitle, lanes, states=None):
    """lanes = [(actor, [step, ...])]; drawn as swimlanes left to right."""
    # drop placeholder steps so a short lane simply ends instead of showing empty boxes
    lanes = [(a, [st for st in steps if st and st[0]]) for a, steps in lanes]
    cols = max(len(steps) for _a, steps in lanes)
    width = LANE_LABEL_W + cols * BOX_W + (cols - 1) * H_GAP
    height = TITLE_H + len(lanes) * (BOX_H + V_GAP)
    if states:
        height += 46
    svg = Svg(max(width, text_width(subtitle, 11)), height, title)

    svg.text(0, 18, title, size=17, weight="600", fill=INK)
    svg.text(0, 36, subtitle, size=11, fill=SOFT)

    prev_end = None
    for li, (actor, steps) in enumerate(lanes):
        y = TITLE_H + li * (BOX_H + V_GAP)
        fill, line = ACTOR.get(actor, ACTOR["SYSTEM"])
        svg.rect(0, y, LANE_LABEL_W - 12, BOX_H, fill, line, rx=5)
        svg.text((LANE_LABEL_W - 12) / 2, y + BOX_H / 2 + 4, actor,
                 size=11, weight="600", fill=INK, anchor="middle")
        for si, step in enumerate(steps):
            x = LANE_LABEL_W + si * (BOX_W + H_GAP)
            svg.rect(x, y, BOX_W, BOX_H, "#FFFFFF", line, rx=5)
            for k, part in enumerate(step):
                svg.text(x + 12, y + 22 + k * 15,
                         truncate(part, 10.5 if k == 0 else 9.5, BOX_W - 24, mono=(k > 0)),
                         size=10.5 if k == 0 else 9.5,
                         weight="600" if k == 0 else "400",
                         fill=INK if k == 0 else SOFT, mono=(k > 0))
            if si:
                px = LANE_LABEL_W + (si - 1) * (BOX_W + H_GAP) + BOX_W
                svg.line([(px, y + BOX_H / 2), (x, y + BOX_H / 2)], EDGE, sw=1.1)
        if prev_end is not None:
            # hand-off between actors
            x = LANE_LABEL_W + BOX_W / 2
            svg.line([(x, y - V_GAP), (x, y)], EDGE, sw=1.1, dash="4 3")
        prev_end = y

    if states:
        y = TITLE_H + len(lanes) * (BOX_H + V_GAP) + 10
        svg.text(0, y + 10, "State transitions:", size=10, weight="600", fill=SOFT)
        svg.text(120, y + 10, "  ".join(states), size=10, fill=SOFT, mono=True)
    return svg


FIGURES = [
    ("flow-overview", "S.M.I.L.E — end-to-end workflow",
     "Five flows, each one the precondition of the next",
     [("PATIENT", [["1. Onboarding", "register, OTP, KYC"],
                   ["2. Booking", "choose slot, pay"],
                   ["4. Payment", "VNPay, refund"]]),
      ("DOCTOR", [["3. Clinical visit", "examine, prescribe"],
                  ["3. Finalise", "sign the record"],
                  ["", ""]]),
      ("ADMIN", [["1. Approve KYC", "verify identity"],
                 ["5. Configure clinic", "catalog, roles"],
                 ["5. Oversight", "reports, audit log"]])],
     None),

    ("flow1-onboarding", "Flow 1 — Patient onboarding and identity verification",
     "From no account to a VERIFIED patient",
     [("PATIENT", [["Register", "/register"],
                   ["Verify phone", "/profile — OTP"],
                   ["Submit KYC", "/profile — CCCD"]]),
      ("ADMIN", [["Review submission", "/admin/kyc-management"],
                 ["Approve or reject", "with reason"],
                 ["", ""]])],
     ["NOT_SUBMITTED", "->", "PENDING_REVIEW", "->", "VERIFIED / REJECTED"]),

    ("flow2-booking", "Flow 2 — Appointment booking and reminder",
     "Patient or receptionist runs the same wizard",
     [("PATIENT", [["Choose method", "/appointments/new"],
                   ["Pick doctor and slot", "clinic, service, time"],
                   ["Confirm booking", "status: scheduled"]]),
      ("SYSTEM", [["Send confirmation", "email queued"],
                  ["Send reminder", "202 Accepted"],
                  ["Confirm", "status: confirmed"]])],
     ["scheduled", "->", "confirmed", "(or cancelled)"]),

    ("flow3-visit", "Flow 3 — Clinical visit, from check-in to signed record",
     "Receptionist checks in; the doctor completes and signs",
     [("RECEPTIONIST", [["Check in", "/appointments/[id]"], ["", ""], ["", ""]]),
      ("DOCTOR", [["Open session", "/examinations/new"],
                  ["Symptoms, diagnoses", "treatment plan"],
                  ["Prescribe and finalise", "record locked"]])],
     ["checked_in", "->", "in_progress", "->", "completed (signed)"]),

    ("flow4-payment", "Flow 4 — Payment and refund",
     "VNPay collects; the administrator decides refunds",
     [("PATIENT", [["Pay now", "/appointments/[id]"],
                   ["VNPay checkout", "signed redirect"],
                   ["Request refund", "with reason"]]),
      ("ADMIN", [["Review queue", "/admin/refunds"],
                 ["Approve or reject", "with justification"],
                 ["Check revenue", "/admin/revenue-reports"]])],
     ["unpaid", "->", "paid", "->", "REQUESTED", "->", "REFUNDED / REJECTED"]),

    ("flow5-administration", "Flow 5 — Clinic administration and oversight",
     "Configure the clinic, then read the system back",
     [("ADMIN", [["Build catalog", "clinics, rooms, services"],
                 ["Assign roles", "/admin/users-management"],
                 ["Oversight", "revenue, audit log"]]),
      ("DOCTOR", [["Review shifts", "/schedules/my-schedule"],
                  ["Request leave", "/schedules/leaves/new"],
                  ["", ""]])],
     None),
]


def generate() -> None:
    os.makedirs(OUT, exist_ok=True)
    for name, title, subtitle, lanes, states in FIGURES:
        svg = lane_figure(name, title, subtitle, lanes, states)
        path = os.path.join(OUT, "%s.svg" % name)
        svg.save(path)
        print("  wrote %s (%.0f x %.0f)" % (os.path.relpath(path, ROOT), svg.w, svg.h))


if __name__ == "__main__":
    generate()
