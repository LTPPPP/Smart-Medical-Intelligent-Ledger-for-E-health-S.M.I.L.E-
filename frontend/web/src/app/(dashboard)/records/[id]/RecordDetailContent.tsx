"use client";

const MOCK_RECORD = {
  id: "REC-001",
  chiefComplaint: "Patient reports sudden onset of sharp pain in the lower right quadrant, specifically localized to tooth #30. Pain is exacerbated by thermal stimuli (cold) and mastication. Reports a dull ache lingering for 10-15 minutes after stimulus removal. Denies swelling or systemic fever.",
  hpi: "Symptoms began approximately 4 days ago, initially mild but increasing in severity. Pain scale 7/10 at peak. Patient took ibuprofen 400mg PRN with moderate but temporary relief. No history of recent trauma to the area. Patient notes a previous large composite restoration on #30 placed approx 3 years ago. Last routine cleaning was 14 months ago.",
  exam: "Extraoral: No facial asymmetry, swelling, or palpable lymphadenopathy noted. Normal range of motion in TMJ. Intraoral: Soft tissues appear generally healthy, pink, and firm. Tooth #30: Large disto-occlusal composite restoration present, margins appear slightly compromised. Percussion testing: Positive (++) response. Palpation of apical area: Normal. Cold test (Endo Ice): Immediate severe pain lingering for >10 seconds. Mobility: Class I.",
  vitals: { bp: "120/80", hr: "72", temp: "98.6", spo2: "99", weight: "68.0", height: "165.1" },
  patient: { name: "Elena Rostova", initials: "ER", id: "PAT-00124", age: "40", allergies: "Penicillin" },
};

export function RecordDetailContent({ id: _id }: { id: string }) {
  const r = MOCK_RECORD;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      {/* Content */}
      <div className="flex gap-8">
        {/* Left: Record Data */}
        <div className="flex-1 p-8 rounded-[20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-[10px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#CBE6FF]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Medical Record</h2>
            <span className="px-3 py-1 rounded-full text-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(29,32,35,0.5)] text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{r.id}</span>
          </div>

          <div className="flex flex-col gap-6">
            {/* Chief Complaint */}
            <Section label="CHIEF COMPLAINT" content={r.chiefComplaint} />

            <div className="h-px bg-gradient-to-r from-[rgba(146,205,253,0)] via-[rgba(146,205,253,0.3)] to-transparent" />

            {/* HPI */}
            <Section label="HISTORY OF PRESENT ILLNESS (HPI)" content={r.hpi} />

            <div className="h-px bg-gradient-to-r from-[rgba(146,205,253,0)] via-[rgba(146,205,253,0.3)] to-transparent" />

            {/* Physical Exam */}
            <Section label="PHYSICAL EXAMINATION" content={r.exam} />
          </div>
        </div>

        {/* Right: Vitals & Patient Info */}
        <div className="w-[288px] shrink-0 flex flex-col gap-8">
          {/* Vitals Panel */}
          <div className="p-6 rounded-[20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-[10px]">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-[15px] h-3 text-[#92CDFD]" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 0L15 12H0z"/></svg>
              <span className="text-sm font-semibold uppercase tracking-[1.4px] text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Vital Signs</span>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <VitalField label="BLOOD PRESSURE" value={r.vitals.bp} unit="mmHg" />
              <VitalField label="HEART RATE" value={r.vitals.hr} unit="bpm" />
              <VitalField label="TEMPERATURE" value={r.vitals.temp} unit="°F" />
              <VitalField label="SPO2" value={r.vitals.spo2} unit="%" />
              <VitalField label="WEIGHT" value={r.vitals.weight} unit="kg" />
              <VitalField label="HEIGHT" value={r.vitals.height} unit="cm" />
            </div>
          </div>

          {/* Patient Mini Card */}
          <div className="flex flex-col items-center p-6 rounded-[20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-[10px]">
            <div className="w-20 h-20 rounded-full bg-[#323538] border-2 border-[rgba(146,205,253,0.3)] shadow-[0px_0px_15px_rgba(146,205,253,0.2)] flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-[#C1C7CF]">{r.patient.initials}</span>
            </div>
            <h4 className="text-lg font-semibold text-[#E1E2E6] text-center" style={{ fontFamily: "'Public Sans', sans-serif" }}>{r.patient.name}</h4>
            <span className="text-[12px] text-[#C1C7CF] mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{r.patient.id} • {r.patient.age} yrs</span>
            <div className="w-full mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[12px] uppercase text-[#8B9199]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Allergies</span>
                <span className="px-2 py-0.5 rounded-[4px] text-[12px] font-semibold text-[#FFB4AB] bg-[rgba(255,180,171,0.1)]">{r.patient.allergies}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] uppercase text-[#8B9199]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Age</span>
                <span className="text-sm text-[#E1E2E6]">{r.patient.age}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#92CDFD] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
      <div className="p-4 rounded-[12px] bg-[rgba(15,23,42,0.6)] border border-[rgba(255,255,255,0.1)] backdrop-blur-[2px]">
        <p className="text-sm text-[#E1E2E6] leading-5">{content}</p>
      </div>
    </div>
  );
}

function VitalField({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.5px] text-[#C1C7CF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
      <div className="relative">
        <input type="text" value={value} readOnly className="w-full h-[42px] px-3 pr-10 rounded-[8px] bg-[rgba(15,23,42,0.6)] border border-[#6B7280] text-sm text-[#E1E2E6] text-right outline-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8B9199]">{unit}</span>
      </div>
    </div>
  );
}
