export type BookingChatFlow =
	| "lookup"
	| "booking"
	| "cancel"
	| "reschedule"
	| "conversational"
	| "out_of_scope"
	| "info"
	| "unknown";

// Client-held booking state
export type BookingSlotState = Record<string, unknown>;

export interface BookingChatRequest {
	message: string;
	state: BookingSlotState;
	action?: "cancel_appointment" | "reschedule_appointment";
	appointment_ref?: string;
	selected_doctor_id?: string;
	selected_clinic_id?: string;
	selected_booking_option_id?: string;
}

export type BookingChatActionRequest = Pick<
	BookingChatRequest,
	"message" | "action" | "appointment_ref"
>;

// Chat SSE event shape
export type BookingChatStreamEvent =
	| { type: "token"; text: string }
	| {
			type: "final";
			reply: string;
			flow: BookingChatFlow;
			safe_state: Record<string, unknown>;
			// Next request's state
			state: BookingSlotState;
	  };

export type BookingChatResponse = Extract<
	BookingChatStreamEvent,
	{ type: "final" }
>;

export interface BookingChatMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
	flow?: BookingChatFlow;
	safeState?: Record<string, unknown>;
}
