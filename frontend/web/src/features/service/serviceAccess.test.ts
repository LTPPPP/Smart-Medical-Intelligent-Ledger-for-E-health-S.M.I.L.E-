import { describe, expect, it } from "vitest";

import { canManageServices } from "./serviceAccess";

describe("canManageServices", () => {
	it.each([["ADMIN"], ["ROLE_ADMIN"], ["admin"]])(
		"allows an Admin role variant: %s",
		(...roles) => {
			expect(canManageServices(roles)).toBe(true);
		},
	);

	it.each([["MANAGER"], ["RECEPTIONIST"], ["DOCTOR"], ["PATIENT"], []])(
		"keeps service management Admin-only: %j",
		(...roles) => {
			expect(canManageServices(roles)).toBe(false);
		},
	);
});
