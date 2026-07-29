import { describe, expect, it } from "vitest";

import { requiresStaffKyc } from "./nav";

describe("requiresStaffKyc", () => {
	it.each(["ADMIN", "MANAGER", "DOCTOR", "RECEPTIONIST", "NURSE"])(
		"requires KYC for the supported %s staff role",
		(role) => {
			expect(requiresStaffKyc([role])).toBe(true);
			expect(requiresStaffKyc([`ROLE_${role}`])).toBe(true);
		},
	);

	it.each([
		undefined,
		[],
		["PATIENT"],
		["DENTIST"],
		["SUPER_ADMIN"],
		["CLINIC_ADMIN"],
	])("does not expose staff KYC for unsupported roles: %j", (roles) => {
		expect(requiresStaffKyc(roles)).toBe(false);
	});
});
