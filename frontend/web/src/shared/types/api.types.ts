// API Types

/** Structured API Error */
export interface ApiErrorResponse {
	statusCode: number;
	message: string;
	error?: string;
	details?: Record<string, string[]>;
	timestamp?: string;
	path?: string;
	correlationId?: string;
}

/** Custom API Error */
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

/** Auth Tokens */
export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

/** Login Request Payload */
export interface LoginRequest {
	email: string;
	password: string;
}

/** Register Request Payload */
export interface RegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
}

/** Refresh Token Request */
export interface RefreshTokenRequest {
	refreshToken: string;
}

/** Health Check Response */
export interface HealthCheckResponse {
	status: "ok" | "error";
	timestamp: string;
	uptime: number;
}
