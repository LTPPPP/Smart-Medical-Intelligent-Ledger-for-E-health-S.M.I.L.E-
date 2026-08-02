import { afterEach, describe, expect, it } from "vitest";

import { extractApiError, getApiErrorMetadata } from "./toast";

const axiosError = (
	status: number | undefined,
	data?: Record<string, unknown>,
	message = "Request failed with internal transport details",
) => ({
	isAxiosError: true,
	message,
	config: {
		method: "post",
		url: "/api/v1/patients/123e4567-e89b-12d3-a456-426614174000?email=private@example.com",
		headers: { "x-correlation-id": "web-test-123" },
	},
	response:
		status === undefined
			? undefined
			: {
					status,
					data,
					headers: { "x-correlation-id": "gateway-test-456" },
				},
});

afterEach(() => {
	// Reset Locale Cookie
	document.cookie = "smile_locale=; path=/; max-age=0";
});

describe("extractApiError", () => {
	it.each([
		[
			{ errors: { email: "notFound" } },
			"Không tìm thấy tài khoản với email này.",
		],
		[
			{ errors: { password: ["incorrectPassword"] } },
			"Mật khẩu không đúng.",
		],
		[
			{ errors: { email: "emailAlreadyExists" } },
			"Email này đã được đăng ký.",
		],
		[
			{ errors: { username: "usernameAlreadyExists" } },
			"Tên đăng nhập này đã được sử dụng.",
		],
		[
			{ errors: { phone: "phoneAlreadyExists" } },
			"Số điện thoại này đã được đăng ký.",
		],
		[
			{ errors: { hash: "invalidHash" } },
			"Liên kết không hợp lệ hoặc đã hết hạn.",
		],
	])("maps a public IAM error code from %j (default vi locale)", (data, expected) => {
		expect(extractApiError(axiosError(422, data))).toBe(expected);
	});

	it("maps a public IAM error code in English when the locale cookie is en", () => {
		document.cookie = "smile_locale=en; path=/";
		expect(
			extractApiError(axiosError(422, { errors: { email: "notFound" } })),
		).toBe("No account found for this email.");
	});

	it.each([
		[400, "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập."],
		[401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."],
		[403, "Bạn không có quyền thực hiện thao tác này."],
		[404, "Không tìm thấy dữ liệu yêu cầu."],
		[409, "Thao tác này bị trùng với dữ liệu đã có."],
		[422, "Một số thông tin không hợp lệ. Vui lòng kiểm tra lại biểu mẫu."],
		[500, "Máy chủ gặp sự cố. Vui lòng thử lại sau."],
		[503, "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau."],
	])("uses safe copy for HTTP %i (default vi locale)", (status, expected) => {
		expect(
			extractApiError(
				axiosError(status, {
					message: "SQLSTATE 23505: private internal table detail",
					error: "secret implementation detail",
				}),
			),
		).toBe(expected);
	});

	it("uses safe copy for network and unknown runtime errors", () => {
		expect(extractApiError(axiosError(undefined))).toBe(
			"Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
		);
		expect(
			extractApiError(
				new Error("database password and stack trace"),
				"Unable to complete the request.",
			),
		).toBe("Unable to complete the request.");
		expect(extractApiError("private raw error")).toBe("An error occurred");
	});

	it("maps a known booking-conflict message to a specific 409 message before the generic fallback", () => {
		expect(
			extractApiError(
				axiosError(409, {
					message:
						"This doctor already has an appointment that overlaps the requested time slot.",
				}),
			),
		).toBe("Khung giờ này vừa được đặt trước. Vui lòng chọn giờ khác.");

		expect(
			extractApiError(
				axiosError(409, {
					message:
						"You already have an appointment booked for this day. Only one booking per day is allowed.",
				}),
			),
		).toBe("Bạn đã có một lịch hẹn trong ngày này rồi.");
	});
});

describe("getApiErrorMetadata", () => {
	it("keeps only sanitized diagnostics", () => {
		expect(
			getApiErrorMetadata(axiosError(422, { errors: { email: "notFound" } }), {
				operation: "Sign in",
			}),
		).toEqual({
			operation: "Sign in",
			status: 422,
			code: "notFound",
			method: "POST",
			path: "/api/v1/patients/:id",
			message: "Không tìm thấy tài khoản với email này.",
			correlationId: "gateway-test-456",
		});
	});

	it("prefers the server correlation ID and ignores unsafe values", () => {
		const error = axiosError(500, {
			correlationId: "bad value with spaces",
		});
		(
			error as { response: { headers: Record<string, string> } }
		).response.headers["x-correlation-id"] = "gateway-safe-789";

		expect(
			getApiErrorMetadata(error, { operation: "appointments list" }),
		).toMatchObject({
			status: 500,
			correlationId: "gateway-safe-789",
		});
	});
});
