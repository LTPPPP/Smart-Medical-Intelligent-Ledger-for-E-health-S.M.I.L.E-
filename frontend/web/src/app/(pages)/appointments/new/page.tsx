"use client";

import { BookingWizard } from "@/features/appointment/components/BookingWizard";
import { useTranslation } from "@/features/i18n";
import { AppShell } from "@/shared/components/layout/AppShell";

export default function NewAppointmentPage() {
	const { t } = useTranslation();

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 py-10 sm:px-8 sm:py-12">
				{/* Hero */}
				<div className="flex flex-col items-center gap-3 py-2 text-center">
					<h1 className="font-poppins text-[36px] font-bold leading-[40px] tracking-tight text-smile-primary-dark">
						{t("appointments.new.title", "Book an Appointment")}
					</h1>
					<p className="max-w-[672px] font-inter text-[17px] leading-7 text-smile-description">
						{t(
							"appointments.new.subtitle",
							"Follow the steps to choose how you'd like to schedule, fill the details, and confirm.",
						)}
					</p>
				</div>

				{/* Wizard */}
				<BookingWizard />

				{/* Chat cross-link removed: the booking assistant (/chat) is an AI feature
				    frozen for the demo. The /chat route and features/booking-chat are left
				    intact — only this entry point is hidden. */}
			</div>
		</AppShell>
	);
}
