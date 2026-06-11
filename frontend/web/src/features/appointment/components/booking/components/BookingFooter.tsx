"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";
import { MONTH_NAMES } from "./BookingCalendar";

interface BookingFooterProps {
    selectedDay: number | null;
    selectedTime: string | null;
    viewMonth: number;
    viewYear: number;
    onBack: () => void;
    onNext: () => void;
}

export function BookingFooter({
    selectedDay,
    selectedTime,
    viewMonth,
    viewYear,
    onBack,
    onNext,
}: BookingFooterProps) {
    const { t } = useTranslation();
    const canContinue = Boolean(selectedDay && selectedTime);

    return (
        <div
            style={{
                position: "sticky", bottom: 0,
                marginLeft: "-24px", marginRight: "-24px",
                padding: "16px 24px",
                background: "rgba(29,32,35,0.8)", backdropFilter: "blur(10px)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
        >
            <div className="flex items-center gap-3">
                <div
                    style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(91,150,196,0.25)", border: "2px solid #92CDFD",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", fontWeight: 600, color: "#92CDFD",
                    }}
                >
                    SC
                </div>
                <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#E1E2E6" }}>Dr. Sarah Chen</p>
                    <p style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", fontSize: "11px", color: "#45F0CF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        ORTHODONTICS
                    </p>
                </div>
                {selectedDay && selectedTime && (
                    <div style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(146,205,253,0.08)", border: "1px solid rgba(146,205,253,0.2)", marginLeft: "16px" }}>
                        <p style={{ fontSize: "13px", color: "#92CDFD" }}>
                            {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear} · {selectedTime}
                        </p>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    style={{
                        padding: "12px 24px", borderRadius: "100px",
                        background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                        color: "#C1C7CF", fontSize: "14px", fontWeight: 500, cursor: "pointer",
                    }}
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className="flex items-center gap-2"
                    style={{
                        padding: "12px 24px", borderRadius: "100px",
                        background: canContinue ? "#45F0CF" : "#323538",
                        color: canContinue ? "#003450" : "#41474E",
                        fontSize: "14px", fontWeight: 600,
                        cursor: canContinue ? "pointer" : "not-allowed",
                        border: "none",
                        fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                    }}
                >
                    {t("booking.step2.continueToPatientInfo", "Continue to Patient Info")}
                    <Icon icon="lucide:arrow-right" width={14} />
                </button>
            </div>
        </div>
    );
}
