"use client";

import { useState } from "react";
import Link from "next/link";

const TEETH_UPPER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const TEETH_LOWER = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

export function TreatmentFormContent() {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(30);
  const [procedure, setProcedure] = useState("");
  const [findings, setFindings] = useState("");

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      {/* Context Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-[12.67px] h-[10.67px] text-[#92CDFD]" viewBox="0 0 13 11" fill="currentColor"><path d="M6.5 0L13 11H0z"/></svg>
            <span className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>S.M.I.L.E / Dental Records / New Treatment Record</span>
          </div>
          <h1 className="text-[30px] font-semibold tracking-[-0.75px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>New Treatment Record</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(69,240,207,0.1)] border border-[rgba(69,240,207,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#45F0CF]" />
          <span className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#45F0CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>In Treatment</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="flex gap-8">
        {/* LEFT: Tooth Chart */}
        <div className="w-[368px] shrink-0 p-6 rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Tooth Chart</h3>
            <button className="flex items-center gap-1 text-sm text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>
              Legend
            </button>
          </div>

          <div className="flex flex-col gap-8">
            {/* Maxillary */}
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-center text-[rgba(193,199,207,0.7)] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MAXILLARY (UPPER)</div>
              <div className="flex justify-center gap-1">
                {TEETH_UPPER.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTooth(t)}
                    className={`w-6 h-8 rounded-[4px] text-[10px] flex items-center justify-center transition-colors ${
                      selectedTooth === t
                        ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD] shadow-[0px_0px_10px_rgba(146,205,253,0.3)]"
                        : "bg-[rgba(0,0,0,0.2)] border border-[#41474E] text-[#C1C7CF]"
                    }`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandibular */}
            <div>
              <div className="flex justify-center gap-1">
                {TEETH_LOWER.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTooth(t)}
                    className={`w-6 h-8 rounded-[4px] text-[10px] flex items-center justify-center transition-colors ${
                      selectedTooth === t
                        ? "bg-[rgba(146,205,253,0.2)] border border-[#92CDFD] text-[#92CDFD] shadow-[0px_0px_10px_rgba(146,205,253,0.3)]"
                        : "bg-[rgba(0,0,0,0.2)] border border-[#41474E] text-[#C1C7CF]"
                    }`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-[1px] text-center text-[rgba(193,199,207,0.7)] mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MANDIBULAR (LOWER)</div>
            </div>
          </div>

          {/* Selected Tooth Info */}
          {selectedTooth && (
            <div className="mt-4 p-4 rounded-[12px] bg-[rgba(39,42,45,0.5)] border border-[rgba(65,71,78,0.3)]">
              <div className="flex gap-3">
                <svg className="w-[16.67px] h-[16.67px] text-[#92CDFD] mt-0.5" viewBox="0 0 17 17" fill="currentColor"><path d="M8.5 0a8.5 8.5 0 100 17 8.5 8.5 0 000-17z"/></svg>
                <div>
                  <div className="text-[12px] font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tooth #{selectedTooth}</div>
                  <p className="text-sm text-[#C1C7CF] leading-5 mt-1">
                    {selectedTooth >= 1 && selectedTooth <= 8 ? "Upper right quadrant" :
                     selectedTooth >= 9 && selectedTooth <= 16 ? "Upper left quadrant" :
                     selectedTooth >= 17 && selectedTooth <= 24 ? "Lower left quadrant" :
                     "Lower right quadrant"} — Click to select a procedure from the right panel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Clinical Data Form */}
        <div className="flex-1 p-8 rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]">
          <div className="flex items-center gap-3 pb-4 mb-8 border-b border-[rgba(255,255,255,0.1)]">
            <svg className="w-[19px] h-5 text-[#45F0CF]" viewBox="0 0 19 20" fill="currentColor"><path d="M9.5 0C4.25 0 0 4.25 0 9.5S4.25 19 9.5 19 19 14.75 19 9.5 14.75 0 9.5 0z"/></svg>
            <h3 className="text-xl font-semibold text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Clinical Data</h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Procedure */}
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PROCEDURE DESCRIPTION</div>
              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full h-[44px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] text-sm text-[#E1E2E6] appearance-none outline-none cursor-pointer"
              >
                <option value="" className="text-[#E1E2E6]">Select standard procedure...</option>
                <option value="D3330">D3330 — Root Canal (Molar)</option>
                <option value="D2740">D2740 — Crown (Porcelain/Ceramic)</option>
                <option value="D2980">D2980 — Crown Repair</option>
                <option value="D1110">D1110 — Prophylaxis (Adult)</option>
              </select>
            </div>

            {/* Findings */}
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DIAGNOSTIC FINDINGS & NOTES</div>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Enter detailed clinical notes, material specs, or complications..."
                className="w-full h-[104px] p-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] text-sm text-[#E1E2E6] placeholder:text-[rgba(193,199,207,0.5)] resize-none outline-none"
              />
            </div>

            {/* Cost & Date */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ESTIMATED COST</div>
                <div className="relative">
                  <input type="text" placeholder="0" className="w-full h-[44px] pl-4 pr-16 rounded-[12px] bg-[rgba(0,0,0,0.2)] text-sm text-[rgba(193,199,207,0.5)] outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>VND</span>
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#C1C7CF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NEXT APPOINTMENT</div>
                <div className="relative">
                  <input type="text" placeholder="mm / dd / yyyy  -- : -- : --" className="w-full h-[44px] pl-10 pr-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] text-sm text-[#E1E2E6] placeholder:text-[#E1E2E6] uppercase outline-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }} />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[13.5px] h-[15px] text-[#41474E]" viewBox="0 0 14 15" fill="currentColor"><path d="M4 0v2h6V0h2v2h2v12H0V2h2V0h2zM2 5h10v7H2V5z"/></svg>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent my-2" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Link href="/examinations" className="px-6 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold uppercase tracking-[1.4px] text-[#E1E2E6]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Cancel
              </Link>
              <button className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-[#45F0CF] text-[#00382E] text-sm font-semibold uppercase tracking-[1.4px] shadow-[0px_0px_15px_rgba(69,240,207,0.3)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <svg className="w-[13.5px] h-[13.5px]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z"/></svg>
                Save Treatment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}