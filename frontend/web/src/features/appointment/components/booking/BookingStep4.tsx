"use client";

import { useTranslation } from "@/shared/hooks";
import { useBookingStore } from "@/features/appointment/stores/useBookingStore";
import { BookingStepper } from "./BookingStepper";
import { AppointmentSummaryCard } from "./components/AppointmentSummaryCard";
import { PaymentPanel } from "./components/PaymentPanel";

interface BookingStep4Props {
    onConfirm: () => void;
}

export function BookingStep4({ onConfirm }: BookingStep4Props) {
    const {
        payTiming, setPayTiming,
        cardNumber, setCardNumber,
        expiry, setExpiry,
        cvv, setCvv,
        goBack,
    } = useBookingStore();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-5">
            <BookingStepper />
            <div className="grid" style={{ gridTemplateColumns: "1fr 300px", gap: "20px" }}>
                <AppointmentSummaryCard />
                <PaymentPanel
                    payTiming={payTiming}
                    setPayTiming={setPayTiming}
                    cardNumber={cardNumber}
                    setCardNumber={setCardNumber}
                    expiry={expiry}
                    setExpiry={setExpiry}
                    cvv={cvv}
                    setCvv={setCvv}
                    onConfirm={onConfirm}
                    onBack={goBack}
                />
            </div>
        </div>
    );
}

