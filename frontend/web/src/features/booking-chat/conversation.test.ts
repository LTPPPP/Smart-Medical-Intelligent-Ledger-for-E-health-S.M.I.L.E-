import { describe, expect, it } from "vitest";

import { createId, welcomeMessage } from "./conversation";

describe("booking chat conversation helpers", () => {
	it("creates unique, prefixed ids", () => {
		const a = createId("message");
		const b = createId("message");
		expect(a).not.toBe(b);
		expect(a.startsWith("message:")).toBe(true);
	});

	it("returns a welcome assistant message", () => {
		const message = welcomeMessage();
		expect(message.id).toBe("welcome");
		expect(message.role).toBe("assistant");
	});
});
