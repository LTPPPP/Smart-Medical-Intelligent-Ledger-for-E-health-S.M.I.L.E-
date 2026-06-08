"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { colors, fonts, radii } from "@/styles/tokens";
import { useBookingStore, type BookingStep } from "@/stores/useBookingStore";
import { useTranslation } from "@/hooks";

export type StepStatus = "completed" | "active" | "pending";

export interface Step {
    id: number;
    label: string;
    status: StepStatus;
}

interface BookingStepperProps {
    steps?: Step[];
    variant?: "default" | "compact";
}

function deriveSteps(currentStep: BookingStep, labels: string[]): Step[] {
    return labels.map((label, i) => ({
        id: i + 1,
        label,
        status: (i + 1 < currentStep ? "completed" : i + 1 === currentStep ? "active" : "pending") as StepStatus,
    }));
}

export function BookingStepper({ steps: propSteps, variant = "default" }: BookingStepperProps) {
    const currentStep = useBookingStore((s) => s.step);
    const { t } = useTranslation();

    const steps = useMemo(() => {
        if (propSteps) return propSteps;
        return deriveSteps(currentStep, [
            t("booking.steps.selectPath", "Select Path"),
            t("booking.steps.dateTime", "Date & Time"),
            t("booking.steps.patientInfo", "Patient Info"),
            t("booking.steps.confirm", "Confirm"),
        ]);
    }, [propSteps, currentStep, t]);

    const activeIdx = steps.findIndex((s) => s.status === "active");
    const progressPct = activeIdx >= 0 ? (activeIdx / (steps.length - 1)) * 100 : 0;

    return (
        <div
            className="relative flex items-center justify-between w-full"
            style={{
                background: colors.glassBg,
                border: `1px solid ${colors.glassBorder}`,
                borderRadius: variant === "compact" ? radii["2xl"] : radii["3xl"],
                padding: variant === "compact" ? "12px 24px" : "16px 32px",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* Track */}
            <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                    height: "2px",
                    background: colors.progressTrack,
                    width: "calc(100% - 80px)",
                    left: "40px",
                    zIndex: 0,
                }}
            />
            {/* Animated fill */}
            <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                    height: "2px",
                    background: `linear-gradient(90deg, ${colors.success}, ${colors.primary})`,
                    left: "40px",
                    zIndex: 1,
                }}
                initial={false}
                animate={{ width: `calc((100% - 80px) * ${progressPct / 100})` }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
            />

            {steps.map((step, idx) => {
                const isCompleted = step.status === "completed";
                const isActive = step.status === "active";
                const isPending = step.status === "pending" && idx > activeIdx;

                return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                        <motion.div
                            className="flex items-center justify-center"
                            initial={false}
                            animate={{
                                scale: isActive ? 1.05 : 1,
                                boxShadow: isCompleted
                                    ? `0 0 12px ${colors.successGlow}`
                                    : isActive
                                        ? `0 0 12px ${colors.primaryGlow}`
                                        : "0 0 0 transparent",
                            }}
                            transition={{ duration: 0.25 }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: isCompleted
                                    ? colors.successMuted
                                    : isActive
                                        ? colors.primary
                                        : colors.surface,
                                border: isCompleted
                                    ? `2px solid ${colors.success}`
                                    : isActive
                                        ? `2px solid ${colors.primary}`
                                        : `2px solid ${colors.textDisabled}`,
                                opacity: isPending ? 0.5 : 1,
                            }}
                        >
                            {isCompleted ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Check size={16} style={{ color: colors.success }} strokeWidth={2.5} />
                                </motion.div>
                            ) : (
                                <span
                                    style={{
                                        fontFamily: fonts.label,
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: isActive ? colors.primaryDark : colors.textTertiary,
                                    }}
                                >
                                    {step.id}
                                </span>
                            )}
                        </motion.div>
                        <span
                            style={{
                                fontFamily: fonts.label,
                                fontSize: variant === "compact" ? "11px" : "12px",
                                fontWeight: isActive ? 700 : 500,
                                color: isCompleted ? colors.success : isActive ? "#CBE6FF" : colors.textTertiary,
                                whiteSpace: "nowrap",
                                letterSpacing: "0.02em",
                                opacity: isPending ? 0.5 : 1,
                            }}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
