"use client";

import { useState } from "react";
import Link from "next/link";

interface PatientRow {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  dob: string;
  age: string;
  allergies: string[];
  conditions: string[];
  status: "Active" | "Inactive";
  lastVisit: string;
}

const MOCK_PATIENTS: PatientRow[] = [
  { id: "PAT-00124", name: "Sarah Jenkins", code: "PAT-00124", phone: "(555) 234-5678", email: "sarah.jenkins@email.com", dob: "1985-06-12", age: "40 yrs", allergies: ["A+", "Penicillin"], conditions: ["Hypertension"], status: "Active", lastVisit: "Visited 3 days ago" },
  { id: "PAT-00125", name: "Marcus Chen", code: "PAT-00125", phone: "(555) 876-5432", email: "marcus.chen@email.com", dob: "1992-11-04", age: "33 yrs", allergies: ["A-", "Sulfa"], conditions: ["Asthma"], status: "Active", lastVisit: "Visited 2 wks ago" },
  { id: "PAT-00108", name: "Eleanor Vance", code: "PAT-00108", phone: "(555) 432-1098", email: "eleanor.vance@email.com", dob: "1968-03-22", age: "57 yrs", allergies: ["B+", "Latex"], conditions: ["Diabetes"], status: "Inactive", lastVisit: "Visited 6 mos ago" },
];

export function PatientsContent() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(146,205,253,0.1)] border border-[rgba(146,205,253,0.2)] shadow-[0px_0px_15px_rgba(146,205,253,0.15)] flex items-center justify-center">
            <svg className="w-[27.5px] h-5 text-[#92CDFD]" viewBox="0 0 28 20" fill="currentColor"><path d="M14 0C6.268 0 0 4.477 0 10s6.268 10 14 10 14-4.477 14-10S21.732 0 14 0zm0 3c1.933 0 3.5 1.567 3.5 3.5S15.933 10 14 10s-3.5-1.567-3.5-3.5S12.067 3 14 3zm0 14.2c-3.5 0-6.5-1.8-8.2-4.5.1-2.7 5.5-4.2 8.2-4.2s8.1 1.5 8.2 4.2c-1.7 2.7-4.7 4.5-8.2 4.5z"/></svg>
          </div>
          <div>
            <h1 className="text-[30px] font-bold tracking-[-0.75px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Patients</h1>
            <p className="text-sm text-[#C1C7CF]">{filtered.length} registered patients</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/patients/new" className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#92CDFD] text-[#003450] text-base font-semibold shadow-[0px_0px_15px_rgba(146,205,253,0.2)] hover:bg-[#82bded] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <svg className="w-[18.33px] h-[13.33px]" viewBox="0 0 19 14" fill="currentColor"><path d="M9 0v6H3v2h6v6h2V8h6V6h-6V0H9z"/></svg>
            Add Patient
          </Link>
          <button className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center" title="Notifications">
            <svg className="w-4 h-5 text-[#C1C7CF]" viewBox="0 0 16 20" fill="currentColor"><path d="M8 0C5.79 0 4 1.79 4 4v2.18c0 .53-.21 1.04-.59 1.41l-1.4 1.4C1.26 9.74 1 10.36 1 11v1c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-1c0-.64-.26-1.26-.73-1.73l-1.4-1.4A2.01 2.01 0 0112 6.18V4c0-2.21-1.79-4-4-4zM5.5 18c.83 0 1.5-.67 1.5-1.5V16H3v.5c0 .83.67 1.5 1.5 1.5h1z"/></svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center" title="Profile">
            <div className="w-[38px] h-[38px] rounded-full bg-[#323538] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
              <span className="text-xs font-bold text-[#C1C7CF]">DR</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[672px]">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#C1C7CF]" viewBox="0 0 18 18" fill="currentColor"><path d="M12.5 11h-.79l-.28-.27A6.47 6.47 0 0014 6.5 6.5 6.5 0 107.5 13c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L17.49 16l-4.99-5zM7.5 11C5.01 11 3 8.99 3 6.5S5.01 2 7.5 2 12 4.01 12 6.5 9.99 11 7.5 11z"/></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, patient code, phone..." className="w-full h-[62px] pl-12 pr-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-[#E1E2E6] text-sm placeholder:text-[#8B9199] outline-none" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="h-[46px] px-4 pr-10 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-[#E1E2E6] text-sm appearance-none cursor-pointer outline-none"><option>Status</option><option>Active</option><option>Inactive</option></select>
          <select className="h-[46px] px-4 pr-10 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-[#E1E2E6] text-sm appearance-none cursor-pointer outline-none"><option>Department</option><option>General</option><option>Ortho</option><option>Endo</option></select>
          <select className="h-[46px] px-4 pr-10 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-[#E1E2E6] text-sm appearance-none cursor-pointer outline-none"><option>Sort</option><option>Name</option><option>Date</option><option>Status</option></select>
          <label className="flex items-center gap-2 h-[46px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded-[4px] bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.2)] accent-[#92CDFD]" />
            <span className="text-sm text-[#C1C7CF]">Show inactive</span>
          </label>
          <button className="w-11 h-11 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center" title="Clear filters">
            <svg className="w-[16.5px] h-[16.5px] text-[#C1C7CF]" viewBox="0 0 17 17" fill="currentColor"><path d="M8.5 0a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm3.54 11.54l-1.06 1.06L8.5 10.06l-2.48 2.48-1.06-1.06L7.44 9 4.96 6.52l1.06-1.06L8.5 7.94l2.48-2.48 1.06 1.06L9.56 9l2.48 2.48z"/></svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center h-8 px-6">
          <span className="w-[200px] text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Patient</span>
          <span className="w-[200px] text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contact</span>
          <span className="w-[150px] text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Demographics</span>
          <span className="w-[150px] text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tags</span>
          <span className="w-[100px] text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Status</span>
          <span className="flex-1 text-right text-[12px] font-semibold tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Actions</span>
        </div>
        {filtered.map((patient) => {
          const isActive = patient.status === "Active";
          return (
            <Link key={patient.id} href={`/patients/${patient.id}`} className="flex items-center px-6 py-[25px] rounded-[20px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px] hover:bg-[rgba(29,32,35,0.7)] transition-colors">
              <div className="w-[200px] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.002)] border border-[rgba(255,255,255,0.2)] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#C1C7CF]">{patient.name.split(" ").map(w => w[0]).join("")}</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>{patient.name}</div>
                  <div className="text-[12px] font-mono tracking-[1.2px] uppercase text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{patient.code}</div>
                </div>
              </div>
              <div className="w-[200px] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-[#C1C7CF]" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C2.686 0 0 2.686 0 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5S8.485 10.5 6 10.5 1.5 8.485 1.5 6 3.515 1.5 6 1.5zM5 3v3.5l3 1.5.5-.866L6 6V3H5z"/></svg>
                  <span className="text-sm text-[#C1C7CF]">{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-[13.33px] h-[10.67px] text-[#C1C7CF]" viewBox="0 0 14 11" fill="currentColor"><path d="M7 0L0 3v8h14V3L7 0zm0 2.18L11.56 5 7 7.82 2.44 5 7 2.18z"/></svg>
                  <span className="text-sm text-[#C1C7CF] truncate max-w-[140px]">{patient.email}</span>
                </div>
              </div>
              <div className="w-[150px]">
                <div className="text-sm text-[#E1E2E6]">{patient.dob}</div>
                <div className="text-[12px] text-[#C1C7CF] mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>({patient.age})</div>
              </div>
              <div className="w-[150px] flex flex-wrap gap-1">
                {patient.allergies.map((a, i) => (
                  <span key={i} className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${a === "Penicillin" || a === "Sulfa" || a === "Latex" ? "bg-[rgba(255,180,171,0.15)] border-[rgba(255,180,171,0.3)] text-[#FFB4AB]" : "bg-[rgba(247,188,104,0.15)] border-[rgba(247,188,104,0.3)] text-[#F7BC68]"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{a}</span>
                ))}
                {patient.conditions.map((c, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-[12px] font-medium border bg-[rgba(247,188,104,0.15)] border-[rgba(247,188,104,0.3)] text-[#F7BC68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c}</span>
                ))}
              </div>
              <div className="w-[100px]">
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border w-fit mb-2" style={{ borderColor: isActive ? "rgba(69,240,207,0.2)" : "rgba(255,255,255,0.1)", backgroundColor: isActive ? "rgba(69,240,207,0.1)" : "transparent" }}>
                  {isActive && <span className="w-[11.67px] h-[11.67px] rounded-full bg-[#45F0CF]" />}
                  <span className="text-[12px] font-medium" style={{ color: isActive ? "#45F0CF" : "#C1C7CF", fontFamily: "'Space Grotesk', sans-serif" }}>{patient.status}</span>
                </div>
                <div className="text-[12px] text-[#C1C7CF] leading-4">{patient.lastVisit}</div>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2">
                <button className="w-[22px] h-10 rounded-[15.5px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center" title="View"><svg className="w-[18.33px] h-[12.5px] text-[#C1C7CF]" viewBox="0 0 19 13" fill="currentColor"><path d="M9.5 0C4.25 0 0 4.25 0 9.5S4.25 19 9.5 19 19 14.75 19 9.5 14.75 0 9.5 0zm0 14c-2.48 0-4.5-2.02-4.5-4.5S7.02 5 9.5 5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-2c1.38 0 2.5-1.12 2.5-2.5S10.88 7 9.5 7 7 8.12 7 9.5 8.12 12 9.5 12z"/></svg></button>
                <button className="w-[22px] h-10 rounded-[15.5px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center" title="Edit"><svg className="w-[15px] h-[15px] text-[#C1C7CF]" viewBox="0 0 15 15" fill="currentColor"><path d="M13.5 0c.83 0 1.5.67 1.5 1.5 0 .4-.16.78-.44 1.06l-.94.94-2-2 .94-.94c.28-.28.66-.44 1.06-.44zM10.5 3.5l2 2L4 14H2v-2l8.5-8.5z"/></svg></button>
                <button className="ml-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] text-sm font-medium text-[#E1E2E6] backdrop-blur-[5px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Open</button>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4">
        <span className="text-sm text-[#C1C7CF]">Showing {filtered.length} of 12 patients</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center disabled:opacity-50">
            <svg className="w-[7.4px] h-3 text-[#C1C7CF]" viewBox="0 0 8 12" fill="currentColor"><path d="M7.41 10.59L2.83 6l4.58-4.59L6 0 0 6l6 6z"/></svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-full text-base font-normal flex items-center justify-center ${currentPage === i + 1 ? "bg-[rgba(146,205,253,0.2)] border border-[rgba(146,205,253,0.3)] text-[#92CDFD]" : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#C1C7CF]"}`} style={{ fontFamily: "'Public Sans', sans-serif" }}>{i + 1}</button>
          ))}
          <span className="px-2 text-base text-[#C1C7CF]">...</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center disabled:opacity-50">
            <svg className="w-[7.4px] h-3 text-[#C1C7CF]" viewBox="0 0 8 12" fill="currentColor"><path d="M.59 10.59L5.17 6 .59 1.41 2 0l6 6-6 6z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}