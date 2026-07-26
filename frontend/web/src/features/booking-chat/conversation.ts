import type { BookingChatMessage } from "./types";

export interface Conversation {
	id: string;
	title: string;
	createdAt: number;
	messages: BookingChatMessage[];
}

export const STORAGE_KEY_PREFIX = "smile-booking-chat-conversations";

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

export function createConversation(): Conversation {
	return {
		id: createId("conversation"),
		title: "New conversation",
		createdAt: Date.now(),
		messages: [welcomeMessage()],
	};
}

export function getConversationStorageKey(patientId?: string) {
	return patientId ? `${STORAGE_KEY_PREFIX}:${patientId}` : null;
}

export function appendConversationMessage(
	conversation: Conversation,
	message: BookingChatMessage,
): Conversation {
	return {
		...conversation,
		title:
			conversation.title === "New conversation" && message.role === "user"
				? message.text.slice(0, 42)
				: conversation.title,
		messages: [...conversation.messages, message],
	};
}

export function loadStoredConversations(
	storage: Storage,
	storageKey: string,
): Conversation[] {
	storage.removeItem(STORAGE_KEY_PREFIX);

	try {
		const raw = storage.getItem(storageKey);
		if (!raw) return [createConversation()];

		const parsed = JSON.parse(raw) as Conversation[];
		if (Array.isArray(parsed) && parsed.length > 0) return parsed;
	} catch {
		storage.removeItem(storageKey);
	}

	return [createConversation()];
}
