// Chat types for the Booking Assistant (booking-orchestrator FastAPI service).

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO timestamp
}

// History entry sent to the orchestrator (subset of ChatMessage).
export interface ChatHistoryEntry {
  role: ChatRole;
  content: string;
}

// Request body for POST /api/chat
export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  history?: ChatHistoryEntry[];
}

// Response body from POST /api/chat
export interface SendMessageResponse {
  reply: string;
  data?: Record<string, unknown>;
}
