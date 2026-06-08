"use client";

const MOCK_EXAMS = [
  { id: "1", patient: "Sarah Jenkins", date: "2026-03-15", type: "Root Canal", tooth: "#30", status: "Completed" as const, dentist: "Dr. Thorne" },
  { id: "2", patient: "Marcus Chen", date: "2026-03-14", type: "Crown Prep", tooth: "#19", status: "Completed" as const, dentist: "Dr. Chen" },
  { id: "3", patient: "Eleanor Vance", date: "2026-03-10", type: "Scaling", tooth: "Full", status: "Scheduled" as const, dentist: "Dr. Thorne" },
];

const statusStyles = {
  Completed: "text-[#45F0CF] bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)]",
  Scheduled: "text-[#92CDFD] bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.2)]",
  Cancelled: "text-[#8B9199] bg-[rgba(50,53,56,0.5)] border-[rgba(139,145,153,0.2)]",
};

export function ExaminationsContent() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.75px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Examinations</h1>
          <p className="text-base text-[#C1C7CF]">Clinical examinations and treatment records.</p>
        </div>
        <a href="/examinations/new" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#92CDFD] text-[#003450] text-base font-semibold shadow-[0px_0px_15px_rgba(146,205,253,0.2)] hover:bg-[#82bded] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <svg className="w-[18.33px] h-[13.33px]" viewBox="0 0 19 14" fill="currentColor"><path d="M9 0v6H3v2h6v6h2V8h6V6h-6V0H9z"/></svg>
          New Examination
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {MOCK_EXAMS.map((exam) => (
          <div key={exam.id} className="flex items-center px-6 py-4 rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]">
            <div className="w-10 h-10 rounded-full bg-[#323538] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mr-4">
              <span className="text-xs font-bold text-[#C1C7CF]">{exam.patient.split(" ").map(w => w[0]).join("")}</span>
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>{exam.patient}</div>
              <div className="text-[12px] text-[#C1C7CF]">{exam.type} — Tooth {exam.tooth}</div>
            </div>
            <span className="text-sm text-[#C1C7CF] mr-6">{exam.date}</span>
            <span className={`px-3 py-1 rounded-full text-[12px] font-medium border ${statusStyles[exam.status]}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{exam.status}</span>
            <span className="text-sm text-[#8B9199] ml-6">{exam.dentist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}