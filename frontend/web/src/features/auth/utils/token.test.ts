import { describe, expect, it, vi } from "vitest";

import { decodeJwt } from "./token";

describe("decodeJwt", () => {
	it("treats malformed tokens as expected control flow without noisy logging", () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(decodeJwt("header.not-base64.signature")).toBeNull();
		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
});
