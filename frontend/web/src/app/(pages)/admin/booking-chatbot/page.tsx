"use client";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";

export default function AdminBookingChatbotPage() {
	const { t } = useTranslation();

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<div
				className="flex h-16 w-16 items-center justify-center rounded-2xl"
				style={{ background: "var(--color-smile-primary-light)" }}
			>
				<Icon icon="lucide:bot" width={30} className="text-smile-primary" />
			</div>
			<h1 className="mt-5 font-poppins text-xl font-bold text-smile-title">
				{t("nav.bookingChatbot", "Booking Chatbot")}
			</h1>
			<p className="mt-2 max-w-[420px] font-inter text-sm text-smile-description">
				{t(
					"admin.bookingChatbot.comingSoon",
					"Chatbot management is coming soon. This page will let admins configure and monitor the AI booking assistant.",
				)}
			</p>
		</div>
	);
}
