import axios, {
	AxiosInstance,
	type AxiosRequestConfig,
	InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/features/auth/store/authStore";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { ROUTES } from "@/shared/constants/routes";
import { createCorrelationId } from "@/shared/lib/request-id";
import { logApiError } from "@/shared/lib/toast";

export const apiClient: AxiosInstance = axios.create({
	headers: { "Content-Type": "application/json" },
	withCredentials: false,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// GET: token from Zustand store
		const { accessToken } = useAuthStore.getState();

		if (config.headers) {
			const correlationId = createCorrelationId();
			config.headers["X-Correlation-ID"] = correlationId;
			(
				config as InternalAxiosRequestConfig & { correlationId?: string }
			).correlationId = correlationId;
			if (accessToken) {
				config.headers.Authorization = `Bearer ${accessToken}`;
			}
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// ─── 401 → refresh → retry ───────────────────────────────────
// Access tokens are short-lived (15m) and held in memory only, so a 401 is a
// routine event, not a session failure. Concurrent requests share one refresh:
// the first triggers it, the rest queue and replay with the new token.
type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(url: string | undefined): boolean {
	if (!url) return false;
	return (
		url.includes(API_ENDPOINTS.AUTH.REFRESH) ||
		url.includes(API_ENDPOINTS.AUTH.LOGIN)
	);
}

async function refreshAccessToken(): Promise<string> {
	const { refreshToken, setTokens } = useAuthStore.getState();
	if (!refreshToken) {
		throw new Error("No refresh token available");
	}

	// A bare axios call so this request never re-enters the interceptors.
	const { data } = await axios.post<{
		token: string;
		refreshToken: string;
		tokenExpires: number;
	}>(API_ENDPOINTS.AUTH.REFRESH, undefined, {
		timeout: apiClient.defaults.timeout,
		headers: { Authorization: `Bearer ${refreshToken}` },
	});

	setTokens({ accessToken: data.token, refreshToken: data.refreshToken });
	return data.token;
}

function endSession() {
	useAuthStore.getState().logout();
	if (typeof window !== "undefined") window.location.href = ROUTES.LOGIN;
}

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config as RetriableConfig | undefined;

		if (error.response?.status !== 401) {
			logApiError(error, "API request");
			return Promise.reject(error);
		}

		if (
			!originalRequest ||
			originalRequest._retry ||
			isAuthEndpoint(originalRequest.url)
		) {
			return Promise.reject(error);
		}

		if (!useAuthStore.getState().refreshToken) {
			endSession();
			return Promise.reject(error);
		}

		originalRequest._retry = true;
		refreshPromise ??= refreshAccessToken().finally(() => {
			refreshPromise = null;
		});

		try {
			const token = await refreshPromise;
			originalRequest.headers = {
				...originalRequest.headers,
				Authorization: `Bearer ${token}`,
			};
			return apiClient(originalRequest);
		} catch (refreshError) {
			endSession();
			return Promise.reject(refreshError);
		}
	},
);
