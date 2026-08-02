import { type FormEvent, useEffect, useState } from "react";

import { sendBookingChatMessage } from "../api";
import {
	appendConversationMessage,
	createConversation,
	createId,
	getConversationStorageKey,
	loadStoredConversations,
	type Conversation,
} from "../conversation";
import type {
	BookingChatActionRequest,
	BookingChatConfirmation,
	BookingChatMessage,
} from "../types";
import {
	buildSlotSelectionMessage,
	slotLabel,
	type AppointmentAction,
	type BookingOptionPreview,
	type DoctorOptionPreview,
} from "../components/BookingChatControls";

interface UseBookingChatOptions {
	/** Identity used to namespace localStorage transcripts. Defaults to `patientId`. */
	storageIdentity?: string;
}

export function useBookingChat(
	patientId: string | undefined,
	options: UseBookingChatOptions = {},
) {
	const [input, setInput] = useState("");
	const [conversations, setConversations] = useState<Conversation[]>(() => [
		createConversation(),
	]);
	const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? "");
	const [pendingConfirmation, setPendingConfirmation] =
		useState<BookingChatConfirmation | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

	const storageKey = getConversationStorageKey(
		options.storageIdentity ?? patientId,
	);
	const activeConversation =
		conversations.find((item) => item.id === activeId) ?? conversations[0];
	const canSend = Boolean(patientId && input.trim() && !isSending);

	useEffect(() => {
		if (!storageKey) {
			const next = createConversation();
			setConversations([next]);
			setActiveId(next.id);
			setPendingConfirmation(null);
			setLoadedStorageKey(null);
			return;
		}

		const loaded = loadStoredConversations(window.localStorage, storageKey);
		setConversations(loaded);
		setActiveId(loaded[0]?.id ?? "");
		setPendingConfirmation(null);
		setLoadedStorageKey(storageKey);
	}, [storageKey]);

	useEffect(() => {
		if (!storageKey || loadedStorageKey !== storageKey) return;
		window.localStorage.setItem(storageKey, JSON.stringify(conversations));
	}, [conversations, loadedStorageKey, storageKey]);

	function updateConversation(
		conversationId: string,
		updater: (conversation: Conversation) => Conversation,
	) {
		setConversations((current) =>
			current.map((conversation) =>
				conversation.id === conversationId
					? updater(conversation)
					: conversation,
			),
		);
	}

	function addConversation() {
		const next = createConversation();
		setConversations((current) => [next, ...current]);
		setActiveId(next.id);
		setPendingConfirmation(null);
	}

	function appendMessage(conversationId: string, message: BookingChatMessage) {
		updateConversation(conversationId, (conversation) =>
			appendConversationMessage(conversation, message),
		);
	}

	async function sendToAgent(
		message: string,
		visibleText = message,
		confirmationToken?: string,
		confirmed?: boolean,
		allowMultiOptionConfirmation = false,
		selectedBookingOptionId?: string,
		selectedDoctorId?: string,
		actionRequest?: BookingChatActionRequest,
	) {
		if (!patientId || !activeConversation || isSending) return;
		const conversationId = activeConversation.id;
		setIsSending(true);
		setHasError(false);
		appendMessage(conversationId, {
			id: createId("message"),
			role: "user",
			text: visibleText,
			safeState: {},
		});
		try {
			const response = await sendBookingChatMessage({
				session_id: conversationId,
				message,
				action: actionRequest?.action,
				appointment_ref: actionRequest?.appointment_ref,
				selected_doctor_id: selectedDoctorId,
				selected_booking_option_id: selectedBookingOptionId,
				confirmation_token: confirmationToken,
				confirmed,
			});
			const hasMultipleBookingOptions =
				(response.flow === "booking" || response.flow === "reschedule") &&
				Array.isArray(response.safe_state?.booking_options) &&
				response.safe_state.booking_options.length > 1;
			setPendingConfirmation(
				hasMultipleBookingOptions && !allowMultiOptionConfirmation
					? null
					: response.confirmation,
			);
			appendMessage(conversationId, {
				id: createId("message"),
				role: "assistant",
				text: response.reply,
				flow: response.flow,
				confirmation: response.confirmation,
				safeState: response.safe_state,
			});
			return true;
		} catch {
			setHasError(true);
			return false;
		} finally {
			setIsSending(false);
		}
	}

	async function submitInput(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) return;
		const text = input.trim();
		setInput("");
		await sendToAgent(text, text);
	}

	async function sendText(text: string) {
		const trimmed = text.trim();
		if (!trimmed || !patientId || isSending) return;
		await sendToAgent(trimmed, trimmed);
	}

	async function confirmChange(confirmed: boolean) {
		if (!pendingConfirmation) return;
		setPendingConfirmation(null);
		await sendToAgent(
			confirmed ? "Confirm" : "Cancel confirmation",
			confirmed ? "Yes, confirm this change." : "No, do not make this change.",
			pendingConfirmation.token,
			confirmed,
			false,
		);
	}

	async function selectSlot(
		option: BookingOptionPreview,
		flow?: BookingChatMessage["flow"],
	) {
		const message = buildSlotSelectionMessage(option, flow);
		const visibleText = `I choose ${slotLabel(option)}${option.doctor_name ? ` with ${option.doctor_name}` : ""}.`;
		await sendToAgent(
			message,
			visibleText,
			undefined,
			undefined,
			true,
			option.id,
		);
	}

	async function selectDoctor(
		doctor: DoctorOptionPreview,
		flow?: BookingChatMessage["flow"],
	) {
		if (!doctor.doctor_id) return;
		const intent =
			flow === "reschedule"
				? "Use this doctor for my rescheduled appointment."
				: "Use this doctor for my appointment.";
		await sendToAgent(
			intent,
			`I choose ${doctor.doctor_name ?? "this doctor"}.`,
			undefined,
			undefined,
			false,
			undefined,
			doctor.doctor_id,
		);
	}

	async function runAppointmentAction(action: AppointmentAction) {
		await sendToAgent(
			action.request.message,
			action.visibleText,
			undefined,
			undefined,
			true,
			undefined,
			undefined,
			action.request,
		);
	}

	return {
		input,
		setInput,
		conversations,
		activeId,
		setActiveId,
		activeConversation,
		currentMessages: activeConversation?.messages ?? [],
		canSend,
		isSending,
		hasError,
		pendingConfirmation,
		addConversation,
		submitInput,
		sendText,
		confirmChange,
		selectSlot,
		selectDoctor,
		runAppointmentAction,
	};
}
