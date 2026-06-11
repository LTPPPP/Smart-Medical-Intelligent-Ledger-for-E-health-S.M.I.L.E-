"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/shared/hooks";
import { colors, fonts, radii, shadows, btnSuccess, btnGhost } from "@/styles/tokens";
import { AmbientOrb, InfoRow } from "@/shared/components/ui/GlassUI";

export function PaymentSuccess() {
    const { t } = useTranslation();

    const details = [
        { label: t("payments.success.transactionId", "Transaction ID"), value: "TXN-20240615-0042" },
        { label: t("payments.success.dateTime", "Date & Time"), value: "Jun 15, 2025 · 10:23 AM" },
        { label: t("payments.success.doctorLabel", "Doctor"), value: "Dr. Sarah Chen" },
        { label: t("payments.success.serviceLabel", "Service"), value: "Orthodontics Consultation" },
    ];

    return (
        <div
            className="min-h-screen -m-4 md:-m-6 flex items-center justify-center p-6"
            style={{
                background: colors.bg,
                backgroundImage:
                    "radial-gradient(ellipse at 20% 30%, rgba(91,150,196,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(69,240,207,0.04) 0%, transparent 50%)",
            }}
        >
            <AmbientOrb color="rgba(146,205,253,0.04)" width={300} top="15%" left="10%" />
            <AmbientOrb color="rgba(69,240,207,0.04)" width={250} bottom="20%" right="10%" />

            {/* Success card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    width: "100%",
                    maxWidth: 512,
                    background: "rgba(17,20,22,0.7)",
                    border: `1px solid ${colors.successBorder}`,
                    borderRadius: radii["4xl"],
                    backdropFilter: "blur(20px)",
                    boxShadow: shadows.elevated,
                    padding: "40px 36px",
                    textAlign: "center",
                    position: "relative",
                }}
            >
                {/* Checkmark icon */}
                <motion.div
                    className="flex items-center justify-center mx-auto mb-6"
                    style={{ position: "relative", width: 80, height: 80 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: colors.successMuted,
                            filter: "blur(10px)",
                        }}
                    />
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: colors.successMuted,
                            border: `2px solid ${colors.success}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        <Icon icon="lucide:check-circle-2" width={32} style={{ color: colors.success }} />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontFamily: fonts.heading,
                        fontSize: "26px",
                        fontWeight: 700,
                        color: colors.textPrimary,
                        marginBottom: "8px",
                        letterSpacing: "-0.5px",
                    }}
                >
                    {t("payments.success.title", "Payment Successful!")}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ fontSize: "14px", color: colors.textTertiary, marginBottom: "28px" }}
                >
                    {t("payments.success.subtitle", "Your appointment has been confirmed and payment received")}
                </motion.p>

                {/* Amount */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
                    style={{
                        fontSize: "48px",
                        fontFamily: fonts.heading,
                        fontWeight: 700,
                        color: colors.success,
                        letterSpacing: "-2.4px",
                        marginBottom: "24px",
                    }}
                >
                    350,000 ₫
                </motion.div>

                {/* Transaction details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    style={{
                        padding: "16px 20px",
                        borderRadius: radii.xl,
                        background: "rgba(25,28,31,0.4)",
                        border: `1px solid ${colors.glassDivider}`,
                        textAlign: "left",
                        marginBottom: "28px",
                    }}
                >
                    {details.map((item, i) => (
                        <InfoRow
                            key={item.label}
                            label={item.label}
                            value={item.value}
                            showBorder={i < details.length - 1}
                        />
                    ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="flex flex-col gap-3"
                >
                    <Link
                        href="/appointments"
                        className="flex items-center justify-center gap-2"
                        style={{ ...btnSuccess(true), textDecoration: "none" }}
                    >
                        <Icon icon="lucide:calendar-days" width={16} />
                        {t("payments.success.viewBookings", "View My Bookings")}
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2"
                        style={{ ...btnGhost, textDecoration: "none" }}
                    >
                        <Icon icon="lucide:layout-dashboard" width={16} />
                        {t("payments.success.backToDashboard", "Back to Dashboard")}
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
