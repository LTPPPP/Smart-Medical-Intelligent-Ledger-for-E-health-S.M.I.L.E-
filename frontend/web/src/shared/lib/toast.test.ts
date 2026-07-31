import { describe, expect, it } from "vitest";

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

describe("extractApiError", () => {
	it.each([
		[{ errors: { email: "notFound" } }, "No account found for this email."],
		[{ errors: { password: ["incorrectPassword"] } }, "Incorrect password."],
		[
			{ errors: { email: "emailAlreadyExists" } },
			"An account with this email already exists.",
		],
		[
			{ errors: { username: "usernameAlreadyExists" } },
			"This username is already in use.",
		],
		[
			{ errors: { phone: "phoneAlreadyExists" } },
			"An account with this phone number already exists.",
		],
		[
			{ errors: { hash: "invalidHash" } },
			"This link is invalid or has expired.",
		],
	])("maps a public IAM error code from %j", (data, expected) => {
		expect(extractApiError(axiosError(422, data))).toBe(expected);
	});

	it.each([
		[400, "Invalid request. Check the entered information and try again."],
		[401, "Your session has expired. Please sign in again."],
		[403, "You don't have permission to perform this action."],
		[404, "The requested data could not be found."],
		[409, "This change conflicts with existing data."],
		[422, "Some information is invalid. Check the form and try again."],
		[500, "The server encountered an error. Please try again later."],
		[503, "The service is temporarily unavailable. Please try again later."],
	])("uses safe copy for HTTP %i", (status, expected) => {
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
			"Cannot connect to the server. Check your connection and try again.",
		);
		expect(
			extractApiError(
				new Error("database password and stack trace"),
				"Unable to complete the request.",
			),
		).toBe("Unable to complete the request.");
		expect(extractApiError("private raw error")).toBe("An error occurred");
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
			message: "No account found for this email.",
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
