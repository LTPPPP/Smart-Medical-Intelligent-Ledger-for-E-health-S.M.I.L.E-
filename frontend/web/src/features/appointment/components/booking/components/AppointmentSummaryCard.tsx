"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslation } from "@/shared/hooks";
import { useBookingStore } from "@/features/appointment/stores/useBookingStore";
import { colors, fonts, radii, glassCard } from "@/styles/tokens";
import { GlassCard, IconBox } from "@/shared/components/ui/GlassUI";

export function AppointmentSummaryCard() {
    const { t } = useTranslation();
    const doctor = useBookingStore((s) => s.getSelectedDoctor());
    const formattedDate = useBookingStore((s) => s.getFormattedDate());
    const selectedSpecialty = useBookingStore((s) => s.selectedSpecialty);
    const goToStep = useBookingStore((s) => s.goToStep);

    const specialty = doctor?.specialty ?? selectedSpecialty ?? "General";

    const SUMMARY_ITEMS = [
        {
            icon: <Icon icon="lucide:building-2" width={16} style={{ color: colors.primary }} />,
            label: t("booking.step4.facilityLabel", "Facility"),
            value: "S.M.I.L.E Dental Center, HCM",
            editStep: 1 as const,
        },
        {
            icon: <Icon icon="lucide:calendar" width={16} style={{ color: colors.primary }} />,
            label: t("booking.step4.scheduleLabel", "Schedule"),
            value: formattedDate || "Not selected",
            editStep: 2 as const,
        },
        {
            icon: <Icon icon="lucide:clock" width={16} style={{ color: colors.primary }} />,
            label: t("booking.step4.durationLabel", "Duration"),
            value: "45 minutes",
        },
        {
            icon: <Icon icon="lucide:user" width={16} style={{ color: colors.primary }} />,
            label: t("booking.step4.doctorLabel", "Doctor"),
            value: doctor ? `${doctor.name} · ${specialty}` : specialty,
            editStep: 1 as const,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Header card */}
            <GlassCard variant="success" style={{ padding: "28px", position: "relative", overflow: "hidden" }}>
                <div
                    style={{
                        position: "absolute",
                        top: -40,
                        right: -40,
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: colors.successSubtle,
                        filter: "blur(30px)",
                        pointerEvents: "none",
                    }}
                />
                <div className="flex items-center gap-4">
                    <IconBox
                        size={52}
                        radius={radii["2xl"]}
                        bg={colors.successMuted}
                        border={`1px solid ${colors.amberMuted}`}
                    >
                        <Icon icon="lucide:check-circle-2" width={24} style={{ color: colors.success }} />
                    </IconBox>
                    <div>
                        <h2 style={{ fontFamily: fonts.heading, fontSize: "22px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>
                            {t("booking.step4.reviewTitle", "Review Your Appointment")}
                        </h2>
                        <p style={{ fontSize: "14px", color: colors.textTertiary }}>
                            {t("booking.step4.reviewSubtitle", "Please confirm the details before proceeding with payment")}
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Summary list */}
            <GlassCard style={{ padding: "8px" }}>
                {SUMMARY_ITEMS.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.07, duration: 0.25 }}
                        className="flex items-center justify-between"
                        style={{
                            padding: "14px 16px",
                            borderRadius: radii.lg,
                            borderBottom: idx < SUMMARY_ITEMS.length - 1 ? `1px solid ${colors.glassDivider}` : "none",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: radii.md,
                                    background: colors.surfaceAlt,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {item.icon}
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: colors.textTertiary,
                                        fontFamily: fonts.label,
                                        letterSpacing: "0.04em",
                                        textTransform: "uppercase",
                                        marginBottom: "2px",
                                    }}
                                >
                                    {item.label}
                                </p>
                                <p style={{ fontSize: "14px", color: colors.textPrimary, fontWeight: 500 }}>
                                    {item.value}
                                </p>
                            </div>
                        </div>
                        {item.editStep && (
                            <button
                                onClick={() => goToStep(item.editStep!)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: radii.sm,
                                    background: "transparent",
                                    border: `1px solid ${colors.successBorder}`,
                                    color: colors.primary,
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Icon icon="lucide:pencil" width={10} />
                                {t("common.edit", "Edit")}
                            </button>
                        )}
                    </motion.div>
                ))}
            </GlassCard>
        </div>
    );
}
