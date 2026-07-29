import { describe, expect, it } from "vitest";

import { hasAnyRole, normalizeRole } from "./roles";

describe("role normalization", () => {
	it.each([
		["ROLE_DOCTOR", "DOCTOR"],
		[" role_manager ", "MANAGER"],
		["Dentist", "DENTIST"],
	])("normalizes %s to %s", (input, expected) => {
		expect(normalizeRole(input)).toBe(expected);
	});

	it("matches prefixed backend roles against bare required roles", () => {
		expect(hasAnyRole(["ROLE_DOCTOR"], ["DOCTOR"])).toBe(true);
		expect(hasAnyRole(["PATIENT"], ["DOCTOR", "ADMIN"])).toBe(false);
	});
});
