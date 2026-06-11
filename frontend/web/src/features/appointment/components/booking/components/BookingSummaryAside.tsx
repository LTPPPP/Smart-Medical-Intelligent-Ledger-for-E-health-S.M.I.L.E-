"use client";

import { useTranslation } from "@/shared/hooks";
import { useBookingStore } from "@/features/appointment/stores/useBookingStore";
import { colors, fonts, radii, glassCard } from "@/styles/tokens";
import { GlassCard } from "@/shared/components/ui/GlassUI";

export function BookingSummaryAside() {
    const { t } = useTranslation();
    const doctor = useBookingStore((s) => s.getSelectedDoctor());
    const formattedDate = useBookingStore((s) => s.getFormattedDate());
    const selectedSpecialty = useBookingStore((s) => s.selectedSpecialty);

    const specialty = doctor?.specialty ?? selectedSpecialty ?? "General";

    return (
        <div style={{ width: 280, flexShrink: 0 }}>
            <GlassCard style={{ padding: "24px", position: "sticky", top: 24 }}>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "15px", fontWeight: 600, color: colors.textPrimary, marginBottom: "16px" }}>
                    {t("booking.step3.summaryTitle", "Appointment Summary")}
                </h3>

                <div className="flex flex-col gap-3 mb-4">
                    {/* Clinic */}
                    <div style={{ padding: "12px", borderRadius: radii.lg, background: colors.surfaceOverlay }}>
                        <p style={{ fontSize: "11px", color: colors.textTertiary, marginBottom: "4px" }}>{t("booking.step3.clinicLabel", "CLINIC")}</p>
                        <p style={{ fontSize: "13px", color: colors.textPrimary, fontWeight: 500 }}>S.M.I.L.E Dental Center</p>
                        <p style={{ fontSize: "12px", color: colors.textTertiary }}>Ho Chi Minh City</p>
                    </div>

                    {/* Doctor */}
                    {doctor && (
                        <div style={{ padding: "12px", borderRadius: radii.lg, background: colors.surfaceOverlay, display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(91,150,196,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: colors.primary, flexShrink: 0 }}>
                                {doctor.initials}
                            </div>
                            <div>
                                <p style={{ fontSize: "13px", color: colors.textPrimary, fontWeight: 500 }}>{doctor.name}</p>
                                <p style={{ fontSize: "10px", color: colors.success, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: fonts.label }}>
                                    {doctor.specialty}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    {formattedDate && (
                        <div style={{ padding: "12px", borderRadius: radii.lg, background: colors.surfaceOverlay }}>
                            <p style={{ fontSize: "11px", color: colors.textTertiary, marginBottom: "4px" }}>DATE &amp; TIME</p>
                            <p style={{ fontSize: "13px", color: colors.textPrimary, fontWeight: 500 }}>{formattedDate}</p>
                        </div>
                    )}

                    {/* Specialty badge */}
                    <div style={{ padding: "10px 12px", borderRadius: radii.md, background: colors.amberSubtle, border: `1px solid ${colors.amberMuted}`, display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: colors.amber, fontWeight: 500, fontFamily: fonts.label }}>
                            {specialty.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Cost estimate */}
                <div style={{ paddingTop: "16px", borderTop: `1px solid ${colors.glassDividerLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: colors.textTertiary }}>{t("booking.step3.estCost", "Est. Cost")}</span>
                    <span style={{ fontFamily: fonts.label, fontSize: "18px", fontWeight: 700, color: colors.success }}>
                        500,000 ₫
                    </span>
                </div>
            </GlassCard>
        </div>
    );
}
