"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK_APPOINTMENTS = [
  {
    id: "APT-001",
    patient: "Sarah Jenkins",
    initials: "SJ",
    type: "Root Canal",
    doctor: "Dr. Thorne",
    room: "Room 3A",
    date: "Today, 9:00 AM",
    duration: "90 min",
    status: "In Progress" as const,
    insurance: "BlueCross",
  },
  {
    id: "APT-002",
    patient: "Marcus Chen",
    initials: "MC",
    type: "Crown Prep",
    doctor: "Dr. Chen",
    room: "Room 1B",
    date: "Today, 11:30 AM",
    duration: "60 min",
    status: "Confirmed" as const,
    insurance: "Aetna",
  },
  {
    id: "APT-003",
    patient: "Eleanor Vance",
    initials: "EV",
    type: "Scaling & Polishing",
    doctor: "Dr. Thorne",
    room: "Room 2A",
    date: "Today, 2:00 PM",
    duration: "45 min",
    status: "Confirmed" as const,
    insurance: "United",
  },
  {
    id: "APT-004",
    patient: "James Holloway",
    initials: "JH",
    type: "Consultation",
    doctor: "Dr. Rivera",
    room: "Room 4C",
    date: "Tomorrow, 9:30 AM",
    duration: "30 min",
    status: "Scheduled" as const,
    insurance: "Cigna",
  },
  {
    id: "APT-005",
    patient: "Priya Nair",
    initials: "PN",
    type: "Orthodontic Review",
    doctor: "Dr. Chen",
    room: "Room 1B",
    date: "Tomorrow, 1:00 PM",
    duration: "45 min",
    status: "Scheduled" as const,
    insurance: "Humana",
  },
];

const STATUS_STYLES = {
  "In Progress": {
    badge: "text-[#45F0CF] bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)]",
    dot: "bg-[#45F0CF] shadow-[0px_0px_6px_rgba(69,240,207,0.8)]",
  },
  Confirmed: {
    badge: "text-[#92CDFD] bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.2)]",
    dot: "bg-[#92CDFD]",
  },
  Scheduled: {
    badge: "text-[#F7BC68] bg-[rgba(247,188,104,0.1)] border-[rgba(247,188,104,0.2)]",
    dot: "bg-[#F7BC68]",
  },
};

const TABS = ["All", "In Progress", "Confirmed", "Scheduled", "Cancelled"];

export function AppointmentsContent() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = MOCK_APPOINTMENTS.filter((a) => {
    const matchTab = activeTab === "All" || a.status === activeTab;
    const matchSearch =
      search === "" ||
      a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[30px] font-semibold tracking-[-0.75px] text-[#E1E2E6]"
            style={{ fontFamily: "'Public Sans', sans-serif" }}
          >
            Appointments
          </h1>
          <p className="text-base text-[#C1C7CF]">
            Manage and track all patient appointments.
          </p>
        </div>
        <Link
          href="/appointments/booking"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#45F0CF] text-[#00382E] text-base font-semibold shadow-[0px_0px_15px_rgba(69,240,207,0.2)] hover:bg-[#35d0b0] transition-colors"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 0v6H1v2h6v6h2V8h6V6H9V0H7z" />
          </svg>
          New Appointment
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Total", value: "12", color: "#E1E2E6" },
          { label: "In Progress", value: "1", color: "#45F0CF" },
          { label: "Confirmed", value: "5", color: "#92CDFD" },
          { label: "Scheduled", value: "6", color: "#F7BC68" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-[12px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[10px]"
          >
            <div
              className="text-[28px] font-bold"
              style={{ color: stat.color, fontFamily: "'Public Sans', sans-serif" }}
            >
              {stat.value}
            </div>
            <div
              className="text-[11px] font-semibold uppercase tracking-[1px] text-[#8B9199] mt-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[rgba(0,0,0,0.2)] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-[8px] text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-[rgba(255,255,255,0.08)] text-[#E1E2E6]"
                  : "text-[#8B9199] hover:text-[#C1C7CF]"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-[320px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#41474E]"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.099zm-5.242 1.156a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
          </svg>
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 rounded-[10px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] text-sm text-[#E1E2E6] placeholder:text-[#41474E] outline-none focus:border-[rgba(146,205,253,0.3)]"
          />
        </div>
      </div>

      {/* Appointment Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#8B9199]">
            No appointments found.
          </div>
        )}
        {filtered.map((apt) => {
          const styles = STATUS_STYLES[apt.status];
          return (
            <Link
              key={apt.id}
              href={`/appointments/${apt.id}`}
              className="flex items-center px-6 py-4 rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[10px] hover:border-[rgba(255,255,255,0.16)] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#323538] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mr-4 shrink-0">
                <span
                  className="text-xs font-bold text-[#C1C7CF]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {apt.initials}
                </span>
              </div>

              {/* Patient & Type */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-base font-semibold text-[#E1E2E6] group-hover:text-white transition-colors"
                  style={{ fontFamily: "'Public Sans', sans-serif" }}
                >
                  {apt.patient}
                </div>
                <div className="text-[12px] text-[#8B9199]">{apt.type}</div>
              </div>

              {/* Doctor & Room */}
              <div className="w-[160px] hidden md:block">
                <div className="text-sm text-[#C1C7CF]">{apt.doctor}</div>
                <div className="text-[12px] text-[#8B9199]">{apt.room}</div>
              </div>

              {/* Date */}
              <div className="w-[160px] hidden lg:block">
                <div className="text-sm text-[#C1C7CF]">{apt.date}</div>
                <div className="text-[12px] text-[#8B9199]">{apt.duration}</div>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${styles.badge}`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                {apt.status}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
