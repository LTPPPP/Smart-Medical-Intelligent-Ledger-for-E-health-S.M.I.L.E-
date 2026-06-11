"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";

type AppointmentType = "in-person" | "phone" | "video";

interface AppointmentTypeSelectorProps {
    value: AppointmentType;
    onChange: (type: AppointmentType) => void;
}

export function AppointmentTypeSelector({ value, onChange }: AppointmentTypeSelectorProps) {
    const { t } = useTranslation();

    const TYPES = [
        { id: "in-person" as AppointmentType, icon: <Icon icon="lucide:user" width={18} />, label: t("booking.step3.inPerson", "In-Person"), desc: t("booking.step3.inPersonDesc", "Visit the clinic") },
        { id: "phone" as AppointmentType, icon: <Icon icon="lucide:phone" width={18} />, label: t("booking.step3.phoneCall", "Phone Call"), desc: t("booking.step3.phoneCallDesc", "Remote consultation") },
        { id: "video" as AppointmentType, icon: <Icon icon="lucide:video" width={18} />, label: t("booking.step3.videoCall", "Video Call"), desc: t("booking.step3.videoCallDesc", "Online visit") },
    ];

    const glassCard: React.CSSProperties = {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
    };

    return (
        <div style={glassCard}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--font-public-sans, 'Public Sans')", fontSize: "16px", fontWeight: 600, color: "#E1E2E6" }}>
                    {t("booking.step3.appointmentType", "Appointment Type")}
                </p>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", gap: "12px" }}>
                {TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className="flex-1 flex flex-col items-center gap-2 transition-all"
                        style={{
                            padding: "16px 12px", borderRadius: "14px",
                            background: value === type.id ? "rgba(69,240,207,0.08)" : "rgba(255,255,255,0.02)",
                            border: `1.5px solid ${value === type.id ? "#45F0CF" : "rgba(255,255,255,0.1)"}`,
                            color: value === type.id ? "#45F0CF" : "#8B9199",
                            cursor: "pointer",
                        }}
                    >
                        <div style={{ color: value === type.id ? "#45F0CF" : "#8B9199" }}>{type.icon}</div>
                        <span style={{ fontSize: "13px", fontWeight: value === type.id ? 600 : 400, color: value === type.id ? "#45F0CF" : "#C1C7CF" }}>
                            {type.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8B9199" }}>{type.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
