"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";

export function PaymentFilters() {
    const { t } = useTranslation();

    const FILTERS = [
        t("payments.history.dateRange", "Date Range"),
        t("payments.history.filterStatus", "Status"),
        t("payments.history.filterMethod", "Payment Method"),
        t("payments.history.filterAmount", "Amount"),
    ];

    return (
        <div
            style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px", padding: "12px 20px",
                display: "flex", alignItems: "center", gap: "12px",
            }}
        >
            <Icon icon="lucide:filter" width={14} style={{ color: "#8B9199", flexShrink: 0 }} />
            {FILTERS.map((f) => (
                <select
                    key={f}
                    style={{
                        padding: "7px 12px", borderRadius: "10px", background: "#1D2023",
                        border: "1px solid rgba(255,255,255,0.08)", color: "#C1C7CF",
                        fontSize: "12px", cursor: "pointer", outline: "none",
                        fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                    }}
                >
                    <option>{f}</option>
                </select>
            ))}
        </div>
    );
}
