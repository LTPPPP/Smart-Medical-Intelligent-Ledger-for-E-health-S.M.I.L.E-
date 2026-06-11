"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";

type PaymentTiming = "now" | "later";

interface PaymentPanelProps {
    payTiming: PaymentTiming;
    setPayTiming: (t: PaymentTiming) => void;
    cardNumber: string;
    setCardNumber: (v: string) => void;
    expiry: string;
    setExpiry: (v: string) => void;
    cvv: string;
    setCvv: (v: string) => void;
    onConfirm: () => void;
    onBack: () => void;
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.05)", border: "1px solid #6B7280",
    color: "#E1E2E6", fontSize: "14px", outline: "none",
    fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
};

const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px", backdropFilter: "blur(10px)",
};

export function PaymentPanel({ payTiming, setPayTiming, cardNumber, setCardNumber, expiry, setExpiry, cvv, setCvv, onConfirm, onBack }: PaymentPanelProps) {
    const { t } = useTranslation();

    const LINE_ITEMS = [
        { label: t("booking.step4.consultationFee", "Consultation Fee"), value: "400,000 ₫" },
        { label: t("booking.step4.serviceFee", "Service Fee"), value: "50,000 ₫" },
        { label: t("booking.step4.insuranceDiscount", "Insurance Discount"), value: "-100,000 ₫", isDiscount: true },
    ];

    return (
        <div style={{ ...glassCard, padding: "24px", height: "fit-content" }}>
            <h3 style={{ fontFamily: "var(--font-public-sans, 'Public Sans')", fontSize: "16px", fontWeight: 600, color: "#E1E2E6", marginBottom: "20px" }}>
                {t("booking.step4.paymentSummary", "Payment Summary")}
            </h3>

            {/* Line items */}
            <div className="flex flex-col gap-2 mb-4">
                {LINE_ITEMS.map((item) => (
                    <div key={item.label} className="flex justify-between">
                        <span style={{ fontSize: "13px", color: "#8B9199" }}>{item.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: item.isDiscount ? "#45F0CF" : "#C1C7CF", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')" }}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#E1E2E6" }}>Total</span>
                <span style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", fontSize: "20px", fontWeight: 700, color: "#92CDFD" }}>350,000 ₫</span>
            </div>

            {/* Pay now / later toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                {(["now", "later"] as PaymentTiming[]).map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setPayTiming(opt)}
                        style={{
                            padding: "10px", borderRadius: "10px",
                            background: payTiming === opt ? "rgba(146,205,253,0.2)" : "transparent",
                            border: `1px solid ${payTiming === opt ? "#92CDFD" : "rgba(255,255,255,0.1)"}`,
                            color: payTiming === opt ? "#92CDFD" : "#8B9199",
                            fontSize: "13px", fontWeight: payTiming === opt ? 600 : 400,
                            cursor: "pointer", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')",
                        }}
                    >
                        Pay {opt === "now" ? "Now" : "Later"}
                    </button>
                ))}
            </div>

            {/* Card form */}
            {payTiming === "now" && (
                <div className="flex flex-col gap-3 mb-4">
                    <div>
                        <label style={{ display: "block", fontSize: "12px", color: "#8B9199", marginBottom: "6px", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')" }}>
                            {t("booking.step4.cardNumber", "Card Number")}
                        </label>
                        <div style={{ position: "relative" }}>
                            <input type="text" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ ...inputStyle, paddingRight: "40px" }} />
                            <Icon icon="lucide:credit-card" width={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#8B9199" }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#8B9199", marginBottom: "6px", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')" }}>
                                {t("booking.step4.expiry", "Expiry")}
                            </label>
                            <input type="text" placeholder="MM / YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#8B9199", marginBottom: "6px", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')" }}>
                                {t("booking.step4.cvv", "CVV")}
                            </label>
                            <input type="text" placeholder="···" value={cvv} onChange={(e) => setCvv(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={onConfirm}
                className="w-full flex items-center justify-center gap-2"
                style={{ padding: "14px", borderRadius: "100px", background: "#92CDFD", color: "#003450", fontSize: "14px", fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "var(--font-space-grotesk, 'Space Grotesk')", boxShadow: "0 0 20px rgba(146,205,253,0.3)" }}
            >
                <Icon icon="lucide:lock" width={14} />
                {t("booking.step4.confirmBooking", "Confirm Booking")}
            </button>
            <p style={{ fontSize: "11px", color: "#41474E", textAlign: "center", marginTop: "10px" }}>
                {t("booking.step4.sslNote", "Secured by 256-bit SSL encryption")}
            </p>
            <button
                onClick={onBack}
                style={{ width: "100%", marginTop: "8px", padding: "12px", borderRadius: "100px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8B9199", fontSize: "13px", cursor: "pointer" }}
            >
                {t("booking.step4.backToPatientInfo", "Back to Patient Info")}
            </button>
        </div>
    );
}
