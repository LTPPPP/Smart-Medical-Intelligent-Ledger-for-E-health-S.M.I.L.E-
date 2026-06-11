"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";

interface PaymentPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    shownItems: number;
    onChange: (page: number) => void;
}

export function PaymentPagination({ currentPage, totalPages, totalItems, shownItems, onChange }: PaymentPaginationProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between" style={{ padding: "12px 4px" }}>
            <p style={{ fontSize: "13px", color: "#8B9199" }}>
                {t("payments.history.showing", "Showing")} <span style={{ color: "#E1E2E6", fontWeight: 500 }}>{shownItems}</span> {t("payments.history.of", "of")}{" "}
                <span style={{ color: "#E1E2E6", fontWeight: 500 }}>{totalItems}</span> {t("payments.history.transactions", "transactions")}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ width: 36, height: 36, borderRadius: "10px", background: "#1D2023", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                    <Icon icon="lucide:chevron-left" width={14} style={{ color: "#C1C7CF" }} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        style={{ width: 36, height: 36, borderRadius: "10px", background: currentPage === p ? "#1D2023" : "transparent", border: currentPage === p ? "1px solid rgba(146,205,253,0.4)" : "1px solid transparent", color: currentPage === p ? "#92CDFD" : "#8B9199", fontSize: "13px", fontWeight: currentPage === p ? 600 : 400, cursor: "pointer", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')" }}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{ width: 36, height: 36, borderRadius: "10px", background: "#1D2023", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}
                >
                    <Icon icon="lucide:chevron-right" width={14} style={{ color: "#C1C7CF" }} />
                </button>
            </div>
        </div>
    );
}
