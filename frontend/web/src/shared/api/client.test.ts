import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

/**
 * The access token lives in memory and expires in 15 minutes, so a 401 must
 * transparently refresh and replay the request instead of ending the session.
 */
describe("apiClient 401 handling", () => {
	beforeEach(() => {
		useAuthStore.setState({
			user: null,
			accessToken: "expired-access",
			refreshToken: "valid-refresh",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		useAuthStore.setState({
			user: null,
			accessToken: null,
			refreshToken: null,
		});
	});

	it("refreshes once for concurrent 401s and replays both requests", async () => {
		let refreshCalls = 0;
		let protectedCalls = 0;

		const adapter = vi.fn(async (config: Record<string, unknown>) => {
			const url = String(config.url ?? "");
			const auth = String(
				(config.headers as Record<string, string> | undefined)
					?.Authorization ?? "",
			);

			if (url.includes(API_ENDPOINTS.AUTH.REFRESH)) {
				refreshCalls += 1;
				return {
					data: {
						token: "fresh-access",
						refreshToken: "fresh-refresh",
						tokenExpires: Date.now() + 900_000,
					},
					status: 200,
					statusText: "OK",
					headers: {},
					config,
				};
			}

			protectedCalls += 1;
			if (auth !== "Bearer fresh-access") {
				const error = Object.assign(new Error("Unauthorized"), {
					isAxiosError: true,
					config,
					response: { status: 401, data: {}, headers: {}, config },
				});
				throw error;
			}
			return {
				data: { ok: true },
				status: 200,
				statusText: "OK",
				headers: {},
				config,
			};
		});

		apiClient.defaults.adapter = adapter as never;
		axios.defaults.adapter = adapter as never;

		const [first, second] = await Promise.all([
			apiClient.get("/v1/protected-a"),
			apiClient.get("/v1/protected-b"),
		]);

		expect(first.data).toEqual({ ok: true });
		expect(second.data).toEqual({ ok: true });
		expect(refreshCalls).toBe(1);
		// two initial 401s + two replays
		expect(protectedCalls).toBe(4);
		expect(useAuthStore.getState().accessToken).toBe("fresh-access");
		expect(useAuthStore.getState().refreshToken).toBe("fresh-refresh");
	});

	it("clears the session when there is no refresh token", async () => {
		useAuthStore.setState({ accessToken: "expired-access", refreshToken: null });

		const failing = (async (config: Record<string, unknown>) => {
			throw Object.assign(new Error("Unauthorized"), {
				isAxiosError: true,
				config,
				response: { status: 401, data: {}, headers: {}, config },
			});
		}) as never;
		apiClient.defaults.adapter = failing;
		axios.defaults.adapter = failing;

		await expect(apiClient.get("/v1/protected")).rejects.toBeDefined();
		expect(useAuthStore.getState().accessToken).toBeNull();
	});
});
