"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/shared/hooks";
import { colors, fonts, radii, glassCard, btnPrimary, btnGhost, shadows } from "@/styles/tokens";
import { GlassCard, IconBox, SectionHeading } from "@/shared/components/ui/GlassUI";

type PaymentMethod = "vnpay" | "bank" | "cash" | "ewallet";

interface PaymentMethodOption {
    id: PaymentMethod;
    label: string;
    desc: string;
    badge?: string;
    icon: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
    { id: "vnpay", label: "VNPay", desc: "Pay via VNPay gateway", badge: "Recommended", icon: "VP" },
    { id: "bank", label: "Bank Transfer", desc: "Direct bank transfer", icon: "BT" },
    { id: "cash", label: "Cash", desc: "Pay at the clinic", icon: "₫" },
    { id: "ewallet", label: "E-Wallet", desc: "MoMo, ZaloPay, etc.", icon: "EW" },
];

const LINE_ITEMS = [
    { label: "Consultation Fee", value: "400,000 ₫" },
    { label: "Service Fee", value: "50,000 ₫" },
    { label: "Insurance Discount", value: "-100,000 ₫", isDiscount: true },
];

interface InitiatePaymentProps {
    onPay?: () => void;
    onCancel?: () => void;
}

export function InitiatePayment({ onPay, onCancel }: InitiatePaymentProps) {
    const [selected, setSelected] = useState<PaymentMethod>("vnpay");
    const { t } = useTranslation();

    const lineItemLabels: Record<string, string> = {
        "Consultation Fee": t("payments.initiate.consultationFee", "Consultation Fee"),
        "Service Fee": t("payments.initiate.serviceFee", "Service Fee"),
        "Insurance Discount": t("payments.initiate.insuranceDiscount", "Insurance Discount"),
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: "80vh" }}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    width: "100%",
                    maxWidth: 520,
                    ...glassCard,
                    borderRadius: radii["4xl"],
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div style={{ padding: "28px 28px 20px" }}>
                    <div className="flex items-center gap-4 mb-2">
                        <IconBox
                            width={52}
                            radius={radii["2xl"]}
                            bg="rgba(69,240,207,0.12)"
                            border={`1px solid rgba(69,240,207,0.25)`}
                        >
                            <Icon icon="lucide:wallet" width={22} style={{ color: colors.success }} />
                        </IconBox>
                        <div>
                            <h1
                                style={{
                                    fontFamily: fonts.heading,
                                    fontSize: "22px",
                                    fontWeight: 700,
                                    color: colors.textPrimary,
                                    letterSpacing: "-0.5px",
                                }}
                            >
                                {t("payments.initiate.title", "Pay Now")}
                            </h1>
                            <p style={{ fontSize: "13px", color: colors.textTertiary }}>
                                {t("payments.initiate.subtitle", "Select a payment method to continue")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Summary */}
                <div style={{ padding: "0 28px 20px" }}>
                    <div
                        style={{
                            padding: "16px",
                            borderRadius: radii.xl,
                            background: colors.glassBg,
                            border: `1px solid ${colors.glassDivider}`,
                        }}
                    >
                        <p
                            style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: colors.textTertiary,
                                fontFamily: fonts.label,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                marginBottom: "12px",
                            }}
                        >
                            {t("payments.initiate.summaryTitle", "Payment Summary")}
                        </p>
                        <div className="flex flex-col gap-2 mb-3">
                            {LINE_ITEMS.map((item) => (
                                <div key={item.label} className="flex justify-between">
                                    <span style={{ fontSize: "13px", color: colors.textTertiary }}>
                                        {lineItemLabels[item.label] ?? item.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            color: item.isDiscount ? colors.success : colors.textSecondary,
                                            fontWeight: 500,
                                            fontFamily: fonts.label,
                                        }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                paddingTop: "12px",
                                borderTop: `1px solid ${colors.glassDividerLight}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                                {t("payments.initiate.total", "Total")}
                            </span>
                            <span
                                style={{
                                    fontFamily: fonts.label,
                                    fontSize: "28px",
                                    fontWeight: 700,
                                    color: colors.primary,
                                    letterSpacing: "-0.75px",
                                }}
                            >
                                350,000 ₫
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment methods */}
                <div style={{ padding: "0 28px 20px" }}>
                    <p
                        style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: colors.textTertiary,
                            fontFamily: fonts.label,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            marginBottom: "12px",
                        }}
                    >
                        {t("payments.history.filterMethod", "Payment Method")}
                    </p>
                    <div className="flex flex-col gap-2">
                        {PAYMENT_METHODS.map((method, i) => {
                            const isSelected = selected === method.id;
                            return (
                                <motion.button
                                    key={method.id}
                                    onClick={() => setSelected(method.id)}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.2 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="flex items-center justify-between w-full text-left"
                                    style={{
                                        padding: "14px 16px",
                                        borderRadius: radii.xl,
                                        background: isSelected ? colors.successSubtle : "rgba(255,255,255,0.02)",
                                        border: `1.5px solid ${isSelected ? colors.success : colors.glassDividerLight}`,
                                        cursor: "pointer",
                                        transition: "border-color 0.15s, background 0.15s",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Radio */}
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                border: `2px solid ${isSelected ? colors.success : colors.textDisabled}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    style={{ width: 8, height: 8, borderRadius: "50%", background: colors.success }}
                                                />
                                            )}
                                        </div>
                                        {/* Icon */}
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: radii.md,
                                                background: isSelected ? "rgba(69,240,207,0.12)" : colors.surface,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                fontFamily: fonts.label,
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: isSelected ? colors.success : colors.textTertiary,
                                                letterSpacing: "0.02em",
                                            }}
                                        >
                                            {method.icon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "14px", fontWeight: 500, color: colors.textPrimary }}>
                                                {method.label}
                                            </p>
                                            <p style={{ fontSize: "12px", color: colors.textTertiary }}>{method.desc}</p>
                                        </div>
                                    </div>
                                    {method.badge && (
                                        <span
                                            style={{
                                                padding: "3px 8px",
                                                borderRadius: radii.xs,
                                                background: colors.successSubtle,
                                                border: `1px solid ${colors.successBorder}`,
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: colors.success,
                                                fontFamily: fonts.label,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {method.badge === "Recommended"
                                                ? t("payments.initiate.recommended", "Recommended")
                                                : method.badge}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* CTA */}
                <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                        onClick={onPay}
                        className="w-full flex items-center justify-center gap-2"
                        style={{
                            ...btnPrimary(true),
                            boxShadow: "0 0 18px rgba(146,205,253,0.3)",
                        }}
                    >
                        {t("payments.initiate.payNow", "Pay Now")}
                        <Icon icon="lucide:arrow-right" width={16} />
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: radii.pill,
                                background: "transparent",
                                border: `1px solid ${colors.glassInputBorder}`,
                                color: colors.textTertiary,
                                fontSize: "13px",
                                cursor: "pointer",
                            }}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
