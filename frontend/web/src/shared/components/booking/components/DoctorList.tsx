"use client";

import { Search } from "lucide-react";
import { useTranslation } from "@/hooks";
import { DOCTORS } from "../bookingConstants";

interface DoctorListProps {
    selectedDoctor: number | null;
    onSelect: (id: number) => void;
}

export function DoctorList({ selectedDoctor, onSelect }: DoctorListProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-2 mt-3">
            {DOCTORS.map((doc) => (
                <button
                    key={doc.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(doc.id);
                    }}
                    className="flex items-center gap-3 transition-all"
                    style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: selectedDoctor === doc.id ? "rgba(146,205,253,0.08)" : "rgba(29,32,35,0.5)",
                        border: `1px solid ${selectedDoctor === doc.id ? "rgba(146,205,253,0.4)" : "rgba(255,255,255,0.06)"}`,
                        cursor: "pointer",
                        textAlign: "left",
                    }}
                >
                    <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(91,150,196,0.25)",
                            fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#92CDFD",
                        }}
                    >
                        {doc.initials}
                    </div>
                    <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#E1E2E6" }}>
                            {doc.name}
                        </p>
                        <p
                            style={{
                                fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                                fontSize: "10px",
                                fontWeight: 500,
                                color: "#45F0CF",
                                letterSpacing: "0.06em",
                            }}
                        >
                            {doc.specialty}
                        </p>
                    </div>
                </button>
            ))}
            <button
                className="flex items-center gap-3"
                style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(29,32,35,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                }}
            >
                <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#1D2023",
                        border: "1px dashed #41474E",
                    }}
                >
                    <Search size={14} style={{ color: "#8B9199" }} />
                </div>
                <span style={{ fontSize: "13px", color: "#8B9199" }}>
                    {t("booking.step1.browseDirectory", "Browse Directory")}
                </span>
            </button>
        </div>
    );
}
