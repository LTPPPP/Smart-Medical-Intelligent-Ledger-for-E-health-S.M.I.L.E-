import { type FormEvent, useState } from "react";

import { streamBookingChatMessage } from "../api";
import {
	buildSlotSelectionMessage,
	slotLabel,
	type AppointmentAction,
	type BookingOptionPreview,
	type ClinicOptionPreview,
	type DoctorOptionPreview,
} from "../components/BookingChatControls";
import { createId, welcomeMessage } from "../conversation";
import type {
	BookingChatActionRequest,
	BookingChatMessage,
	BookingSlotState,
} from "../types";

// In-memory booking chat state
export function useBookingChat(patientId: string | undefined) {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<BookingChatMessage[]>(() => [
		welcomeMessage(),
	]);
	const [bookingState, setBookingState] = useState<BookingSlotState>({});
	const [isSending, setIsSending] = useState(false);
	const [hasError, setHasError] = useState(false);

	const canSend = Boolean(patientId && input.trim() && !isSending);

	function appendMessage(message: BookingChatMessage) {
		setMessages((current) => [...current, message]);
	}

	function appendToMessage(messageId: string, delta: string) {
		setMessages((current) =>
			current.map((message) =>
				message.id === messageId
					? { ...message, text: message.text + delta }
					: message,
			),
		);
	}

	function finalizeMessage(
		messageId: string,
		final: { text: string; flow?: BookingChatMessage["flow"]; safeState?: Record<string, unknown> },
	) {
		setMessages((current) =>
			current.map((message) =>
				message.id === messageId ? { ...message, ...final } : message,
			),
		);
	}

	async function sendToAgent(
		message: string,
		visibleText = message,
		selectedBookingOptionId?: string,
		selectedDoctorId?: string,
		actionRequest?: BookingChatActionRequest,
		selectedClinicId?: string,
	) {
		if (!patientId || isSending) return;
		setIsSending(true);
		setHasError(false);
		appendMessage({
			id: createId("message"),
			role: "user",
			text: visibleText,
			safeState: {},
		});
		const assistantMessageId = createId("message");
		appendMessage({
			id: assistantMessageId,
			role: "assistant",
			text: "",
			safeState: {},
		});
		try {
			const final = await streamBookingChatMessage(
				{
					message,
					state: bookingState,
					action: actionRequest?.action,
					appointment_ref: actionRequest?.appointment_ref,
					selected_doctor_id: selectedDoctorId,
					selected_clinic_id: selectedClinicId,
					selected_booking_option_id: selectedBookingOptionId,
				},
				(delta) => appendToMessage(assistantMessageId, delta),
			);
			setBookingState(final.state);
			finalizeMessage(assistantMessageId, {
				text: final.reply,
				flow: final.flow,
				safeState: final.safe_state,
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

	async function selectSlot(
		option: BookingOptionPreview,
		flow?: BookingChatMessage["flow"],
	) {
		const message = buildSlotSelectionMessage(option, flow);
		const visibleText = `I choose ${slotLabel(option)}${option.doctor_name ? ` with ${option.doctor_name}` : ""}.`;
		await sendToAgent(message, visibleText, option.id);
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
			doctor.doctor_id,
		);
	}

	async function selectClinic(clinic: ClinicOptionPreview) {
		if (!clinic.clinic_id) return;
		await sendToAgent(
			`Use this clinic: ${clinic.clinic_name ?? clinic.clinic_id}.`,
			`I choose ${clinic.clinic_name ?? "this clinic"}.`,
			undefined,
			undefined,
			undefined,
			clinic.clinic_id,
		);
	}

	async function runAppointmentAction(action: AppointmentAction) {
		await sendToAgent(
			action.request.message,
			action.visibleText,
			undefined,
			undefined,
			action.request,
		);
	}

	return {
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
	};
}
