"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks";
import { useBookingStore } from "@/stores/useBookingStore";
import { colors, radii } from "@/styles/tokens";
import { BookingStepper } from "./BookingStepper";
import { BookingCalendar } from "./components/BookingCalendar";
import { TimeSlotPicker } from "./components/TimeSlotPicker";
import { BookingFooter } from "./components/BookingFooter";

export function BookingStep2() {
    const {
        viewYear, viewMonth, selectedDay, selectedTime,
        setViewYear, setViewMonth, setSelectedDay, setSelectedTime,
        goNext, goBack,
    } = useBookingStore();
    const today = new Date();
    const { t } = useTranslation();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    return (
        <div className="flex flex-col gap-5">
            <BookingStepper />

            <div
                style={{
                    padding: "12px 16px",
                    borderRadius: radii.lg,
                    background: colors.amberSubtle,
                    border: `1px solid ${colors.amberBorder}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                <AlertTriangle size={16} style={{ color: colors.amber, flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: colors.amber }}>
                    {t("booking.step2.warningAfterHours", "Some time slots are marked as after-hours appointments and may incur additional charges.")}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <BookingCalendar
                    viewYear={viewYear}
                    viewMonth={viewMonth}
                    selectedDay={selectedDay}
                    today={today}
                    onSelectDay={setSelectedDay}
                    onPrevMonth={prevMonth}
                    onNextMonth={nextMonth}
                />
                <TimeSlotPicker selectedTime={selectedTime} onSelectTime={setSelectedTime} />
            </div>

            <BookingFooter
                selectedDay={selectedDay}
                selectedTime={selectedTime}
                viewMonth={viewMonth}
                viewYear={viewYear}
                onBack={goBack}
                onNext={goNext}
            />
        </div>
    );
}
