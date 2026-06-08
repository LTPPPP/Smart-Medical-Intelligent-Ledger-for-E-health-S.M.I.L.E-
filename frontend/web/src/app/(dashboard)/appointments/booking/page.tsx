"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { BookingStep1, BookingStep2, BookingStep3, BookingStep4 } from "@/components/booking";
import { useBookingStore } from "@/stores/useBookingStore";
import { ambientBg } from "@/styles/tokens";
import { PageTransition } from "@/components/shared/GlassUI";

export default function BookingPage() {
    const step = useBookingStore((s) => s.step);
    const direction = useBookingStore((s) => s.direction);
    const resetBooking = useBookingStore((s) => s.resetBooking);
    const router = useRouter();

    // Reset booking state on mount
    useEffect(() => {
        resetBooking();
    }, [resetBooking]);

    const handleConfirm = () => {
        router.push("/payments/success");
    };

    return (
        <div
            className="min-h-screen -m-4 md:-m-6 p-6 md:p-8"
            style={ambientBg}
        >
            <div className="max-w-5xl mx-auto overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <PageTransition key={step} direction={direction}>
                        {step === 1 && <BookingStep1 />}
                        {step === 2 && <BookingStep2 />}
                        {step === 3 && <BookingStep3 />}
                        {step === 4 && <BookingStep4 onConfirm={handleConfirm} />}
                    </PageTransition>
                </AnimatePresence>
            </div>
        </div>
    );
}
