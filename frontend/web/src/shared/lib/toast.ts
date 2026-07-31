import type { AxiosError } from "axios";
import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";
import { readCorrelationId } from "./request-id";

interface ApiErrorData {
	message?: unknown;
	error?: unknown;
	errors?: Record<string, string | string[]>;
	statusCode?: number;
	correlationId?: string;
}

interface ApiErrorMetadataOptions {
	operation: string;
}

export interface ApiErrorMetadata {
	operation: string;
	status?: number;
	code?: string;
	method?: string;
	path?: string;
	message?: string;
	correlationId?: string;
}

const PUBLIC_ERROR_MESSAGES: Record<string, string> = {
	notFound: "The requested account could not be found.",
	incorrectPassword: "Incorrect password.",
	emailAlreadyExists: "An account with this email already exists.",
	usernameAlreadyExists: "This username is already in use.",
	phoneAlreadyExists: "An account with this phone number already exists.",
	emailNotExists: "No account found for this email.",
	invalidHash: "This link is invalid or has expired.",
	accountNotFound: "The requested account could not be found.",
	missingOldPassword: "Enter your current password.",
	incorrectOldPassword: "The current password is incorrect.",
	accountIsINACTIVE: "This account is inactive. Contact an administrator.",
	accountIsLOCKED: "This account is locked. Contact an administrator.",
	accountIsSUSPENDED: "This account is suspended. Contact an administrator.",
};

const STATUS_MESSAGES: Record<number, string> = {
	400: "Invalid request. Check the entered information and try again.",
	401: "Your session has expired. Please sign in again.",
	403: "You don't have permission to perform this action.",
	404: "The requested data could not be found.",
	409: "This change conflicts with existing data.",
	422: "Some information is invalid. Check the form and try again.",
	500: "The server encountered an error. Please try again later.",
	503: "The service is temporarily unavailable. Please try again later.",
};

function firstErrorEntry(data?: ApiErrorData) {
	if (!data?.errors) return undefined;

	for (const [field, value] of Object.entries(data.errors)) {
		const code = Array.isArray(value) ? value[0] : value;
		if (typeof code === "string") return { field, code };
	}

	return undefined;
}

function publicMessageFor(data?: ApiErrorData): string | undefined {
	const entry = firstErrorEntry(data);
	if (!entry) return undefined;
	if (entry.field === "email" && entry.code === "notFound") {
		return "No account found for this email.";
	}
	return PUBLIC_ERROR_MESSAGES[entry.code];
}

function safeErrorCode(data?: ApiErrorData): string | undefined {
	const code = firstErrorEntry(data)?.code;
	return code && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(code) ? code : undefined;
}

function sanitizePath(url?: string): string | undefined {
	if (!url) return undefined;
	try {
		return new URL(url, "http://smile.local").pathname
			.replace(
				/\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
				"/:id",
			)
			.replace(/\/\d+(?=\/|$)/g, "/:id");
	} catch {
		return undefined;
	}
}

export function extractApiError(
	error: unknown,
	fallback = "An error occurred",
): string {
	if (!error) return fallback;

	const axiosErr = error as AxiosError<ApiErrorData>;
	if (axiosErr.isAxiosError) {
		const data = axiosErr.response?.data;
		const publicMessage = publicMessageFor(data);
		if (publicMessage) return publicMessage;

		const status = axiosErr.response?.status;
		if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
		if (!axiosErr.response) {
			return "Cannot connect to the server. Check your connection and try again.";
		}
	}

	const statusCode = (error as ApiErrorData | undefined)?.statusCode;
	if (typeof statusCode === "number" && STATUS_MESSAGES[statusCode]) {
		return STATUS_MESSAGES[statusCode];
	}

	return fallback;
}

export function getApiErrorMetadata(
	error: unknown,
	options: ApiErrorMetadataOptions,
): ApiErrorMetadata {
	const metadata: ApiErrorMetadata = { operation: options.operation };
	const axiosErr = error as AxiosError<ApiErrorData>;

	if (!axiosErr?.isAxiosError) {
		const statusCode = (error as ApiErrorData | undefined)?.statusCode;
		const correlationId = readCorrelationId(
			(error as ApiErrorData | undefined)?.correlationId,
		);
		if (typeof statusCode === "number") {
			metadata.status = statusCode;
			metadata.message = extractApiError(error);
		}
		if (correlationId) metadata.correlationId = correlationId;
		return metadata;
	}

	const status = axiosErr.response?.status;
	const code = safeErrorCode(axiosErr.response?.data);
	const method = axiosErr.config?.method?.toUpperCase();
	const path = sanitizePath(axiosErr.config?.url);
	const responseHeaders = axiosErr.response?.headers;
	const requestCorrelationId = (
		axiosErr.config as { correlationId?: string } | undefined
	)?.correlationId;
	const correlationId =
		readCorrelationId(responseHeaders) ??
		readCorrelationId(axiosErr.response?.data?.correlationId) ??
		readCorrelationId(axiosErr.config?.headers) ??
		readCorrelationId(requestCorrelationId);

	if (status !== undefined) metadata.status = status;
	if (code) metadata.code = code;
	if (method) metadata.method = method;
	if (path) metadata.path = path;
	if (status !== undefined) metadata.message = extractApiError(error);
	if (correlationId) metadata.correlationId = correlationId;

	return metadata;
}

export function logApiError(error: unknown, operation: string): void {
	if (typeof console === "undefined" || typeof console.error !== "function")
		return;
	console.error("[api-error]", getApiErrorMetadata(error, { operation }));
}

export const toast = {
	success: (message: string, options?: ExternalToast) =>
		sonnerToast.success(message, options),

	error: (message: string, options?: ExternalToast) =>
		sonnerToast.error(message, options),

	warning: (message: string, options?: ExternalToast) =>
		sonnerToast.warning(message, options),

	info: (message: string, options?: ExternalToast) =>
		sonnerToast.info(message, options),

	/** Use in mutation onError — automatically extracts server error message */
	apiError: (error: unknown, fallback?: string) => {
		logApiError(error, fallback ?? "API request");
		const message = extractApiError(error, fallback);
		return sonnerToast.error(message);
	},

	promise: sonnerToast.promise,
	loading: sonnerToast.loading,
	dismiss: sonnerToast.dismiss,
};
