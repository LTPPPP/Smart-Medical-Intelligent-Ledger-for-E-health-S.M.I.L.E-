"use client";

import { SPECIALTIES } from "../bookingConstants";

interface SpecialtyPillsProps {
    selected: string | null;
    onSelect: (s: string) => void;
}

export function SpecialtyPills({ selected, onSelect }: SpecialtyPillsProps) {
    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {SPECIALTIES.map((s) => (
                <button
                    key={s}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(s);
                    }}
                    className="transition-all"
                    style={{
                        padding: "5px 14px",
                        borderRadius: "100px",
                        background: selected === s ? "rgba(146,205,253,0.15)" : "#1D2023",
                        border: `1px solid ${selected === s ? "#92CDFD" : "rgba(255,255,255,0.1)"}`,
                        fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: selected === s ? "#92CDFD" : "#E1E2E6",
                        cursor: "pointer",
                    }}
                >
                    {s}
                </button>
            ))}
        </div>
    );
}
