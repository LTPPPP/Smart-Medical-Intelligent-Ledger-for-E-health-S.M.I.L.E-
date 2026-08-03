import { useAuthStore } from "@/features/auth/store/authStore";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import type {
	BookingChatRequest,
	BookingChatResponse,
	BookingChatStreamEvent,
} from "./types";

// Stream chat reply
export async function streamBookingChatMessage(
	payload: BookingChatRequest,
	onToken: (text: string) => void,
): Promise<BookingChatResponse> {
	const { accessToken } = useAuthStore.getState();
	const response = await fetch(API_ENDPOINTS.AI.BOOKING_CHAT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok || !response.body) {
		throw new Error(`Booking chat request failed: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let final: BookingChatResponse | null = null;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		let separatorIndex = buffer.indexOf("\n\n");
		while (separatorIndex !== -1) {
			const rawEvent = buffer.slice(0, separatorIndex);
			buffer = buffer.slice(separatorIndex + 2);
			const dataLine = rawEvent
				.split("\n")
				.find((line) => line.startsWith("data: "));
			if (dataLine) {
				const event = JSON.parse(
					dataLine.slice("data: ".length),
				) as BookingChatStreamEvent;
				if (event.type === "token") {
					onToken(event.text);
				} else {
					final = event;
				}
			}
			separatorIndex = buffer.indexOf("\n\n");
		}
	}

	if (!final) {
		throw new Error("Booking chat stream ended without a final event");
	}
	return final;
}
