"use client";

import { useState } from "react";
import { InfoBanner } from "@/components/doctor/info-banner";

const MOCK_NOTES = [
  {
    id: "1",
    author: "Dr. Marcus Thorne",
    role: "DDS, Lead Dentist",
    avatar: null,
    time: "Today at 10:23 AM",
    content: "Room 4 equipment needs recalibration before the afternoon block. The ultrasound unit display was flickering slightly during the last scan. I've logged a ticket with maintenance, but please use Room 2 for critical diagnostics in the meantime.",
    tag: "Maintenance",
    tagVariant: "amber" as const,
  },
  {
    id: "2",
    author: "Sarah Jenkins, RN",
    role: "Registered Nurse",
    avatar: null,
    time: "Today at 9:45 AM",
    content: "End of shift handoff: All post-op vitals stable. Restocked the crash cart in Sector B following the inventory protocol update. Note that we are running low on size 7 gloves in the main supply closet; expecting a delivery tomorrow morning.",
    tag: "Handoff",
    tagVariant: "blue" as const,
  },
  {
    id: "3",
    author: "Dr. Marcus Thorne",
    role: "DDS, Lead Dentist",
    avatar: null,
    time: "Yesterday at 4:15 PM",
    content: "Patient E.V. (PAT-00124) showed improved mobility in tooth #19 after the night guard adjustment. Scheduled follow-up in 2 weeks to reassess. The new digital scanner calibration protocol seems to be producing more accurate impressions.",
    tag: "Patient Update",
    tagVariant: "teal" as const,
  },
];

const tagColors: Record<string, string> = {
  amber: "bg-[rgba(187,135,56,0.2)] border-[rgba(247,188,104,0.2)] text-[#F7BC68]",
  blue: "bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.2)] text-[#92CDFD]",
  teal: "bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)] text-[#45F0CF]",
};

export function InternalNotesContent() {
  const [newNote, setNewNote] = useState("");

  return (
    <div className="flex flex-col gap-8 max-w-[896px]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-semibold tracking-[-0.32px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
          Internal Notes
        </h1>
        <p className="text-base text-[#C1C7CF]">
          Collaborative workspace for clinic staff observations and updates.
        </p>
      </div>

      <InfoBanner
        icon={<svg className="w-[16.67px] h-[16.67px] text-[#92CDFD]" viewBox="0 0 17 17" fill="currentColor"><path d="M8.5 0a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm0 2.5a6 6 0 110 12 6 6 0 010-12zm-.5 3v4h1V5.5H8zm0 5v1h1v-1H8z"/></svg>}
        title="Information"
        description="Notes are visible to all clinic staff and are not shared with patients. Please maintain professional communication standards."
      />

      <div className="flex flex-col p-6 rounded-[12px] bg-[rgba(25,28,31,0.6)] border border-[rgba(255,255,255,0.12)] shadow-[0px_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-[10px]">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#323538] border border-[rgba(255,255,255,0.2)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#C1C7CF]">DR</span>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Share an observation, update, or handoff note..."
              className="w-full min-h-[100px] p-3 rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-[#E1E2E6] text-base placeholder:text-[#C1C7CF] resize-none outline-none"
            />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-[8px] hover:bg-[rgba(255,255,255,0.05)]" title="Attach file">
                  <svg className="w-[10.42px] h-[16.67px] text-[#C1C7CF]" viewBox="0 0 11 17" fill="currentColor"><path d="M5.5 0a5.5 5.5 0 00-5.5 5.5v5a5.5 5.5 0 0011 0v-5A5.5 5.5 0 005.5 0zm0 2a3.5 3.5 0 013.5 3.5v5a3.5 3.5 0 01-7 0v-5A3.5 3.5 0 015.5 2z"/></svg>
                </button>
                <button className="p-2 rounded-[8px] hover:bg-[rgba(255,255,255,0.05)]" title="Add image">
                  <svg className="w-[15.83px] h-[13.33px] text-[#C1C7CF]" viewBox="0 0 16 14" fill="currentColor"><path d="M2 0C.895 0 0 .895 0 2v10c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2V2c0-1.105-.895-2-2-2H2zm0 2h12v6.586l-2.293-2.293a1 1 0 00-1.414 0L6 10.586 4.707 9.293a1 1 0 00-1.414 0L2 10.586V2zm2 1a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>
                </button>
              </div>
              <button
                onClick={() => { if (newNote.trim()) { setNewNote(""); } }}
                className="px-6 py-2 rounded-full bg-[#92CDFD] text-[#003450] text-sm font-medium shadow-[0px_0px_15px_rgba(146,205,253,0.3)] hover:bg-[#82bded] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-6 pt-8">
        <div className="absolute left-[36px] top-8 bottom-0 w-px bg-gradient-to-b from-[rgba(146,205,253,0.5)] via-[rgba(255,255,255,0.1)] to-transparent" />

        {MOCK_NOTES.map((note) => (
          <div key={note.id} className="flex gap-6 relative z-[1]">
            <div className="flex flex-col items-center w-12 shrink-0 pt-1">
              <div className="w-12 h-12 rounded-full bg-[#111416] border-2 border-[#1D2023] shadow-[0px_0px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                <span className="text-xs font-bold text-[#C1C7CF]">
                  {note.author.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </span>
              </div>
            </div>
            <div className="flex-1 p-5 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{note.author}</span>
                  <span className="text-sm text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{note.time}</span>
                </div>
              </div>
              <p className="text-sm text-[#E1E2E6] leading-[23px] mb-3">{note.content}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] font-semibold tracking-[1px] border ${tagColors[note.tagVariant]}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {note.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
