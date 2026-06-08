"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks";

interface PatientInfoFormProps {
    language: string;
    setLanguage: (v: string) => void;
    complaint: string;
    setComplaint: (v: string) => void;
    notes: string;
    setNotes: (v: string) => void;
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#E1E2E6", fontSize: "14px", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
    fontSize: "13px", fontWeight: 500, color: "#C1C7CF", marginBottom: "8px",
    display: "block", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
};

const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px", backdropFilter: "blur(10px)",
};

export function PatientInfoForm({ language, setLanguage, complaint, setComplaint, notes, setNotes }: PatientInfoFormProps) {
    const { t } = useTranslation();

    return (
        <div style={{ ...glassCard, padding: "24px" }}>
            <div className="flex flex-col gap-5">
                {/* Language */}
                <div>
                    <label style={labelStyle}>{t("booking.step3.preferredLanguage", "Preferred Language")}</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                            ...inputStyle,
                            cursor: "pointer", appearance: "none",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B9199' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px",
                        }}
                    >
                        <option value="English">English</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="French">French</option>
                    </select>
                </div>

                {/* Chief Complaint */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label style={{ ...labelStyle, marginBottom: 0 }}>
                            {t("booking.step3.chiefComplaint", "Chief Complaint")} <span style={{ color: "#FFB4AB" }}>*</span>
                        </label>
                        <span style={{ fontSize: "11px", color: "#8B9199" }}>{complaint.length} / 500</span>
                    </div>
                    <textarea
                        value={complaint}
                        onChange={(e) => setComplaint(e.target.value.slice(0, 500))}
                        rows={4}
                        placeholder="Describe your main concern or reason for this visit..."
                        style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                    />
                </div>

                {/* Doctor notes */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label style={{ ...labelStyle, marginBottom: 0 }}>
                            {t("booking.step3.doctorNotes", "Doctor's Notes")}
                            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#8B9199", fontWeight: 400 }}>(optional)</span>
                        </label>
                        <button
                            className="flex items-center gap-1"
                            style={{
                                padding: "4px 10px", borderRadius: "8px",
                                background: "rgba(146,205,253,0.08)", border: "1px solid rgba(146,205,253,0.2)",
                                color: "#92CDFD", fontSize: "11px", cursor: "pointer",
                            }}
                        >
                            <Sparkles size={11} />
                            {t("booking.step3.aiAssist", "AI Assist")}
                        </button>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Additional notes for the doctor..."
                        style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                    />
                </div>
            </div>
        </div>
    );
}
