import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import type { BookingChatRequest, BookingChatResponse } from "./types";

export async function sendBookingChatMessage(
  payload: BookingChatRequest,
): Promise<BookingChatResponse> {
  const { data } = await apiClient.post<BookingChatResponse>(
    API_ENDPOINTS.AI.BOOKING_CHAT,
    payload,
    { timeout: 60_000 },
  );
  return data;
}
