"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] rounded-[20px] bg-[#1D2023] border border-[rgba(255,255,255,0.12)] p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(255,180,171,0.1)] border border-[rgba(255,180,171,0.2)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#FFB4AB]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 12a1 1 0 110-2 1 1 0 010 2zm1-3H7V4h2v5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Cancel Appointment</h2>
              <p className="text-xs text-[#8B9199]">APT-001 · Sarah Jenkins</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8B9199] hover:text-[#E1E2E6] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
          </button>
        </div>

        {/* Policy Warning */}
        <div className="p-4 rounded-[12px] bg-[rgba(255,180,171,0.08)] border border-[rgba(255,180,171,0.2)]">
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-[#FFB4AB] mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 12a1 1 0 110-2 1 1 0 010 2zm1-3H7V4h2v5z" />
            </svg>
            <div>
              <div className="text-sm font-semibold text-[#FFB4AB]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cancellation Policy</div>
              <p className="text-[12px] text-[#C1C7CF] mt-1 leading-5">
                Cancellations within 24 hours may incur a fee. Patient will be notified via SMS and email.
              </p>
            </div>
          </div>
        </div>

        {/* Refund Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[rgba(247,188,104,0.1)] border border-[rgba(247,188,104,0.2)] text-[#F7BC68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Refund Eligible
          </span>
          <span className="text-[12px] text-[#8B9199]">Full refund if cancelled 48h+ before appointment</span>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cancellation Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] outline-none appearance-none cursor-pointer focus:border-[rgba(255,180,171,0.4)]"
          >
            <option value="">Select reason...</option>
            <option value="patient_request">Patient Request</option>
            <option value="doctor_unavailable">Doctor Unavailable</option>
            <option value="emergency">Medical Emergency</option>
            <option value="no_show">No Show</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Detail */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Additional Details</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Provide additional context for this cancellation..."
            className="w-full h-[88px] p-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.4)] resize-none outline-none focus:border-[rgba(255,180,171,0.4)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6] hover:bg-[rgba(255,255,255,0.05)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Keep Appointment
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[rgba(255,180,171,0.15)] border border-[rgba(255,180,171,0.3)] text-sm font-semibold text-[#FFB4AB] hover:bg-[rgba(255,180,171,0.25)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Update Slide-Over ─────────────────────────────────────────────────────────
function UpdatePanel({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState("2026-03-18");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("Root Canal");
  const [room, setRoom] = useState("3A");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[420px] h-full bg-[#1D2023] border-l border-[rgba(255,255,255,0.12)] flex flex-col overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <h2 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Update Appointment</h2>
            <p className="text-xs text-[#8B9199] mt-0.5">APT-001 · Sarah Jenkins</p>
          </div>
          <button onClick={onClose} className="text-[#8B9199] hover:text-[#E1E2E6] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5L5 15M5 5l10 10"/></svg>
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] outline-none focus:border-[rgba(146,205,253,0.4)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] outline-none focus:border-[rgba(146,205,253,0.4)]"
              />
            </div>
          </div>

          {/* Conflict Detection */}
          <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[rgba(69,240,207,0.06)] border border-[rgba(69,240,207,0.15)]">
            <svg className="w-4 h-4 text-[#45F0CF] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-2h2v2zm0-4H7V4h2v4z"/></svg>
            <span className="text-[12px] text-[#45F0CF]">No conflicts detected for selected time.</span>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Appointment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] outline-none appearance-none cursor-pointer focus:border-[rgba(146,205,253,0.4)]"
            >
              <option>Root Canal</option>
              <option>Crown Prep</option>
              <option>Scaling & Polishing</option>
              <option>Consultation</option>
              <option>Orthodontic Review</option>
              <option>Extraction</option>
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Room Allocation</label>
            <div className="grid grid-cols-4 gap-2">
              {["1A", "1B", "2A", "3A", "3B", "4C", "4D"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`h-[38px] rounded-[10px] text-sm font-semibold transition-colors ${
                    room === r
                      ? "bg-[rgba(146,205,253,0.15)] border border-[#92CDFD] text-[#92CDFD]"
                      : "bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] text-[#8B9199] hover:text-[#C1C7CF]"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Doctor Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this appointment update..."
              className="w-full h-[96px] p-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.4)] resize-none outline-none focus:border-[rgba(146,205,253,0.4)]"
            />
          </div>

          <div className="h-px bg-[rgba(255,255,255,0.08)]" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6] hover:bg-[rgba(255,255,255,0.05)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Cancel
            </button>
            <button className="px-5 py-2.5 rounded-full bg-[#92CDFD] text-[#003450] text-sm font-semibold hover:bg-[#82bded] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] rounded-[20px] bg-[#1D2023] border border-[rgba(255,255,255,0.12)] p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(69,240,207,0.1)] border border-[rgba(69,240,207,0.2)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#45F0CF]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.485 1.929L5.457 9.958 2.515 7.015 1.1 8.43l4.357 4.357 9.443-9.443z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Confirm Appointment</h2>
              <p className="text-xs text-[#8B9199]">Review details before confirming check-in</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8B9199] hover:text-[#E1E2E6] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5L5 15M5 5l10 10"/></svg>
          </button>
        </div>

        {/* Patient Context Card */}
        <div className="flex items-center gap-4 p-4 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
          <div className="w-12 h-12 rounded-full bg-[#323538] border border-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SJ</span>
          </div>
          <div>
            <div className="text-base font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Sarah Jenkins</div>
            <div className="text-[12px] text-[#8B9199]">ID: PAT-7821 · BlueCross Insurance</div>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full bg-[rgba(146,205,253,0.1)] border border-[rgba(146,205,253,0.2)] text-[11px] font-semibold text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Verified
          </div>
        </div>

        {/* Appointment Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Appointment Type", value: "Root Canal" },
            { label: "Doctor", value: "Dr. Thorne" },
            { label: "Date & Time", value: "Today, 9:00 AM" },
            { label: "Duration", value: "90 minutes" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-[10px] bg-[rgba(0,0,0,0.2)]">
              <div className="text-[10px] font-bold uppercase tracking-[1.1px] text-[#8B9199] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</div>
              <div className="text-sm font-medium text-[#E1E2E6]">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Room Assignment */}
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[rgba(146,205,253,0.06)] border border-[rgba(146,205,253,0.15)]">
          <svg className="w-4 h-4 text-[#92CDFD] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v10H8v2H6v-2H2V2zm2 2v6h8V4H4z"/>
          </svg>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[1.1px] text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Room Assignment</div>
            <div className="text-sm text-[#C1C7CF]">Room 3A — Dental Suite (Ground Floor)</div>
          </div>
        </div>

        {/* Check-in Confirmation */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-[5px] border-2 border-[#45F0CF] flex items-center justify-center mt-0.5 shrink-0 cursor-pointer">
            <svg className="w-3 h-3 text-[#45F0CF]" viewBox="0 0 12 12" fill="currentColor"><path d="M10.5 2.5L5 8 2 5"/></svg>
          </div>
          <p className="text-[12px] text-[#C1C7CF] leading-5">
            I confirm that the patient has arrived and all pre-appointment checks are complete. This will update the appointment status to &quot;In Progress&quot;.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6] hover:bg-[rgba(255,255,255,0.05)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Cancel
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#45F0CF] text-[#00382E] text-sm font-semibold hover:bg-[#35d0b0] transition-colors shadow-[0px_0px_15px_rgba(69,240,207,0.25)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor"><path d="M12 3L6 9 2 5"/></svg>
            Confirm Check-In
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Detail Content ───────────────────────────────────────────────────────
export function AppointmentDetailContent({ id }: { id: string }) {
  const [showCancel, setShowCancel] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {showCancel && <CancelModal onClose={() => setShowCancel(false)} />}
      {showUpdate && <UpdatePanel onClose={() => setShowUpdate(false)} />}
      {showConfirm && <ConfirmModal onClose={() => setShowConfirm(false)} />}

      <div className="flex flex-col gap-6 max-w-[1200px]">
        {/* Breadcrumb + Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/appointments" className="text-[12px] text-[#8B9199] hover:text-[#C1C7CF] transition-colors">Appointments</Link>
              <svg className="w-3 h-3 text-[#41474E]" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2l4 4-4 4"/></svg>
              <span className="text-[12px] text-[#92CDFD]">{id}</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.7px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
              Appointment Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCancel(true)}
              className="px-4 py-2 rounded-full border border-[rgba(255,180,171,0.3)] text-sm font-semibold text-[#FFB4AB] hover:bg-[rgba(255,180,171,0.08)] transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowUpdate(true)}
              className="px-4 py-2 rounded-full border border-[rgba(255,255,255,0.12)] text-sm font-semibold text-[#E1E2E6] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Update
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 rounded-full bg-[#45F0CF] text-[#00382E] text-sm font-semibold hover:bg-[#35d0b0] transition-colors shadow-[0px_0px_12px_rgba(69,240,207,0.2)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Confirm Check-In
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(69,240,207,0.1)] border border-[rgba(69,240,207,0.2)] text-[12px] font-semibold text-[#45F0CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#45F0CF] shadow-[0px_0px_6px_rgba(69,240,207,0.8)]" />
            In Progress
          </div>
          <span className="text-[12px] text-[#8B9199]">Started at 9:03 AM · Running 12 min</span>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-[1fr_380px] gap-6">
          {/* LEFT Column */}
          <div className="flex flex-col gap-4">
            {/* Patient Info */}
            <Section title="Patient Information" icon="patient">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#323538] border border-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SJ</span>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Sarah Jenkins</div>
                  <div className="text-sm text-[#8B9199]">ID: PAT-7821 · Female · 34 years</div>
                </div>
                <Link href="/patients/PAT-7821" className="text-[12px] text-[#92CDFD] hover:underline">View Profile</Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <InfoCell label="Phone" value="+1 (555) 234-8901" />
                <InfoCell label="Email" value="s.jenkins@email.com" />
                <InfoCell label="Insurance" value="BlueCross" />
              </div>
            </Section>

            {/* Provider & Location */}
            <Section title="Provider & Location" icon="provider">
              <div className="grid grid-cols-2 gap-4">
                <InfoCell label="Attending Doctor" value="Dr. Marcus Thorne" />
                <InfoCell label="Specialty" value="Endodontics" />
                <InfoCell label="Room" value="Room 3A — Dental Suite" />
                <InfoCell label="Floor" value="Ground Floor (East Wing)" />
              </div>
            </Section>

            {/* Notes & Complaint */}
            <Section title="Notes & Chief Complaint" icon="notes">
              <div className="p-4 rounded-[10px] bg-[rgba(0,0,0,0.2)]">
                <p className="text-sm text-[#C1C7CF] leading-6">
                  Patient reports severe throbbing pain in lower right molar (#30) for 3 days. Pain is constant, radiates to jaw. Sensitivity to cold and hot. Previous root canal on this tooth 8 years ago may have failed. X-rays ordered.
                </p>
              </div>
            </Section>

            {/* Medical Record Quick Access */}
            <Section title="Medical Record Quick Access" icon="records">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Last Visit", value: "Feb 12, 2026", sub: "Crown adjustment" },
                  { label: "Allergies", value: "Penicillin", sub: "Documented" },
                  { label: "Active Rx", value: "2 medications", sub: "View all" },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-[10px] bg-[rgba(0,0,0,0.2)] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#8B9199] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</div>
                    <div className="text-sm font-medium text-[#E1E2E6]">{item.value}</div>
                    <div className="text-[11px] text-[#92CDFD] mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* RIGHT Column */}
          <div className="flex flex-col gap-4">
            {/* Schedule Details */}
            <Section title="Schedule Details" icon="schedule">
              <div className="flex flex-col gap-3">
                <InfoCell label="Date" value="Monday, March 18, 2026" />
                <InfoCell label="Time" value="9:00 AM – 10:30 AM" />
                <InfoCell label="Duration" value="90 minutes" />
                <InfoCell label="Type" value="Root Canal (Molar)" />
                <InfoCell label="Appointment ID" value={id} />
              </div>
            </Section>

            {/* Payment Status */}
            <Section title="Payment Status" icon="payment">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>$850.00</div>
                  <div className="text-[12px] text-[#8B9199] mt-0.5">Insurance covers 70%</div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[rgba(247,188,104,0.1)] border border-[rgba(247,188,104,0.2)] text-[#F7BC68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Pending
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-[#45F0CF] to-[#92CDFD]" />
              </div>
              <div className="flex justify-between text-[11px] text-[#8B9199] mt-1">
                <span>Covered: $595</span>
                <span>Patient: $255</span>
              </div>
            </Section>

            {/* Reminders */}
            <Section title="Reminders & Communication" icon="reminders">
              <div className="flex flex-col gap-2">
                {[
                  { msg: "SMS reminder sent", time: "8:00 AM", done: true },
                  { msg: "Email confirmation sent", time: "Yesterday", done: true },
                  { msg: "Post-visit follow-up", time: "Scheduled", done: false },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${r.done ? "bg-[rgba(69,240,207,0.15)]" : "bg-[rgba(255,255,255,0.05)]"}`}>
                      {r.done && <svg className="w-2.5 h-2.5 text-[#45F0CF]" viewBox="0 0 10 10" fill="currentColor"><path d="M8.5 2L4 6.5 1.5 4"/></svg>}
                    </div>
                    <span className="flex-1 text-[12px] text-[#C1C7CF]">{r.msg}</span>
                    <span className="text-[11px] text-[#8B9199]">{r.time}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Activity Log */}
            <Section title="Activity Log" icon="log">
              <div className="flex flex-col gap-3">
                {[
                  { action: "Check-in started", by: "Dr. Thorne", time: "9:03 AM" },
                  { action: "Appointment confirmed", by: "Reception", time: "8:58 AM" },
                  { action: "Appointment booked", by: "Sarah Jenkins", time: "Mar 14, 2:30 PM" },
                ].map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#41474E] mt-1 shrink-0" />
                      {i < 2 && <div className="w-px flex-1 bg-[rgba(255,255,255,0.06)] my-1" />}
                    </div>
                    <div className="pb-2">
                      <div className="text-[12px] font-medium text-[#C1C7CF]">{entry.action}</div>
                      <div className="text-[11px] text-[#8B9199]">{entry.by} · {entry.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[10px] p-5">
      <h3 className="text-[13px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#8B9199] mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
      <div className="text-sm text-[#E1E2E6]">{value}</div>
    </div>
  );
}
