"use client";

import { useState } from "react";
import { X, AlertCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks";
import { colors, fonts, radii, shadows, inputBase, labelBase, btnGhost, btnDestructive } from "@/styles/tokens";

interface RefundModalProps {
    onClose: () => void;
    transactionId?: string;
    amount?: string;
}

export function RefundModal({
    onClose,
    transactionId = "TXN-20240615-0042",
    amount = "350,000",
}: RefundModalProps) {
    const [refundAmount, setRefundAmount] = useState(amount);
    const [reason, setReason] = useState("");
    const { t } = useTranslation();

    const canSubmit = reason.trim().length > 0;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        width: "100%",
                        maxWidth: 448,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${colors.glassBorderHover}`,
                        borderRadius: radii["3xl"],
                        boxShadow: shadows.modal,
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "20px 24px",
                            borderBottom: `1px solid ${colors.glassDividerLight}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: radii.md,
                                    background: colors.errorSubtle,
                                    border: `1px solid ${colors.errorBorder}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ArrowLeft size={16} style={{ color: colors.error }} />
                            </div>
                            <h2
                                style={{
                                    fontFamily: fonts.heading,
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    color: colors.textPrimary,
                                }}
                            >
                                {t("payments.refund.title", "Refund Request")}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: radii.sm,
                                background: "rgba(255,255,255,0.05)",
                                border: `1px solid ${colors.glassInputBorder}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <X size={14} style={{ color: colors.textTertiary }} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "20px 24px" }} className="flex flex-col gap-4">
                        {/* Transaction context */}
                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: radii.lg,
                                background: colors.surfaceOverlay,
                                border: `1px solid ${colors.glassDivider}`,
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: colors.textTertiary,
                                            fontFamily: fonts.label,
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        {t("payments.refund.transactionLabel", "Transaction")}
                                    </p>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: colors.textPrimary }}>
                                        {transactionId}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p
                                        style={{
                                            fontFamily: fonts.label,
                                            fontSize: "18px",
                                            fontWeight: 700,
                                            color: colors.primary,
                                        }}
                                    >
                                        {refundAmount} ₫
                                    </p>
                                    <p style={{ fontSize: "11px", color: colors.textTertiary }}>
                                        {t("payments.refund.paidAmount", "Paid amount")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Eligibility banner */}
                        <div
                            style={{
                                padding: "10px 14px",
                                borderRadius: radii.md,
                                background: colors.successSubtle,
                                border: `1px solid ${colors.successBorder}`,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <AlertCircle size={14} style={{ color: colors.success, flexShrink: 0 }} />
                            <p style={{ fontSize: "12px", color: colors.success }}>
                                {t("payments.refund.eligible", "This transaction is eligible for a full refund within 24 hours.")}
                            </p>
                        </div>

                        {/* Refund amount */}
                        <div>
                            <label style={labelBase}>
                                {t("payments.refund.refundAmount", "Refund Amount")} (VND)
                            </label>
                            <input
                                type="text"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                style={inputBase}
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label style={labelBase}>
                                {t("payments.refund.reasonLabel", "Reason for Refund")}{" "}
                                <span style={{ color: colors.error }}>*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe why you are requesting a refund..."
                                style={{
                                    ...inputBase,
                                    resize: "vertical" as const,
                                    minHeight: "80px",
                                }}
                            />
                        </div>

                        {/* Refund method */}
                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: radii.lg,
                                background: colors.glassBg,
                                border: `1px solid ${colors.glassDividerLight}`,
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: radii.md,
                                    background: "rgba(91,150,196,0.2)",
                                    border: "1px solid rgba(91,150,196,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: colors.accentBlue,
                                        fontFamily: fonts.label,
                                    }}
                                >
                                    BANK
                                </span>
                            </div>
                            <div>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: colors.textPrimary }}>
                                    {t("payments.refund.refundMethod", "Original Payment Method")}
                                </p>
                                <p style={{ fontSize: "12px", color: colors.textTertiary }}>
                                    Refund to Visa ending in 4242
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: "16px 24px",
                            borderTop: `1px solid ${colors.glassDividerLight}`,
                            display: "flex",
                            gap: "12px",
                        }}
                    >
                        <button onClick={onClose} style={{ ...btnGhost, flex: 1, padding: "12px" }}>
                            {t("common.cancel", "Cancel")}
                        </button>
                        <button
                            disabled={!canSubmit}
                            style={{ ...btnDestructive(canSubmit), flex: 1 }}
                        >
                            {t("payments.refund.submitRefund", "Submit Refund")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
