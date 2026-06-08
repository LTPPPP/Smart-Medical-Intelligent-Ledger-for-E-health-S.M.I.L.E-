"use client";

import { Sun, Moon } from "lucide-react";
import { useTranslation } from "@/hooks";

const MORNING_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const AFTERNOON_SLOTS = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const AFTER_HOURS_SLOTS = ["17:00", "17:30", "18:00"];
const BOOKED_SLOTS = ["09:00", "14:30"];

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
}

export function TimeSlotPicker({ selectedTime, onSelectTime }: TimeSlotPickerProps) {
    const { t } = useTranslation();

    const renderSlot = (time: string, isAfterHours = false) => {
        const isBooked = BOOKED_SLOTS.includes(time);
        const isSelected = selectedTime === time;

        return (
            <button
                key={time}
                onClick={() => !isBooked && onSelectTime(time)}
                disabled={isBooked}
                style={{
                    padding: "8px 12px", borderRadius: "10px",
                    background: isBooked ? "rgba(255,255,255,0.02)" : isSelected ? "rgba(146,205,253,0.1)" : isAfterHours ? "rgba(247,188,104,0.05)" : "rgba(255,255,255,0.03)",
                    border: isBooked ? "1px solid rgba(65,71,78,0.5)" : isSelected ? "2px solid #92CDFD" : isAfterHours ? "1px solid rgba(247,188,104,0.5)" : "1px solid rgba(139,145,153,0.3)",
                    color: isBooked ? "#41474E" : isSelected ? "#92CDFD" : isAfterHours ? "#F7BC68" : "#E1E2E6",
                    fontSize: "13px", fontWeight: isSelected ? 600 : 400,
                    fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                    cursor: isBooked ? "not-allowed" : "pointer",
                    textDecoration: isBooked ? "line-through" : "none",
                    opacity: isBooked ? 0.5 : 1,
                    position: "relative", transition: "all 0.15s",
                }}
            >
                {time}
                {isSelected && (
                    <span
                        style={{
                            position: "absolute", top: -4, right: -4,
                            width: 10, height: 10, borderRadius: "50%",
                            background: "#45F0CF", border: "2px solid #111416",
                        }}
                    />
                )}
            </button>
        );
    };

    return (
        <div style={{ overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", backdropFilter: "blur(10px)" }}>
            <div style={{ height: "4px", background: "linear-gradient(90deg, #45F0CF, #92CDFD)", borderRadius: "20px 20px 0 0" }} />
            <div style={{ padding: "20px 24px" }}>
                <h3 style={{ fontFamily: "var(--font-public-sans, 'Public Sans')", fontSize: "16px", fontWeight: 600, color: "#E1E2E6", marginBottom: "20px" }}>
                    {t("booking.step2.availableTimes", "Available Times")}
                </h3>

                {/* Morning */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Sun size={14} style={{ color: "#8B9199" }} />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#8B9199", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {t("booking.step2.morning", "Morning")}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {MORNING_SLOTS.map((slot) => renderSlot(slot))}
                    </div>
                </div>

                {/* Afternoon */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Moon size={14} style={{ color: "#8B9199" }} />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#8B9199", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {t("booking.step2.afternoon", "Afternoon")}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {AFTERNOON_SLOTS.map((slot) => renderSlot(slot))}
                    </div>
                </div>

                {/* After-hours */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Moon size={14} style={{ color: "#F7BC68" }} />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#F7BC68", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {t("booking.step2.afterHours", "After Hours")}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {AFTER_HOURS_SLOTS.map((slot) => renderSlot(slot, true))}
                    </div>
                </div>
            </div>
        </div>
    );
}
