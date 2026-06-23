export type BookingChatFlow =
  | "lookup"
  | "booking"
  | "cancel"
  | "reschedule"
  | "conversational"
  | "out_of_scope"
  | "info"
  | "unknown";

export interface BookingChatRequest {
  session_id: string;
  message: string;
  selected_booking_option_id?: string;
  confirmation_token?: string;
  confirmed?: boolean;
}

export interface BookingChatConfirmation {
  token: string;
  flow: BookingChatFlow;
  action: string;
  summary: string;
}

export interface BookingChatResponse {
  reply: string;
  flow: BookingChatFlow;
  safe_state: Record<string, unknown>;
  actions: string[];
  confirmation: BookingChatConfirmation | null;
  metadata: Record<string, unknown>;
}

export interface BookingChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  flow?: BookingChatFlow;
  confirmation?: BookingChatConfirmation | null;
  safeState?: Record<string, unknown>;
}
