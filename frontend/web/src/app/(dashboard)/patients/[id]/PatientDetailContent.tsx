"use client";

import { useState } from "react";
import Link from "next/link";

interface TreatmentRecord {
  id: string;
  date: string;
  procedure: string;
  code: string;
  tooth: string;
  dentist: string;
  cost: string;
  time: string;
  status: "Completed" | "Follow-up" | "Scheduled";
  attachments: number;
}

const MOCK_TREATMENTS: TreatmentRecord[] = [
  { id: "1", date: "2026-03-15", procedure: "Root Canal Treatment", code: "D3330", tooth: "#36", dentist: "Dr. Marcus Thorne", cost: "$1,200", time: "10:30 AM", status: "Completed", attachments: 2 },
  { id: "2", date: "2026-02-28", procedure: "Crown Preparation", code: "D2740", tooth: "#36", dentist: "Dr. Marcus Thorne", cost: "$800", time: "2:15 PM", status: "Completed", attachments: 1 },
  { id: "3", date: "2026-01-10", procedure: "Crown Placement", code: "D2980", tooth: "#36", dentist: "Dr. Marcus Thorne", cost: "$600", time: "9:00 AM", status: "Follow-up", attachments: 0 },
];

const MOCK_PATIENT = {
  id: "PAT-00124",
  name: "Sarah Jenkins",
  initials: "SJ",
  bloodType: "A+",
  gender: "Female",
  dob: "1985-06-12",
  age: "40",
  status: "In Treatment" as const,
  allergies: [{ label: "Penicillin", variant: "warning" as const }, { label: "Sulfa", variant: "warning" as const }],
  conditions: ["Hypertension"],
  patientSince: "Patient since 2023",
  phone: [{ label: "MOBILE (PRIMARY)", value: "+1 (555) 234-5678" }, { label: "WORK", value: "+1 (555) 234-5679" }],
  email: "eleanor.vance@example.com",
  portalActive: true,
  address: { street: "4820 Redwood Valley Drive", apt: "Apt 4B, Building C", city: "San Francisco, CA 94114" },
  emergency: { name: "Marcus Vance", relationship: "Spouse", phone: "+1 (555) 849-2939" },
};

export function PatientDetailContent({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const p = MOCK_PATIENT;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "records", label: "Records" },
    { key: "treatments", label: "Treatments" },
    { key: "appointments", label: "Appointments" },
    { key: "billing", label: "Billing" },
  ];

  return (
    <div className="flex flex-col">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Patient</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.2)] text-white text-xs font-medium uppercase tracking-[0.3px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm-1 2v2H3v2h2v2h2V8h2V6H7V4H5z"/></svg>
            Schedule
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.2)] text-white text-xs font-medium uppercase tracking-[0.3px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-[10.67px] h-[10.67px]" viewBox="0 0 11 11" fill="currentColor"><path d="M5.5 0C2.46 0 0 2.46 0 5.5S2.46 11 5.5 11 11 8.54 11 5.5 8.54 0 5.5 0zm0 2c.83 0 1.5.67 1.5 1.5S6.33 5 5.5 5 4 4.33 4 3.5 4.67 2 5.5 2zm0 7c-1.33 0-2.5-.67-3.2-1.7.02-1.1 2.2-1.7 3.2-1.7s3.18.6 3.2 1.7c-.7 1.03-1.87 1.7-3.2 1.7z"/></svg>
            Message
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#45F0CF] text-[#00382E] text-xs font-semibold uppercase tracking-[0.3px] shadow-[0px_0px_20px_rgba(69,240,207,0.3)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-3 h-[13.33px]" viewBox="0 0 12 14" fill="currentColor"><path d="M6 0C4.34 0 3 1.34 3 3v3c0 1.66 1.34 3 3 3s3-1.34 3-3V3c0-1.66-1.34-3-3-3zm3.5 6c0 1.93-1.57 3.5-3.5 3.5S2.5 7.93 2.5 6V3c0-1.93 1.57-3.5 3.5-3.5S9.5 1.07 9.5 3v3zM12 7v1c0 3.31-2.69 6-6 6S0 11.31 0 8V7h1v1c0 2.76 2.24 5 5 5s5-2.24 5-5V7h1z"/></svg>
            Start Treatment
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#92CDFD] text-[#003450] text-xs font-semibold uppercase tracking-[0.3px] shadow-[0px_0px_20px_rgba(146,205,253,0.3)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-[10.67px] h-[13.33px]" viewBox="0 0 11 14" fill="currentColor"><path d="M1 0C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h9c.55 0 1-.45 1-1V4l-3-4H1zm0 1h6v4h4v8H1V1z"/></svg>
            Records
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left: Patient Identity Card */}
        <div className="w-[300px] shrink-0">
          <div className="rounded-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] p-[25px]">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-[#323538] border-2 border-[rgba(146,205,253,0.5)] shadow-[0px_0px_20px_rgba(146,205,253,0.2)] flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-[#C1C7CF]">SJ</span>
              </div>
              <h2 className="text-2xl font-semibold text-white text-center" style={{ fontFamily: "'Public Sans', sans-serif" }}>{p.name}</h2>
              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-[12px] font-semibold tracking-[1.2px] uppercase text-[#45F0CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.status}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[rgba(146,205,253,0.1)] border border-[rgba(146,205,253,0.2)]">
                <svg className="w-3 h-[15px] text-[#92CDFD]" viewBox="0 0 12 15" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s6 9 6 9 6-5.69 6-9S9.31 0 6 0zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>
                <span className="text-sm font-medium text-[#92CDFD] tracking-[0.35px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.bloodType}</span>
              </div>
            </div>

            <div className="h-px bg-[rgba(255,255,255,0.1)] mb-6" />

            {/* Demographics */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-[0.35px] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DOB</span>
                <span className="text-sm text-white">{p.dob}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-[0.35px] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Gender</span>
                <span className="text-sm text-white">{p.gender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-[0.35px] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Blood</span>
                <span className="text-sm text-white">{p.bloodType}</span>
              </div>
            </div>

            {/* Medical Tags */}
            <div className="flex flex-col gap-5 mb-6">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.3px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CRITICAL ALLERGIES</div>
                <div className="flex flex-wrap gap-2">
                  {p.allergies.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border bg-[rgba(247,188,104,0.1)] border-[rgba(247,188,104,0.3)] text-[#F7BC68] shadow-[0px_0px_10px_rgba(247,188,104,0.15)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      <svg className="w-[12.83px] h-[11.08px]" viewBox="0 0 13 12" fill="currentColor"><path d="M6.5 0C3.186 0 .5 2.686.5 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5S8.985 10.5 6.5 10.5 2 8.985 2 6.5 4.015 2 6.5 2zm-.5 2v3h1V4H6zm0 4v1h1V8H6z"/></svg>
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.3px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CONDITIONS</div>
                <div className="flex flex-wrap gap-2">
                  {p.conditions.map((c, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-[12px] font-medium border bg-[#323538] border-[rgba(255,255,255,0.1)] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 pt-4 border-t border-[rgba(255,255,255,0.1)]">
              <svg className="w-[13.33px] h-[13.33px] text-[#C1C7CF]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 10c-2.33 0-4.33-1.19-5.5-3 .02-1.99 3.66-3 5.5-3s5.48 1.01 5.5 3c-1.17 1.81-3.17 3-5.5 3z"/></svg>
              <span className="text-[12px] tracking-[0.3px] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.patientSince}</span>
            </div>
          </div>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="flex border-b border-[rgba(255,255,255,0.1)] mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium tracking-[0.35px] transition-colors ${activeTab === tab.key ? "text-[#45F0CF] border-b-2 border-[#45F0CF] shadow-[0px_4px_10px_-4px_rgba(69,240,207,0.5)]" : "text-[#C1C7CF]"}`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-6">
              {/* Primary Contact */}
              <div className="rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[rgba(146,205,253,0.1)] flex items-center justify-center">
                    <svg className="w-[13.5px] h-[13.5px] text-[#92CDFD]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-[0.35px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Primary Contact</span>
                </div>
                {p.phone.map((ph, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] mb-3">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{ph.label}</div>
                      <div className="text-base text-white">{ph.value}</div>
                    </div>
                    <svg className="w-[16.5px] h-[15.75px] text-[#92CDFD] opacity-70" viewBox="0 0 17 16" fill="currentColor"><path d="M15.5 0c.83 0 1.5.67 1.5 1.5 0 .4-.16.78-.44 1.06l-.94.94-2-2 .94-.94c.28-.28.66-.44 1.06-.44zM12.5 3.5l2 2L6 14H4v-2l8.5-8.5z"/></svg>
                  </div>
                ))}
              </div>

              {/* Email & Web */}
              <div className="rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[rgba(146,205,253,0.1)] flex items-center justify-center">
                    <svg className="w-[15px] h-3 text-[#92CDFD]" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 0L0 4v8h15V4L7.5 0zm0 2.18L12.06 5 7.5 7.82 2.94 5 7.5 2.18z"/></svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-[0.35px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Email & Web</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] mb-3">
                  <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRIMARY EMAIL</div>
                  <div className="text-base text-white break-all">{p.email}</div>
                </div>
                <div className="p-3 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)]">
                  <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PATIENT PORTAL STATUS</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#45F0CF] shadow-[0px_0px_8px_rgba(69,240,207,0.8)]" />
                    <span className="text-sm font-medium text-[#45F0CF]">Active</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="col-span-2 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] p-6">
                <div className="flex gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[rgba(146,205,253,0.1)] flex items-center justify-center">
                        <svg className="w-3 h-[13.5px] text-[#92CDFD]" viewBox="0 0 12 14" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s6 8 6 8 6-4.69 6-8S9.31 0 6 0zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>
                      </div>
                      <span className="text-sm font-medium uppercase tracking-[0.35px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Address</span>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)]">
                      <div className="text-lg text-white leading-7">{p.address.street}</div>
                      <div className="text-base text-[#C1C7CF] mt-1">{p.address.apt}</div>
                      <div className="text-base text-[#C1C7CF]">{p.address.city}</div>
                    </div>
                  </div>
                  <div className="w-[256px] h-[128px] rounded-[8px] bg-[rgba(255,255,255,0.5)] bg-blend-saturation opacity-60 border border-[rgba(255,255,255,0.1)] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111416] to-transparent z-[1]" />
                    <div className="w-full h-full bg-[#1D2023] flex items-center justify-center">
                      <span className="text-sm text-[#8B9199]">Map</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="col-span-2 rounded-[12px] bg-[rgba(255,255,255,0.04)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[rgba(247,188,104,0.1)] flex items-center justify-center">
                    <svg className="w-3 h-[15px] text-[#F7BC68]" viewBox="0 0 12 15" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s6 9 6 9 6-5.69 6-9S9.31 0 6 0zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-[0.35px] text-[#F7BC68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Emergency Contact</span>
                </div>
                <div className="flex gap-8 p-4 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(247,188,104,0.1)]">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NAME</div>
                    <div className="text-lg text-white">{p.emergency.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>RELATIONSHIP</div>
                    <div className="text-base text-white">{p.emergency.relationship}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PHONE</div>
                    <div className="text-base text-white">{p.emergency.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Treatments */}
          {activeTab === "treatments" && (
            <div className="relative pl-12">
              <div className="absolute left-[36px] top-2 bottom-0 w-px bg-gradient-to-b from-[rgba(146,205,253,0.5)] via-[rgba(69,240,207,0.3)] to-transparent" />
              {MOCK_TREATMENTS.map((tx, i) => {
                const nodeColors = ["bg-[#45F0CF]", "bg-[#92CDFD]", "bg-[#323538]"];
                const statusColors = { Completed: "bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)] text-[#45F0CF]", "Follow-up": "bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.2)] text-[#92CDFD]", Scheduled: "bg-[rgba(50,53,56,0.5)] border-[rgba(139,145,153,0.2)] text-[#8B9199]" };
                return (
                  <div key={tx.id} className="relative pb-12 last:pb-0">
                    <div className={`absolute w-4 h-4 rounded-full left-[-46px] top-8 border-2 border-[#111416] shadow-[0px_0px_10px_rgba(69,240,207,0.5)] ${nodeColors[i]}`} />
                    <div className="p-6 rounded-[20px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-1 rounded-[4px] text-[12px] font-medium tracking-[1.2px] border ${statusColors[tx.status]}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              {tx.status === "Completed" ? "Completed" : tx.status === "Follow-up" ? "Follow-up" : "Scheduled"}
                            </span>
                            <span className="text-sm text-[#C1C7CF]" style={{ fontFamily: "'Liberation Mono', monospace" }}>{tx.date}</span>
                          </div>
                          <h3 className="text-2xl font-semibold text-[#E1E2E6] mt-1" style={{ fontFamily: "'Public Sans', sans-serif" }}>{tx.procedure} — Tooth {tx.tooth}</h3>
                          <div className="text-sm text-[#8B9199] mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Code: {tx.code} • Endodontic Therapy, Molar</div>
                          <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-[13.33px] h-[13.33px] text-[#92CDFD]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>
                              <span className="text-sm text-[#C1C7CF]">{tx.dentist}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-[18.33px] h-[13.33px] text-[#92CDFD]" viewBox="0 0 19 14" fill="currentColor"><path d="M9 0v6H3v2h6v6h2V8h6V6h-6V0H9z"/></svg>
                              <span className="text-sm text-[#C1C7CF]" style={{ fontFamily: "'Liberation Mono', monospace" }}>{tx.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-[13.33px] h-[13.33px] text-[#92CDFD]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 10c-2.33 0-4.33-1.19-5.5-3 .02-1.99 3.66-3 5.5-3s5.48 1.01 5.5 3c-1.17 1.81-3.17 3-5.5 3z"/></svg>
                              <span className="text-sm text-[#C1C7CF]">{tx.cost}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-[180px] pl-6 border-l border-[rgba(255,255,255,0.1)]">
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-[13.5px] h-[13.5px] text-[#C1C7CF]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>
                            <span className="text-[12px] font-medium uppercase tracking-[1.2px] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Files</span>
                          </div>
                          <div className="flex gap-2">
                            {tx.attachments > 0 ? Array.from({ length: tx.attachments }, (_, j) => (
                              <div key={j} className="w-12 h-12 rounded-[8px] bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                                <span className="text-[10px] text-[#8B9199]">img</span>
                              </div>
                            )) : (
                              <span className="text-[12px] text-[rgba(139,145,153,0.5)]">No files</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Other tabs placeholder */}
          {(activeTab === "records" || activeTab === "appointments" || activeTab === "billing") && (
            <div className="flex items-center justify-center h-64 rounded-[12px] border border-dashed border-[rgba(255,255,255,0.1)]">
              <p className="text-[#C1C7CF]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}