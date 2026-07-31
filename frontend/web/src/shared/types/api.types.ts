// ============================================================
// API-related types: error handling, request/response
// ============================================================

/** Structured API error */
export interface ApiErrorResponse {
	statusCode: number;
	message: string;
	error?: string;
	details?: Record<string, string[]>;
	timestamp?: string;
	path?: string;
	correlationId?: string;
}

/** Custom API error class */
export class ApiError extends Error {
	statusCode: number;
	details?: Record<string, string[]>;
	correlationId?: string;

	constructor(response: ApiErrorResponse) {
		super(response.message);
		this.name = "ApiError";
		this.statusCode = response.statusCode;
		this.details = response.details;
		this.correlationId = response.correlationId;
	}
}

/** Auth tokens from login/refresh */
export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

/** Login request payload */
export interface LoginRequest {
	email: string;
	password: string;
}

/** Register request payload */
export interface RegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
}

/** Refresh token request */
export interface RefreshTokenRequest {
	refreshToken: string;
}

/** API health check response */
export interface HealthCheckResponse {
	status: "ok" | "error";
	timestamp: string;
	uptime: number;
}
