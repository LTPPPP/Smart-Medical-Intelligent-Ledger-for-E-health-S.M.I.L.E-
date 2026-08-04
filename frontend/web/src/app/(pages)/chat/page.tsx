"use client";

import { Suspense, useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
	AssistantDataCard,
	MessageText,
} from "@/features/booking-chat/components/ChatMessageView";
import { useBookingChat } from "@/features/booking-chat/hooks/useBookingChat";
import { useTranslation } from "@/features/i18n";
import { AppShell } from "@/shared/components/layout/AppShell";

function ChatPageContent() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const searchParams = useSearchParams();
	const patientId = user?.userId;
	const sentInitialQuery = useRef(false);

	const {
		input,
		setInput,
		messages,
		canSend,
		isSending,
		hasError,
		submitInput,
		sendText,
		selectSlot,
		selectDoctor,
		selectClinic,
		runAppointmentAction,
	} = useBookingChat(patientId);

	useEffect(() => {
		if (sentInitialQuery.current || !patientId) return;
		const initialQuery = searchParams.get("q");
		if (!initialQuery) return;
		sentInitialQuery.current = true;
		void sendText(initialQuery);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [patientId, searchParams]);

	return (
		<AppShell>
			<div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-5xl gap-4 px-4 py-4 sm:px-8 sm:py-6">
				<section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)]">
					<header className="flex items-center justify-between border-b px-4 py-3 [border-color:var(--surface-card-border)]">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary text-white">
								<Icon icon="lucide:message-circle" className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-semibold text-smile-title">
									{t(
										"booking.chat.assistantTitle",
										"SMILE scheduling assistant",
									)}
								</p>
								<p className="text-xs text-smile-description">
									{patientId
										? t(
												"booking.chat.usingSignedInAccount",
												"Using your signed-in account",
											)
										: t(
												"booking.chat.signInToSend",
												"Sign in to send appointment requests",
											)}
								</p>
							</div>
						</div>
					</header>

					<div className="flex-1 space-y-3 overflow-y-auto bg-smile-primary-light/10 px-4 py-4">
						{messages.map((message) => (
							<article
								key={message.id}
								className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
										message.role === "user"
											? "bg-smile-primary text-white"
											: "border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] text-smile-title"
									}`}
								>
									<MessageText text={message.text} />
									{message.role === "assistant" ? (
										<AssistantDataCard
											message={message}
											onSelectDoctor={(doctor, flow) =>
												void selectDoctor(doctor, flow)
											}
											onSelectClinic={(clinic) => void selectClinic(clinic)}
											onSelectSlot={(slot, flow) => void selectSlot(slot, flow)}
											onAppointmentAction={(action) =>
												void runAppointmentAction(action)
											}
											isSending={isSending}
										/>
									) : null}
								</div>
							</article>
						))}
						{isSending ? (
							<article className="flex justify-start" aria-live="polite">
								<div className="max-w-[82%] rounded-lg border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] px-4 py-3 text-sm leading-6 text-smile-title">
									<div className="flex items-center gap-2">
										<Icon
											icon="lucide:sparkles"
											className="h-4 w-4 text-smile-primary"
										/>
										<span className="font-medium">
											{t(
												"booking.chat.reviewingRequest",
												"SMILE is reviewing your request",
											)}
										</span>
										<span
											className="flex items-center gap-1"
											aria-hidden="true"
										>
											<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-description" />
											<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-description [animation-delay:120ms]" />
											<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-description [animation-delay:240ms]" />
										</span>
									</div>
									<p className="mt-1 text-xs text-smile-description">
										{t(
											"booking.chat.checkingAppointments",
											"Checking your appointments and available times.",
										)}
									</p>
								</div>
							</article>
						) : null}
					</div>

					{hasError ? (
						<div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
							{t(
								"booking.chat.unavailableError",
								"SMILE scheduling is temporarily unavailable. Please try again.",
							)}
						</div>
					) : null}

					<form
						onSubmit={submitInput}
						className="flex gap-2 border-t px-4 py-3 [border-color:var(--surface-card-border)]"
					>
						<input
							value={input}
							onChange={(event) => setInput(event.target.value)}
							disabled={!patientId || isSending}
							placeholder={
								patientId
									? t(
											"booking.chat.typeRequestPlaceholder",
											"Type a scheduling request...",
										)
									: t(
											"booking.chat.signInToUsePlaceholder",
											"Sign in to use the assistant",
										)
							}
							className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						/>
						<button
							type="submit"
							disabled={!canSend}
							className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
						>
							{t("booking.chat.send", "Send")}
						</button>
					</form>
				</section>
			</div>
		</AppShell>
	);
}

export default function ChatPage() {
	return (
		<Suspense fallback={null}>
			<ChatPageContent />
		</Suspense>
	);
}
