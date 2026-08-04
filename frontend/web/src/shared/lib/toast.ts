import type { AxiosError } from "axios";
import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";
import { readCorrelationId } from "./request-id";

import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	type Locale,
} from "@/features/i18n/config";

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

/** Read Locale Cookie */
function currentLocale(): Locale {
	if (typeof document === "undefined") return DEFAULT_LOCALE;
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`),
	);
	return match?.[1] === "en" ? "en" : "vi";
}

const PUBLIC_ERROR_MESSAGES: Record<string, Record<Locale, string>> = {
	notFound: {
		en: "The requested account could not be found.",
		vi: "Không tìm thấy tài khoản này.",
	},
	incorrectPassword: {
		en: "Incorrect password.",
		vi: "Mật khẩu không đúng.",
	},
	emailAlreadyExists: {
		en: "An account with this email already exists.",
		vi: "Email này đã được đăng ký.",
	},
	usernameAlreadyExists: {
		en: "This username is already in use.",
		vi: "Tên đăng nhập này đã được sử dụng.",
	},
	phoneAlreadyExists: {
		en: "An account with this phone number already exists.",
		vi: "Số điện thoại này đã được đăng ký.",
	},
	emailNotExists: {
		en: "No account found for this email.",
		vi: "Không tìm thấy tài khoản với email này.",
	},
	invalidHash: {
		en: "This link is invalid or has expired.",
		vi: "Liên kết không hợp lệ hoặc đã hết hạn.",
	},
	accountNotFound: {
		en: "The requested account could not be found.",
		vi: "Không tìm thấy tài khoản này.",
	},
	missingOldPassword: {
		en: "Enter your current password.",
		vi: "Vui lòng nhập mật khẩu hiện tại.",
	},
	incorrectOldPassword: {
		en: "The current password is incorrect.",
		vi: "Mật khẩu hiện tại không đúng.",
	},
	accountIsINACTIVE: {
		en: "This account is inactive. Contact an administrator.",
		vi: "Tài khoản này chưa được kích hoạt. Vui lòng liên hệ quản trị viên.",
	},
	accountIsLOCKED: {
		en: "This account is locked. Contact an administrator.",
		vi: "Tài khoản này đã bị khoá. Vui lòng liên hệ quản trị viên.",
	},
	accountIsSUSPENDED: {
		en: "This account is suspended. Contact an administrator.",
		vi: "Tài khoản này đã bị đình chỉ. Vui lòng liên hệ quản trị viên.",
	},
	accountIsBanned: {
		en: "This account has been banned. Contact an administrator.",
		vi: "Tài khoản này đã bị cấm. Vui lòng liên hệ quản trị viên.",
	},
	otpCooldown: {
		en: "A code was already sent. Please wait a moment before requesting another.",
		vi: "Mã đã được gửi. Vui lòng đợi một chút trước khi yêu cầu mã mới.",
	},
	otpRateLimited: {
		en: "Too many requests. Please try again later.",
		vi: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.",
	},
	invalidOtp: {
		en: "This code is invalid or has expired.",
		vi: "Mã không hợp lệ hoặc đã hết hạn.",
	},
	tooManyAttempts: {
		en: "Too many incorrect attempts. Please request a new code.",
		vi: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
	},
};

const STATUS_MESSAGES: Record<number, Record<Locale, string>> = {
	400: {
		en: "Invalid request. Check the entered information and try again.",
		vi: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.",
	},
	401: {
		en: "Your session has expired. Please sign in again.",
		vi: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
	},
	403: {
		en: "You don't have permission to perform this action.",
		vi: "Bạn không có quyền thực hiện thao tác này.",
	},
	404: {
		en: "The requested data could not be found.",
		vi: "Không tìm thấy dữ liệu yêu cầu.",
	},
	409: {
		en: "This change conflicts with existing data.",
		vi: "Thao tác này bị trùng với dữ liệu đã có.",
	},
	422: {
		en: "Some information is invalid. Check the form and try again.",
		vi: "Một số thông tin không hợp lệ. Vui lòng kiểm tra lại biểu mẫu.",
	},
	500: {
		en: "The server encountered an error. Please try again later.",
		vi: "Máy chủ gặp sự cố. Vui lòng thử lại sau.",
	},
	503: {
		en: "The service is temporarily unavailable. Please try again later.",
		vi: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
	},
};

/** Known Message Patterns */
const KNOWN_MESSAGE_PATTERNS: {
	pattern: RegExp;
	message: Record<Locale, string>;
}[] = [
	{
		pattern: /appointment that overlaps (the requested|this) time slot/i,
		message: {
			en: "This time slot has just been booked by someone else. Please choose another time.",
			vi: "Khung giờ này vừa được đặt trước. Vui lòng chọn giờ khác.",
		},
	},
	{
		pattern: /already have an appointment booked for this day/i,
		message: {
			en: "You already have an appointment booked for this day.",
			vi: "Bạn đã có một lịch hẹn trong ngày này rồi.",
		},
	},
	{
		pattern: /specialty named .* already exists/i,
		message: {
			en: "A specialty with this name already exists.",
			vi: "Tên chuyên khoa này đã tồn tại.",
		},
	},
	{
		pattern: /blocked from booking new appointments/i,
		message: {
			en: "This patient is blocked from booking after a cancellation. An admin or manager must clear the block first.",
			vi: "Bệnh nhân này đang bị chặn đặt lịch do đã hủy một lịch hẹn trước đó. Cần quản trị viên/quản lý gỡ chặn trước.",
		},
	},
	// Booking Availability — Business Constraints, Not Malformed Input.
	{
		pattern: /No scheduled doctors found for specialty .* at clinic/i,
		message: {
			en: "No doctor of this specialty is scheduled at this clinic on the selected date. Please choose a different date or clinic.",
			vi: "Không có bác sĩ chuyên khoa này được lên lịch ở phòng khám vào ngày đã chọn. Vui lòng chọn ngày hoặc phòng khám khác.",
		},
	},
	{
		pattern: /No scheduled doctors found at clinic/i,
		message: {
			en: "No doctor is scheduled at this clinic on the selected date. Please choose a different date or clinic.",
			vi: "Không có bác sĩ nào được lên lịch ở phòng khám này vào ngày đã chọn. Vui lòng chọn ngày hoặc phòng khám khác.",
		},
	},
	{
		pattern: /No doctors for specialty .* are affiliated with clinic/i,
		message: {
			en: "No doctor of this specialty works at the selected clinic.",
			vi: "Không có bác sĩ chuyên khoa này làm việc tại phòng khám đã chọn.",
		},
	},
	{
		pattern: /No doctors found for specialty/i,
		message: {
			en: "No doctor is registered for this specialty yet.",
			vi: "Chưa có bác sĩ nào thuộc chuyên khoa này.",
		},
	},
	{
		pattern: /has no scheduled availability at clinic/i,
		message: {
			en: "This doctor has no available slot at this clinic on the selected date.",
			vi: "Bác sĩ này không có ca trống tại phòng khám vào ngày đã chọn.",
		},
	},
	{
		pattern: /is not scheduled at this clinic on/i,
		message: {
			en: "This doctor isn't scheduled at this clinic on the selected date.",
			vi: "Bác sĩ này không có lịch làm việc tại phòng khám vào ngày đã chọn.",
		},
	},
	{
		pattern: /Treatment room ".*" is not available/i,
		message: {
			en: "The selected treatment room isn't available right now.",
			vi: "Phòng điều trị đã chọn hiện không sẵn sàng.",
		},
	},
	{
		pattern: /^Service .* is not available/i,
		message: {
			en: "The selected service isn't available.",
			vi: "Dịch vụ đã chọn hiện không khả dụng.",
		},
	},
	{
		pattern: /Finalized (medical records|examination sessions) cannot .*Create an amendment instead/i,
		message: {
			en: "This record has been finalized and can no longer be edited. Please pick a different (non-finalized) record.",
			vi: "Hồ sơ này đã được chốt (finalized) nên không thể chỉnh sửa thêm. Vui lòng chọn một hồ sơ khác chưa được chốt.",
		},
	},
];

function firstErrorEntry(data?: ApiErrorData) {
	if (!data?.errors) return undefined;

	for (const [field, value] of Object.entries(data.errors)) {
		const code = Array.isArray(value) ? value[0] : value;
		if (typeof code === "string") return { field, code };
	}

	return undefined;
}

function publicMessageFor(
	data: ApiErrorData | undefined,
	locale: Locale,
): string | undefined {
	const entry = firstErrorEntry(data);
	if (!entry) return undefined;
	if (entry.field === "email" && entry.code === "notFound") {
		return locale === "vi"
			? "Không tìm thấy tài khoản với email này."
			: "No account found for this email.";
	}
	return PUBLIC_ERROR_MESSAGES[entry.code]?.[locale];
}

function knownMessageFor(
	data: ApiErrorData | undefined,
	locale: Locale,
): string | undefined {
	const raw = Array.isArray(data?.message) ? data.message[0] : data?.message;
	if (typeof raw !== "string") return undefined;
	return KNOWN_MESSAGE_PATTERNS.find(({ pattern }) => pattern.test(raw))
		?.message[locale];
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
		const locale = currentLocale();
		const data = axiosErr.response?.data;
		const publicMessage = publicMessageFor(data, locale);
		if (publicMessage) return publicMessage;

		const knownMessage = knownMessageFor(data, locale);
		if (knownMessage) return knownMessage;

		const status = axiosErr.response?.status;
		if (status && STATUS_MESSAGES[status])
			return STATUS_MESSAGES[status][locale];
		if (!axiosErr.response) {
			return locale === "vi"
				? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
				: "Cannot connect to the server. Check your connection and try again.";
		}
	}

	const statusCode = (error as ApiErrorData | undefined)?.statusCode;
	if (typeof statusCode === "number" && STATUS_MESSAGES[statusCode]) {
		return STATUS_MESSAGES[statusCode][currentLocale()];
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
	// console.warn, not console.error — this fires on every handled API
	// error (403/422/...), and Next's dev overlay turns console.error into
	// a full-screen error even though the UI already shows a toast for it.
	if (typeof console === "undefined" || typeof console.warn !== "function")
		return;
	console.warn("[api-error]", getApiErrorMetadata(error, { operation }));
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

	/** Mutation Error Handler */
	apiError: (error: unknown, fallback?: string) => {
		logApiError(error, fallback ?? "API request");
		const message = extractApiError(error, fallback);
		return sonnerToast.error(message);
	},

	promise: sonnerToast.promise,
	loading: sonnerToast.loading,
	dismiss: sonnerToast.dismiss,
};
