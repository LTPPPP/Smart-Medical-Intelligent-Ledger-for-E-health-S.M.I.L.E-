// Booking Assistant API client.
//
// The booking orchestrator (FastAPI) is NOT behind the API gateway, so we talk
// to it directly via `ENV.CHATBOT_URL` using a bare axios call rather than the
// shared gateway `apiClient` (which injects gateway auth headers/interceptors).

import axios from 'axios';

import { ENV } from '@/shared/constants/env';

import type {
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat.type';

export async function sendMessage(
  payload: SendMessageRequest,
): Promise<SendMessageResponse> {
  const { data } = await axios.post<SendMessageResponse>(
    `${ENV.CHATBOT_URL}/api/chat`,
    payload,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    },
  );
  return data;
}

export const chatbotApi = { sendMessage };
