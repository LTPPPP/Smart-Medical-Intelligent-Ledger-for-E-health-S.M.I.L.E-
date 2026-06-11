"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslation } from "@/shared/hooks";
import { useBookingStore, type PathType } from "@/features/appointment/stores/useBookingStore";
import { colors, fonts, glassCard, btnPrimary, radii } from "@/styles/tokens";
import { GlassCard, SectionHeading } from "@/shared/components/ui/GlassUI";
import { BookingStepper } from "./BookingStepper";
import { DOCTORS } from "./bookingConstants";
import { AfterHoursToggle } from "./components/AfterHoursToggle";
import { DoctorList } from "./components/DoctorList";
import { SpecialtyPills } from "./components/SpecialtyPills";

export function BookingStep1() {
    const {
        selectedPath, setPath,
        afterHours, setAfterHours,
        selectedSpecialty, setSpecialty,
        selectedDoctorId, setDoctorId,
        goNext, canProceedStep1,
    } = useBookingStore();
    const { t } = useTranslation();

    const canProceed = canProceedStep1();

    const PATH_CONFIGS: { id: PathType; icon: React.ReactNode; title: string; desc: string }[] = [
        { id: "facility", icon: <Icon icon="lucide:building-2" width={24} style={{ color: colors.primary }} />, title: t("booking.step1.byFacility", "By Facility"), desc: t("booking.step1.byFacilityDesc", "Choose a clinic or hospital location near you") },
        { id: "specialty", icon: <Icon icon="lucide:stethoscope" width={24} style={{ color: colors.primary }} />, title: t("booking.step1.bySpecialty", "By Specialty"), desc: t("booking.step1.bySpecialtyDesc", "Find the right specialist for your needs") },
        { id: "doctor", icon: <Icon icon="lucide:user-round" width={24} style={{ color: colors.primary }} />, title: t("booking.step1.byDoctor", "By Doctor"), desc: t("booking.step1.byDoctorDesc", "Search for a specific doctor you prefer") },
    ];

    const selectedDoc = DOCTORS.find((d) => d.id === selectedDoctorId);

    return (
        <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-4">
                <BookingStepper variant="compact" />

                <SectionHeading
                    title={t("booking.title", "Book an Appointment")}
                    subtitle={t("booking.subtitle", "Choose how you'd like to find your appointment")}
                />

                <div className="flex flex-col gap-3">
                    {PATH_CONFIGS.map((card, i) => {
                        const isSelected = selectedPath === card.id;
                        return (
                            <motion.button
                                key={card.id}
                                onClick={() => setPath(card.id)}
                                className="text-left w-full"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.25 }}
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.995 }}
                                style={{
                                    ...glassCard,
                                    padding: "20px 24px",
                                    border: isSelected
                                        ? `1px solid ${colors.primaryBorder}`
                                        : `1px solid ${colors.glassBorder}`,
                                    background: isSelected
                                        ? "rgba(146,205,253,0.04)"
                                        : colors.glassBg,
                                    cursor: "pointer",
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: radii.xl,
                                                background: colors.surfaceHover,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {card.icon}
                                        </div>
                                        <div>
                                            <p
                                                style={{
                                                    fontFamily: fonts.heading,
                                                    fontSize: "18px",
                                                    fontWeight: 600,
                                                    color: colors.textPrimary,
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {card.title}
                                            </p>
                                            <p style={{ fontSize: "13px", color: colors.textTertiary }}>
                                                {card.desc}
                                            </p>
                                        </div>
                                    </div>
                                    <Icon icon="lucide:chevron-right"
                                        width={20}
                                        style={{
                                            color: isSelected ? colors.primary : colors.textDisabled,
                                            flexShrink: 0,
                                        }}
                                    />
                                </div>
                                {card.id === "specialty" && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <SpecialtyPills
                                            selected={selectedSpecialty}
                                            onSelect={(s) => {
                                                setSpecialty(s);
                                                setPath("specialty");
                                            }}
                                        />
                                    </div>
                                )}
                                {card.id === "doctor" && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DoctorList
                                            selectedDoctor={selectedDoctorId}
                                            onSelect={(id) => {
                                                setDoctorId(id);
                                                setPath("doctor");
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <AfterHoursToggle
                    value={afterHours}
                    onChange={setAfterHours}
                    glassCard={glassCard}
                />
            </div>

            {/* Sidebar Summary */}
            <div style={{ width: 280, flexShrink: 0 }}>
                <GlassCard style={{ padding: "24px", position: "sticky", top: 24 }}>
                    <h3
                        style={{
                            fontFamily: fonts.heading,
                            fontSize: "16px",
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: "8px",
                        }}
                    >
                        {t("booking.step1.summaryTitle", "Booking Summary")}
                    </h3>
                    <p
                        style={{
                            fontSize: "13px",
                            color: colors.textTertiary,
                            marginBottom: "24px",
                        }}
                    >
                        {t("booking.step1.summaryEmpty", "No path selected yet")}
                    </p>
                    {selectedPath && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: "12px 16px",
                                borderRadius: radii.lg,
                                background: colors.primarySubtle,
                                border: `1px solid ${colors.successBorder}`,
                                marginBottom: "16px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: colors.textTertiary,
                                    marginBottom: "4px",
                                }}
                            >
                                {t("booking.step1.pathLabel", "Path")}
                            </p>
                            <p
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: colors.primary,
                                }}
                            >
                                {selectedPath === "facility"
                                    ? t("booking.step1.byFacility", "By Facility")
                                    : selectedPath === "specialty"
                                        ? `${t("booking.step1.bySpecialty", "By Specialty")}${selectedSpecialty ? ` · ${selectedSpecialty}` : ""}`
                                        : `${t("booking.step1.byDoctor", "By Doctor")}${selectedDoc ? ` · Dr. ${selectedDoc.name.split(" ")[1]}` : ""}`}
                            </p>
                        </motion.div>
                    )}
                    <button
                        onClick={goNext}
                        disabled={!canProceed}
                        className="w-full transition-all duration-200"
                        style={btnPrimary(canProceed)}
                    >
                        {t("booking.step1.bookAppointment", "Book Appointment")}
                    </button>
                </GlassCard>
            </div>
        </div>
    );
}
