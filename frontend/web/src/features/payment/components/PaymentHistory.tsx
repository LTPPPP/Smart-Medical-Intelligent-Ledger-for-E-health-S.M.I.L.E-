"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { RefundModal } from "./RefundModal";
import { useTranslation } from "@/shared/hooks";
import { TRANSACTIONS, type Transaction } from "./paymentConstants";
import { PaymentFilters } from "./components/PaymentFilters";
import { TransactionRow } from "./components/TransactionRow";
import { PaymentPagination } from "./components/PaymentPagination";
import { colors, fonts, radii, shadows, btnGhost } from "@/styles/tokens";
import { IconBox } from "@/shared/components/ui/GlassUI";

export function PaymentHistory() {
    const [refundTxn, setRefundTxn] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5;
    const { t } = useTranslation();

    return (
        <>
            <div className="flex flex-col gap-5">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: colors.surfaceDim,
                        borderRadius: radii["3xl"],
                        padding: "24px",
                        boxShadow: shadows.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div className="flex items-center gap-4">
                        <IconBox size={52} radius={radii.xl} bg={colors.primarySubtle} border={`1px solid ${colors.successBorder}`}>
                            <Icon icon="lucide:credit-card" width={22} style={{ color: colors.primary }} />
                        </IconBox>
                        <div>
                            <h1
                                style={{
                                    fontFamily: fonts.heading,
                                    fontSize: "26px",
                                    fontWeight: 700,
                                    color: colors.textPrimary,
                                    letterSpacing: "-0.5px",
                                }}
                            >
                                {t("payments.history.title", "Payment History")}
                            </h1>
                            <p style={{ fontSize: "13px", color: colors.textTertiary }}>
                                {t("payments.history.subtitle", "Track invoices and transaction records")}
                            </p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2" style={{ ...btnGhost, padding: "10px 18px", fontSize: "13px" }}>
                        <Icon icon="lucide:download" width={14} />
                        {t("payments.history.export", "Export")}
                    </button>
                </motion.div>

                <PaymentFilters />

                {/* Table column headers */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                        padding: "0 20px",
                        gap: "12px",
                    }}
                >
                    {[
                        t("payments.history.transactionId", "Transaction ID"),
                        t("payments.history.patient", "Patient"),
                        t("payments.history.service", "Service"),
                        t("payments.history.paymentMethod", "Method"),
                        t("payments.history.filterStatus", "Status"),
                        t("payments.history.filterAmount", "Amount"),
                    ].map((col) => (
                        <span
                            key={col}
                            style={{
                                fontFamily: fonts.label,
                                fontSize: "11px",
                                fontWeight: 600,
                                color: colors.textSecondary,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {col}
                        </span>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {TRANSACTIONS.map((txn, i) => (
                        <motion.div
                            key={txn.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                        >
                            <TransactionRow txn={txn} onRefund={setRefundTxn} />
                        </motion.div>
                    ))}
                </div>

                <PaymentPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={47}
                    shownItems={TRANSACTIONS.length}
                    onChange={setCurrentPage}
                />
            </div>

            {refundTxn && (
                <RefundModal
                    transactionId={refundTxn.id}
                    amount={refundTxn.amount.replace(" ₫", "").replace(",", "")}
                    onClose={() => setRefundTxn(null)}
                />
            )}
        </>
    );
}
