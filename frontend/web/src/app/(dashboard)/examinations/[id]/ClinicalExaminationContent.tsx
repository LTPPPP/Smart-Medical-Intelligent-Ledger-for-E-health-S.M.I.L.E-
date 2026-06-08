"use client";

import { useState } from "react";
import Link from "next/link";

const TEETH_UPPER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const TEETH_LOWER = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

// ─── Order Imaging Modal ───────────────────────────────────────────────────────
function OrderImagingModal({ onClose }: { onClose: () => void }) {
  const [imgType, setImgType] = useState("periapical");
  const [urgency, setUrgency] = useState("routine");
  const [indication, setIndication] = useState("");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(30);

  const IMAGING_TYPES = [
    { id: "periapical", label: "Periapical X-Ray", desc: "Single tooth detail" },
    { id: "panoramic", label: "Panoramic", desc: "Full mouth overview" },
    { id: "bitewing", label: "Bitewing", desc: "Interproximal caries" },
    { id: "cbct", label: "CBCT 3D", desc: "3D volumetric scan" },
  ];

  const URGENCY_LEVELS = [
    { id: "stat", label: "STAT", color: "#FFB4AB" },
    { id: "urgent", label: "Urgent", color: "#F7BC68" },
    { id: "routine", label: "Routine", color: "#92CDFD" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[540px] rounded-[20px] bg-[#1D2023] border border-[rgba(255,255,255,0.12)] p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Order Imaging Study</h2>
            <p className="text-xs text-[#8B9199] mt-0.5">Patient: Sarah Jenkins · Tooth #30</p>
          </div>
          <button onClick={onClose} className="text-[#8B9199] hover:text-[#E1E2E6] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5L5 15M5 5l10 10"/></svg>
          </button>
        </div>

        {/* Imaging Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Imaging Type</label>
          <div className="grid grid-cols-2 gap-2">
            {IMAGING_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setImgType(t.id)}
                className={`p-3 rounded-[12px] text-left transition-colors border ${
                  imgType === t.id
                    ? "bg-[rgba(146,205,253,0.1)] border-[#92CDFD]"
                    : "bg-[rgba(0,0,0,0.2)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)]"
                }`}
              >
                <div className={`text-sm font-semibold ${imgType === t.id ? "text-[#92CDFD]" : "text-[#E1E2E6]"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t.label}</div>
                <div className="text-[11px] text-[#8B9199] mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mini Tooth Chart */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Region / Tooth Selection</label>
          <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.2)] flex flex-col gap-2">
            <div className="flex justify-center gap-0.5">
              {TEETH_UPPER.map((t) => (
                <button key={t} onClick={() => setSelectedTooth(t)}
                  className={`w-5 h-7 rounded-[3px] text-[9px] flex items-center justify-center transition-colors ${selectedTooth === t ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD]" : "bg-[rgba(0,0,0,0.3)] border border-[#41474E] text-[#8B9199]"}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >{t}</button>
              ))}
            </div>
            <div className="flex justify-center gap-0.5">
              {TEETH_LOWER.map((t) => (
                <button key={t} onClick={() => setSelectedTooth(t)}
                  className={`w-5 h-7 rounded-[3px] text-[9px] flex items-center justify-center transition-colors ${selectedTooth === t ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD]" : "bg-[rgba(0,0,0,0.3)] border border-[#41474E] text-[#8B9199]"}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Urgency</label>
          <div className="flex gap-2">
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id)}
                className={`flex-1 py-2 rounded-[10px] text-[12px] font-semibold border transition-colors ${
                  urgency === u.id
                    ? `border-[${u.color}] text-[${u.color}] bg-[rgba(255,255,255,0.05)]`
                    : "border-[rgba(255,255,255,0.08)] text-[#8B9199] hover:text-[#C1C7CF]"
                }`}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: urgency === u.id ? u.color : undefined,
                  borderColor: urgency === u.id ? u.color : undefined,
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Indication */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Clinical Indication</label>
          <textarea
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="Describe clinical findings warranting this study..."
            className="w-full h-[80px] p-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.4)] resize-none outline-none focus:border-[rgba(146,205,253,0.4)]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cancel</button>
          <button className="px-5 py-2.5 rounded-full bg-[#92CDFD] text-[#003450] text-sm font-semibold shadow-[0px_0px_12px_rgba(146,205,253,0.2)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Study</button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Lab Test Modal ──────────────────────────────────────────────────────
function OrderLabModal({ onClose }: { onClose: () => void }) {
  const [testType, setTestType] = useState("");
  const [testName, setTestName] = useState("");
  const [sample, setSample] = useState("blood");
  const [urgency, setUrgency] = useState("routine");
  const [indication, setIndication] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] rounded-[20px] bg-[#1D2023] border border-[rgba(255,255,255,0.12)] p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Order Lab Test</h2>
            <p className="text-xs text-[#8B9199] mt-0.5">Patient: Sarah Jenkins</p>
          </div>
          <button onClick={onClose} className="text-[#8B9199] hover:text-[#E1E2E6] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5L5 15M5 5l10 10"/></svg>
          </button>
        </div>

        {/* Test Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Test Type</label>
          <select value={testType} onChange={(e) => setTestType(e.target.value)}
            className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] outline-none appearance-none cursor-pointer focus:border-[rgba(146,205,253,0.4)]"
          >
            <option value="">Select category...</option>
            <option value="hematology">Hematology</option>
            <option value="biochemistry">Biochemistry</option>
            <option value="microbiology">Microbiology</option>
            <option value="coagulation">Coagulation</option>
          </select>
        </div>

        {/* Test Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Test Name</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Search or enter test name..."
            className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.4)] outline-none focus:border-[rgba(146,205,253,0.4)]"
          />
        </div>

        {/* Sample Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sample Type</label>
          <div className="flex gap-2 flex-wrap">
            {["blood", "urine", "swab", "saliva", "tissue"].map((s) => (
              <button key={s} onClick={() => setSample(s)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold capitalize transition-colors border ${
                  sample === s
                    ? "bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.4)] text-[#45F0CF]"
                    : "bg-[rgba(0,0,0,0.2)] border-[rgba(255,255,255,0.08)] text-[#8B9199] hover:text-[#C1C7CF]"
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Urgency</label>
          <div className="flex gap-2">
            {[
              { id: "stat", label: "STAT", color: "#FFB4AB" },
              { id: "urgent", label: "Urgent", color: "#F7BC68" },
              { id: "routine", label: "Routine", color: "#92CDFD" },
            ].map((u) => (
              <button key={u.id} onClick={() => setUrgency(u.id)}
                className="flex-1 py-2 rounded-[10px] text-[12px] font-semibold border transition-colors"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: urgency === u.id ? u.color : "#8B9199",
                  borderColor: urgency === u.id ? u.color : "rgba(255,255,255,0.08)",
                  background: urgency === u.id ? "rgba(255,255,255,0.04)" : undefined,
                }}
              >{u.label}</button>
            ))}
          </div>
        </div>

        {/* Clinical Indication */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Clinical Indication</label>
          <textarea value={indication} onChange={(e) => setIndication(e.target.value)}
            placeholder="Reason for ordering this test..."
            className="w-full h-[72px] p-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.4)] resize-none outline-none focus:border-[rgba(146,205,253,0.4)]"
          />
        </div>

        {/* Preparation instructions */}
        <div className="p-3 rounded-[10px] bg-[rgba(247,188,104,0.06)] border border-[rgba(247,188,104,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#F7BC68] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Preparation Instructions</div>
          <p className="text-[12px] text-[#C1C7CF] leading-5">Fasting for 8 hours required for most biochemistry panels. Patient should be informed before leaving.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cancel</button>
          <button className="px-5 py-2.5 rounded-full bg-[#45F0CF] text-[#00382E] text-sm font-semibold shadow-[0px_0px_12px_rgba(69,240,207,0.2)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Test</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Clinical Examination Content ────────────────────────────────────────
export function ClinicalExaminationContent({ id }: { id: string }) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(30);
  const [showImaging, setShowImaging] = useState(false);
  const [showLab, setShowLab] = useState(false);

  const VITAL_SIGNS = [
    { label: "Blood Pressure", value: "122/78", unit: "mmHg", ok: true },
    { label: "Heart Rate", value: "74", unit: "bpm", ok: true },
    { label: "Temperature", value: "36.8", unit: "°C", ok: true },
    { label: "SpO₂", value: "98", unit: "%", ok: true },
  ];

  const SYMPTOMS = ["Severe pain", "Hot/cold sensitivity", "Jaw tenderness", "Swelling (mild)"];

  return (
    <>
      {showImaging && <OrderImagingModal onClose={() => setShowImaging(false)} />}
      {showLab && <OrderLabModal onClose={() => setShowLab(false)} />}

      <div className="flex flex-col gap-6 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/examinations" className="text-[12px] text-[#8B9199] hover:text-[#C1C7CF] transition-colors">Examinations</Link>
              <svg className="w-3 h-3 text-[#41474E]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4.5 2l4 4-4 4"/></svg>
              <span className="text-[12px] text-[#45F0CF]">{id}</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.7px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Clinical Examination</h1>
            <p className="text-sm text-[#8B9199] mt-1">Sarah Jenkins · Root Canal · Tooth #30</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(69,240,207,0.1)] border border-[rgba(69,240,207,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#45F0CF] shadow-[0px_0px_6px_rgba(69,240,207,0.8)]" />
            <span className="text-[12px] font-semibold text-[#45F0CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>In Session</span>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="grid grid-cols-4 gap-4">
          {VITAL_SIGNS.map((v) => (
            <div key={v.label} className="p-4 rounded-[14px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[10px]">
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#8B9199] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{v.label}</div>
              <div className="flex items-end gap-1">
                <span className="text-[22px] font-bold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>{v.value}</span>
                <span className="text-[12px] text-[#8B9199] mb-1">{v.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#45F0CF]" />
                <span className="text-[10px] text-[#45F0CF]">Normal</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-[1fr_360px] gap-6">
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            {/* Present Illness */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>History of Present Illness</h3>
              <p className="text-sm text-[#C1C7CF] leading-6">
                Patient presents with 3-day history of severe, constant throbbing pain in lower right first molar (#30). Pain rated 8/10. 
                Exacerbated by cold beverages and biting pressure. No fever or visible swelling externally. Patient reports prior endodontic 
                therapy on this tooth approximately 8 years ago.
              </p>
            </div>

            {/* Symptoms */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-[rgba(255,180,171,0.08)] border border-[rgba(255,180,171,0.2)] text-[#FFB4AB]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Physical Examination — Dental Diagram */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Physical Examination — Dental Chart</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[1px] text-center text-[rgba(193,199,207,0.5)] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MAXILLARY (UPPER)</div>
                  <div className="flex justify-center gap-1">
                    {TEETH_UPPER.map((t) => (
                      <button key={t} onClick={() => setSelectedTooth(t)}
                        className={`w-7 h-9 rounded-[4px] text-[10px] flex items-center justify-center transition-colors ${
                          selectedTooth === t
                            ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD] shadow-[0px_0px_8px_rgba(146,205,253,0.3)]"
                            : t === 30
                            ? "bg-[rgba(255,180,171,0.15)] border border-[rgba(255,180,171,0.4)] text-[#FFB4AB]"
                            : "bg-[rgba(0,0,0,0.2)] border border-[#41474E] text-[#C1C7CF]"
                        }`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-center gap-1">
                    {TEETH_LOWER.map((t) => (
                      <button key={t} onClick={() => setSelectedTooth(t)}
                        className={`w-7 h-9 rounded-[4px] text-[10px] flex items-center justify-center transition-colors ${
                          selectedTooth === t
                            ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD] shadow-[0px_0px_8px_rgba(146,205,253,0.3)]"
                            : t === 30
                            ? "bg-[rgba(255,180,171,0.15)] border border-[rgba(255,180,171,0.4)] text-[#FFB4AB]"
                            : "bg-[rgba(0,0,0,0.2)] border border-[#41474E] text-[#C1C7CF]"
                        }`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >{t}</button>
                    ))}
                  </div>
                  <div className="text-[10px] uppercase tracking-[1px] text-center text-[rgba(193,199,207,0.5)] mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MANDIBULAR (LOWER)</div>
                </div>
              </div>
              {selectedTooth && (
                <div className="mt-4 p-3 rounded-[10px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[12px] font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tooth #{selectedTooth}</div>
                  <p className="text-[12px] text-[#8B9199] mt-0.5">
                    {selectedTooth === 30 ? "Primary concern — failed endodontic treatment, periapical pathology suspected." : "No current findings."}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Diagnosis</h3>
              <div className="p-4 rounded-[12px] bg-[rgba(255,180,171,0.06)] border border-[rgba(255,180,171,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-[#FFB4AB]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Symptomatic Irreversible Pulpitis</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[rgba(255,180,171,0.1)] border border-[rgba(255,180,171,0.2)] text-[#FFB4AB]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ICD-10: K04.0</span>
                </div>
                <p className="text-[12px] text-[#C1C7CF] leading-5">
                  Failed root canal treatment with periapical involvement. Retreatment indicated. Refer to endodontist for re-treatment or extraction evaluation.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            {/* Quick Actions */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowImaging(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[rgba(146,205,253,0.06)] border border-[rgba(146,205,253,0.15)] hover:border-[rgba(146,205,253,0.3)] transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-[#92CDFD] shrink-0" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                  <div>
                    <div className="text-sm font-semibold text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Imaging</div>
                    <div className="text-[11px] text-[#8B9199]">X-Ray, CBCT, Panoramic</div>
                  </div>
                </button>
                <button
                  onClick={() => setShowLab(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[rgba(69,240,207,0.06)] border border-[rgba(69,240,207,0.15)] hover:border-[rgba(69,240,207,0.3)] transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-[#45F0CF] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M6 1v6L2 13h12l-4-6V1H6z"/><path d="M6 1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                  <div>
                    <div className="text-sm font-semibold text-[#45F0CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Lab Test</div>
                    <div className="text-[11px] text-[#8B9199]">Blood, culture, swab</div>
                  </div>
                </button>
                <Link
                  href="/examinations/new"
                  className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[rgba(247,188,104,0.06)] border border-[rgba(247,188,104,0.15)] hover:border-[rgba(247,188,104,0.3)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#F7BC68] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                  <div>
                    <div className="text-sm font-semibold text-[#F7BC68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>New Treatment Record</div>
                    <div className="text-[11px] text-[#8B9199]">Document procedure</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="rounded-[16px] bg-[rgba(29,32,35,0.5)] border border-[rgba(255,255,255,0.08)] p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#8B9199] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pending Orders</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Periapical X-Ray #30", type: "Imaging", status: "Pending" },
                  { label: "CBC Panel", type: "Lab", status: "In Progress" },
                ].map((order, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.2)]">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${order.status === "In Progress" ? "bg-[#45F0CF]" : "bg-[#F7BC68]"}`} />
                    <div className="flex-1">
                      <div className="text-[12px] font-medium text-[#E1E2E6]">{order.label}</div>
                      <div className="text-[10px] text-[#8B9199]">{order.type}</div>
                    </div>
                    <span className={`text-[10px] font-semibold ${order.status === "In Progress" ? "text-[#45F0CF]" : "text-[#F7BC68]"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Actions */}
            <div className="flex flex-col gap-2">
              <button className="w-full py-3 rounded-[12px] bg-[#45F0CF] text-[#00382E] text-sm font-semibold hover:bg-[#35d0b0] transition-colors shadow-[0px_0px_15px_rgba(69,240,207,0.2)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Complete Examination
              </button>
              <button className="w-full py-3 rounded-[12px] border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#E1E2E6] hover:bg-[rgba(255,255,255,0.04)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
