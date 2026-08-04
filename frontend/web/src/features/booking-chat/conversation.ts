import type { BookingChatMessage } from "./types";

export function createId(prefix: string) {
	return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

export function welcomeMessage(): BookingChatMessage {
	return {
		id: "welcome",
		role: "assistant",
		text: "Hi, I am SMILE's scheduling assistant. Choose an option below or type what you need.",
		safeState: {},
	};
}
