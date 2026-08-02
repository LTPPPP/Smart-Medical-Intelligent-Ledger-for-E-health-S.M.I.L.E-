"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";

import { useBookingChat } from "../hooks/useBookingChat";
import { AssistantDataCard, MessageText } from "./ChatMessageView";

export function FloatingBookingChat() {
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [size, setSize] = useState({ width: 780, height: 620 });
	const [historyOpen, setHistoryOpen] = useState(true);

	const patientId = user?.userId;
	const {
		input,
		setInput,
		conversations,
		activeId,
		setActiveId,
		currentMessages,
		canSend,
		isSending,
		hasError,
		pendingConfirmation,
		addConversation,
		submitInput,
		confirmChange,
		selectSlot,
		selectDoctor,
		runAppointmentAction,
	} = useBookingChat(patientId);

	function beginResize(event: React.PointerEvent<HTMLButtonElement>) {
		event.preventDefault();
		const startX = event.clientX;
		const startY = event.clientY;
		const startWidth = size.width;
		const startHeight = size.height;

		function onMove(moveEvent: PointerEvent) {
			const nextWidth = Math.min(
				window.innerWidth - 32,
				Math.max(360, startWidth + (startX - moveEvent.clientX)),
			);
			const nextHeight = Math.min(
				window.innerHeight - 32,
				Math.max(520, startHeight + (startY - moveEvent.clientY)),
			);
			setSize({ width: nextWidth, height: nextHeight });
		}

		function onUp() {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		}

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}

	return (
		<>
			{!isOpen ? (
				<button
					type="button"
					data-testid="floating-booking-chat"
					onClick={() => setIsOpen(true)}
					className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-smile-primary text-white shadow-xl transition hover:bg-smile-primary-dark"
					aria-label={t(
						"booking.chat.openAssistant",
						"Open SMILE scheduling assistant",
					)}
				>
					<Icon icon="lucide:message-circle" className="h-6 w-6" />
				</button>
			) : (
				<section
					className="fixed bottom-5 right-5 z-50 flex min-h-[520px] min-w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
					style={{
						width: size.width,
						height: size.height,
						maxWidth: "calc(100vw - 32px)",
						maxHeight: "calc(100vh - 32px)",
					}}
				>
					<button
						type="button"
						onPointerDown={beginResize}
						className="absolute left-1 top-1 z-10 flex h-4 w-4 cursor-nwse-resize items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 hover:text-smile-primary"
						aria-label={t("booking.chat.resizeChat", "Resize chat")}
						title={t("booking.chat.dragToResize", "Drag to resize")}
					>
						<Icon icon="lucide:grip" className="h-2.5 w-2.5 rotate-45" />
					</button>
					{historyOpen ? (
						<aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-3 md:block">
							<button
								type="button"
								onClick={addConversation}
								className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-smile-primary px-3 py-2 text-sm font-semibold text-white"
							>
								<Icon icon="lucide:plus" className="h-4 w-4" />
								{t("booking.chat.newChat", "New chat")}
							</button>
							<div className="space-y-2 overflow-y-auto">
								{conversations.map((conversation) => (
									<button
										key={conversation.id}
										type="button"
										onClick={() => setActiveId(conversation.id)}
										className={`w-full rounded-md px-3 py-2 text-left text-xs ${conversation.id === activeId ? "bg-white text-smile-primary shadow-sm" : "text-slate-600 hover:bg-white"}`}
									>
										<span className="block truncate font-semibold">
											{conversation.title}
										</span>
										<span className="mt-1 block text-[11px] text-slate-400">
											{new Date(conversation.createdAt).toLocaleDateString(
												"en-US",
												{ month: "short", day: "numeric" },
											)}
										</span>
									</button>
								))}
							</div>
						</aside>
					) : null}

					<div className="flex min-w-0 flex-1 flex-col">
						<header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
							<div>
								<p className="text-sm font-semibold text-slate-950">
									{t(
										"booking.chat.assistantTitle",
										"SMILE scheduling assistant",
									)}
								</p>
								<p className="text-xs text-slate-500">
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
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setHistoryOpen((open) => !open)}
									className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-smile-primary hover:text-smile-primary"
								>
									<Icon
										icon={
											historyOpen
												? "lucide:panel-left-close"
												: "lucide:panel-left-open"
										}
										className="h-4 w-4"
									/>
									{historyOpen
										? t("booking.chat.hideHistory", "Hide history")
										: t("booking.chat.showHistory", "Show history")}
								</button>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
									aria-label={t("booking.chat.closeChat", "Close chat")}
								>
									<Icon icon="lucide:x" className="h-4 w-4" />
								</button>
							</div>
						</header>

						<div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
							{currentMessages.map((message) => (
								<article
									key={message.id}
									className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-smile-primary text-white" : "border border-slate-200 bg-white text-slate-800"}`}
									>
										<MessageText text={message.text} />
										{message.role === "assistant" ? (
											<AssistantDataCard
												message={message}
												onSelectDoctor={(doctor, flow) =>
													void selectDoctor(doctor, flow)
												}
												onSelectSlot={(slot, flow) =>
													void selectSlot(slot, flow)
												}
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
									<div className="max-w-[82%] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
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
												<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
												<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
												<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
											</span>
										</div>
										<p className="mt-1 text-xs text-slate-500">
											{t(
												"booking.chat.checkingAppointments",
												"Checking your appointments and available times.",
											)}
										</p>
									</div>
								</article>
							) : null}
						</div>

						{pendingConfirmation ? (
							<div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
								<p className="text-sm font-medium text-amber-950">
									{pendingConfirmation.summary}
								</p>
								<div className="mt-3 flex gap-2">
									<button
										type="button"
										onClick={() => void confirmChange(true)}
										className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white"
									>
										{t("appointments.detail.confirm", "Confirm")}
									</button>
									<button
										type="button"
										onClick={() => void confirmChange(false)}
										className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
									>
										{t("common.cancel", "Cancel")}
									</button>
								</div>
							</div>
						) : null}

						{hasError ? (
							<div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
								{t(
									"booking.chat.unavailableError",
									"SMILE scheduling is temporarily unavailable. Please try again.",
								)}
							</div>
						) : null}

						<form
							onSubmit={submitInput}
							className="flex gap-2 border-t border-slate-200 p-3"
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
								className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-smile-primary"
							/>
							<button
								type="submit"
								disabled={!canSend}
								className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
							>
								{t("booking.chat.send", "Send")}
							</button>
						</form>
					</div>
				</section>
			)}
		</>
	);
}
