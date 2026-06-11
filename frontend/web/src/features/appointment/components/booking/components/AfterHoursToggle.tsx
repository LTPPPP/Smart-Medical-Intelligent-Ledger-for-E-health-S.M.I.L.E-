"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";

interface AfterHoursToggleProps {
    value: boolean;
    onChange: (v: boolean) => void;
    glassCard: React.CSSProperties;
}

export function AfterHoursToggle({ value, onChange, glassCard }: AfterHoursToggleProps) {
    const { t } = useTranslation();

    return (
        <div
            style={{
                ...glassCard,
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <div className="flex items-center gap-3">
                <Icon icon="lucide:moon" width={18} style={{ color: "#F7BC68" }} />
                <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#E1E2E6" }}>
                        {t("booking.step1.afterHours", "After-hours Appointments")}
                    </p>
                    <p style={{ fontSize: "12px", color: "#8B9199" }}>
                        {t("booking.step1.afterHoursDesc", "Show availability outside regular clinic hours")}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onChange(!value)}
                className="flex-shrink-0"
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: "100px",
                    background: value ? "rgba(247,188,104,0.3)" : "#323538",
                    border: `1px solid ${value ? "#F7BC68" : "#41474E"}`,
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.2s",
                }}
            >
                <div
                    style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: value ? "#F7BC68" : "#8B9199",
                        position: "absolute",
                        top: "50%",
                        transform: `translateY(-50%) translateX(${value ? "22px" : "3px"})`,
                        transition: "all 0.2s",
                    }}
                />
            </button>
        </div>
    );
}
