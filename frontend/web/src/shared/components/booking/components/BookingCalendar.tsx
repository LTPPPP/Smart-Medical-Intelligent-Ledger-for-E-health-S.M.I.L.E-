"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

interface BookingCalendarProps {
    viewYear: number;
    viewMonth: number;
    selectedDay: number | null;
    today: Date;
    onSelectDay: (day: number) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export function BookingCalendar({
    viewYear,
    viewMonth,
    selectedDay,
    today,
    onSelectDay,
    onPrevMonth,
    onNextMonth,
}: BookingCalendarProps) {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);

    const glassCard: React.CSSProperties = {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
    };

    return (
        <div style={glassCard}>
            <div
                style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <button
                    onClick={onPrevMonth}
                    style={{
                        width: 32, height: 32, borderRadius: "8px", background: "#1D2023",
                        border: "1px solid rgba(255,255,255,0.1)", display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                >
                    <ChevronLeft size={14} style={{ color: "#C1C7CF" }} />
                </button>
                <h3
                    style={{
                        fontFamily: "var(--font-public-sans, 'Public Sans')",
                        fontSize: "16px", fontWeight: 600, color: "#E1E2E6",
                    }}
                >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <button
                    onClick={onNextMonth}
                    style={{
                        width: 32, height: 32, borderRadius: "8px", background: "#1D2023",
                        border: "1px solid rgba(255,255,255,0.1)", display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                >
                    <ChevronRight size={14} style={{ color: "#C1C7CF" }} />
                </button>
            </div>
            <div style={{ padding: "16px 20px 20px" }}>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {DAYS.map((d) => (
                        <div
                            key={d}
                            style={{
                                textAlign: "center", fontSize: "11px", fontWeight: 500,
                                color: "#8B9199", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                                padding: "4px 0", letterSpacing: "0.04em",
                            }}
                        >
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const isPast =
                            viewYear < today.getFullYear() ||
                            (viewYear === today.getFullYear() && viewMonth < today.getMonth()) ||
                            (viewYear === today.getFullYear() && viewMonth === today.getMonth() && day < today.getDate());
                        const isSelected = selectedDay === day;
                        const isToday =
                            viewYear === today.getFullYear() &&
                            viewMonth === today.getMonth() &&
                            day === today.getDate();

                        return (
                            <button
                                key={day}
                                onClick={() => !isPast && onSelectDay(day)}
                                disabled={isPast}
                                style={{
                                    width: "100%", aspectRatio: "1", borderRadius: "8px",
                                    background: isSelected ? "#92CDFD" : "rgba(255,255,255,0.03)",
                                    border: isToday && !isSelected ? "1px solid rgba(146,205,253,0.4)" : "1px solid transparent",
                                    color: isSelected ? "#003450" : isPast ? "#41474E" : "#E1E2E6",
                                    fontSize: "13px", fontWeight: isSelected ? 700 : 400,
                                    cursor: isPast ? "not-allowed" : "pointer",
                                    boxShadow: isSelected ? "0 0 8px rgba(146,205,253,0.4)" : "none",
                                    transition: "all 0.15s",
                                }}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
