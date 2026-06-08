"use client";

import Link from "next/link";

const MOCK_RECORDS = [
  {
    id: "1",
    doctor: "Dr. Julian Vance",
    date: "2026-03-15",
    status: "BC Verified" as const,
    chiefComplaint: "Patient presents with acute pain in the lower right quadrant, specifically localized to tooth #30. Pain is exacerbated by thermal stimuli and mastication. Upon examination, a large carious lesion was detected extending into the pulp chamber. Radiographic analysis confirms the need for endodontic intervention.",
    doctorName: "Dr. Julian Vance, DDS",
    timestamp: "2026-03-15 10:30 AM",
  },
  {
    id: "2",
    doctor: "Dr. Sarah Chen",
    date: "2026-02-28",
    status: "Finalized" as const,
    chiefComplaint: "Routine follow-up examination. Patient reports no new concerns. Oral hygiene has improved significantly since last visit. Gingival tissues appear healthy with no bleeding on probing. All previous restorations are intact and functioning well.",
    doctorName: "Dr. Sarah Chen, DDS",
    timestamp: "2026-02-28 2:15 PM",
  },
  {
    id: "3",
    doctor: "Dr. Julian Vance",
    date: "2026-01-10",
    status: "Draft" as const,
    chiefComplaint: "Initial consultation for orthodontic evaluation. Patient expresses concern about crowding in the anterior mandibular region. Preliminary assessment indicates moderate crowding requiring further diagnostic records...",
    doctorName: "Dr. Julian Vance, DDS",
    timestamp: "2026-01-10 9:00 AM",
  },
];

const statusConfig = {
  "BC Verified": {
    bg: "bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)] text-[#45F0CF] shadow-[0px_0px_12px_rgba(69,240,207,0.3)]",
    dot: "bg-[#45F0CF] shadow-[0px_0px_15px_rgba(69,240,207,0.6)]",
    icon: <svg className="w-[11.67px] h-[5.83px]" viewBox="0 0 12 6" fill="currentColor"><path d="M10.59.59L4 7.17 1.41 4.59 0 6l4 4 8-8z"/></svg>
  },
  Finalized: {
    bg: "bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.5)] text-[#92CDFD]",
    dot: "bg-[#92CDFD] shadow-[0px_0px_10px_rgba(146,205,253,0.4)]",
    icon: <svg className="w-[11.67px] h-[11.67px]" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 9L2 6l1.41-1.41L5 7.17l5.59-5.59L12 3 5 9z"/></svg>
  },
  Draft: {
    bg: "bg-[#1D2023] border-[rgba(139,145,153,0.5)] text-[#8B9199]",
    dot: "bg-[#8B9199]",
    icon: <svg className="w-[11.08px] h-[11.67px]" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>
  },
};

export function RecordsContent() {
  return (
    <div className="flex flex-col gap-10 max-w-[864px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Medical Records</h1>
          <p className="text-base text-[#C1C7CF]">View and verify blockchain-secured medical records.</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-[96px]">
        <div className="absolute left-[32px] top-4 bottom-0 w-px bg-gradient-to-b from-[rgba(146,205,253,0.5)] via-[rgba(69,240,207,0.3)] to-transparent" />

        {MOCK_RECORDS.map((record) => {
          const cfg = statusConfig[record.status];
          return (
            <Link
              key={record.id}
              href={`/records/${record.id}`}
              className="relative block mb-12 last:mb-0 group"
            >
              <div className={`absolute w-5 h-5 rounded-full left-[-74px] top-6 border-2 border-[#111416] ${cfg.dot}`} />

              <div className="p-8 rounded-[20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] backdrop-blur-[10px] group-hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{record.doctor}</span>
                    <span className="px-3 py-1 rounded-[6px] text-sm bg-[#272A2D] border border-[rgba(255,255,255,0.05)] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{record.date}</span>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-[1.1px] ${cfg.bg}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {cfg.icon}
                    {record.status}
                  </span>
                </div>

                {/* Chief Complaint */}
                <div className="mb-4">
                  <div className="text-[12px] font-medium uppercase tracking-[1.2px] text-[#8B9199] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CHIEF COMPLAINT</div>
                  <div className="pl-4 border-l-2 border-[rgba(255,255,255,0.1)]">
                    <p className={`text-lg leading-[29px] ${record.status === "Draft" ? "italic text-[#8B9199]" : "text-[#E1E2E6]"}`} style={{ fontFamily: "'Public Sans', sans-serif" }}>
                      {record.chiefComplaint}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-8 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#8B9199]" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0z"/></svg>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#8B9199]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DOCTOR</div>
                      <div className="text-sm font-medium text-[#E1E2E6]">{record.doctorName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-[18px] text-[#8B9199]" viewBox="0 0 20 18" fill="currentColor"><path d="M10 0C4.48 0 0 4.48 0 10c0 2.21.9 4.21 2.34 5.66L1 18l3.68-1.19C6.06 17.26 8 18 10 18c5.52 0 10-4.48 10-10S15.52 0 10 0z"/></svg>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[1px] text-[#8B9199]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>TIMESTAMP</div>
                      <div className="text-sm font-medium text-[#E1E2E6]">{record.timestamp}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}