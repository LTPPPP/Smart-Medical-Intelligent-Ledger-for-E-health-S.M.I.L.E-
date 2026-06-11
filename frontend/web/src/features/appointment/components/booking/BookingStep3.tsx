"use client";

import { Icon } from "@iconify/react";
import { useTranslation } from "@/shared/hooks";
import { useBookingStore } from "@/features/appointment/stores/useBookingStore";
import { colors, fonts, btnPrimary, btnGhost } from "@/styles/tokens";
import { SectionHeading } from "@/shared/components/ui/GlassUI";
import { BookingStepper } from "./BookingStepper";
import { AppointmentTypeSelector } from "./components/AppointmentTypeSelector";
import { BookingSummaryAside } from "./components/BookingSummaryAside";
import { PatientInfoForm } from "./components/PatientInfoForm";

export function BookingStep3() {
    const {
        appointmentType, setAppointmentType,
        preferredLanguage, setPreferredLanguage,
        chiefComplaint, setChiefComplaint,
        doctorNotes, setDoctorNotes,
        goNext, goBack, canProceedStep3,
    } = useBookingStore();
    const { t } = useTranslation();

    const canProceed = canProceedStep3();

    return (
        <div className="flex flex-col gap-5">
            <BookingStepper />

            <SectionHeading
                title={t("booking.step3.title", "Patient Information")}
                subtitle={t("booking.step3.subtitle", "Fill in the patient details for this appointment")}
            />

            <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-4">
                    <AppointmentTypeSelector value={appointmentType} onChange={setAppointmentType} />
                    <PatientInfoForm
                        language={preferredLanguage}
                        setLanguage={setPreferredLanguage}
                        complaint={chiefComplaint}
                        setComplaint={setChiefComplaint}
                        notes={doctorNotes}
                        setNotes={setDoctorNotes}
                    />
                </div>
                <BookingSummaryAside />
            </div>

            <div className="flex items-center gap-3">
                <button onClick={goBack} style={btnGhost}>
                    {t("common.back", "Back")}
                </button>
                <button
                    onClick={goNext}
                    disabled={!canProceed}
                    className="flex items-center gap-2"
                    style={btnPrimary(canProceed)}
                >
                    {t("booking.step3.continueToConfirm", "Continue to Confirm")}
                    <Icon icon="lucide:arrow-right" width={14} />
                </button>
            </div>
        </div>
    );
}
