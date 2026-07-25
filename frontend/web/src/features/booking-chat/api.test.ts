import { describe, expect, it } from "vitest";

import { API_ENDPOINTS } from "@/shared/api/endpoint";

describe("booking chat API endpoint", () => {
	it("routes requests through the gateway LangGraph proxy", () => {
		expect(API_ENDPOINTS.AI.BOOKING_CHAT).toBe(
			"http://localhost:8080/api/v1/ai/booking-chat/chat",
		);
	});
});
