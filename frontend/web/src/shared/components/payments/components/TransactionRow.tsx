"use client";

import { RotateCcw } from "lucide-react";
import type { Transaction } from "../paymentConstants";
import { STATUS_STYLES, METHOD_LABELS, METHOD_COLORS } from "../paymentConstants";
import { colors, fonts, radii, glassCard } from "@/styles/tokens";
import { StatusBadge, MethodBadge } from "@/components/shared/GlassUI";

interface TransactionRowProps {
    txn: Transaction;
    onRefund: (txn: Transaction) => void;
}

export function TransactionRow({ txn, onRefund }: TransactionRowProps) {
    const status = STATUS_STYLES[txn.status];
    const methodColor = METHOD_COLORS[txn.method];

    return (
        <div
            style={{
                ...glassCard,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${colors.glassInputBorder}`,
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                padding: "16px 20px",
                alignItems: "center",
                gap: "12px",
                transition: "border-color 0.15s, background 0.15s",
            }}
        >
            {/* Transaction ID + date */}
            <div>
                <p style={{ fontFamily: fonts.label, fontSize: "13px", fontWeight: 500, color: colors.primary, marginBottom: "2px" }}>
                    {txn.id}
                </p>
                <p style={{ fontSize: "11px", color: colors.textTertiary }}>{txn.date}</p>
            </div>

            {/* Patient */}
            <p style={{ fontSize: "13px", color: colors.textPrimary, fontWeight: 500 }}>{txn.patient}</p>

            {/* Service */}
            <p style={{ fontSize: "12px", color: colors.textSecondary }}>{txn.service}</p>

            {/* Method badge */}
            <div>
                <MethodBadge label={METHOD_LABELS[txn.method]} color={methodColor} />
            </div>

            {/* Status badge */}
            <div>
                <StatusBadge label={status.label} dotColor={status.dot} bgColor={status.bg} />
            </div>

            {/* Amount + actions */}
            <div className="flex items-center justify-between">
                <span style={{ fontFamily: fonts.label, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                    {txn.amount}
                </span>
                {txn.status === "paid" && (
                    <button
                        onClick={() => onRefund(txn)}
                        title="Request Refund"
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: radii.sm,
                            background: "rgba(255,255,255,0.05)",
                            border: `1px solid ${colors.glassDividerLight}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                    >
                        <RotateCcw size={12} style={{ color: colors.textTertiary }} />
                    </button>
                )}
            </div>
        </div>
    );
}
