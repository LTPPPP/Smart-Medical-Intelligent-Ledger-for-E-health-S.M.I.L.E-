import { describe, expect, it } from "vitest";

import { ROUTES } from "@/shared/constants/routes";

import { getScheduleDestinationsForRoles } from "./scheduleAccess";

const hrefsFor = (roles: string[]) =>
	getScheduleDestinationsForRoles(roles).map((destination) => destination.href);

describe("schedule destination access", () => {
	it("shows Admin and Manager only the destinations they can open", () => {
		expect(hrefsFor(["ADMIN"])).toEqual([
			ROUTES.DOCTOR_SCHEDULES,
			ROUTES.WORK_SHIFTS,
			ROUTES.DOCTOR_LEAVES,
		]);
		expect(hrefsFor(["ROLE_MANAGER"])).toEqual([
			ROUTES.DOCTOR_SCHEDULES,
			ROUTES.WORK_SHIFTS,
			ROUTES.DOCTOR_LEAVES,
		]);
	});

	it("shows a Doctor work shifts, personal schedule, and leave", () => {
		expect(hrefsFor(["ROLE_DOCTOR"])).toEqual([
			ROUTES.WORK_SHIFTS,
			ROUTES.MY_SCHEDULE,
			ROUTES.DOCTOR_LEAVES,
		]);
	});

	it("does not expose inaccessible schedule links", () => {
		expect(hrefsFor(["RECEPTIONIST"])).toEqual([
			ROUTES.WORK_SHIFTS,
			ROUTES.DOCTOR_LEAVES,
		]);
		expect(hrefsFor(["NURSE"])).toEqual([]);
		expect(hrefsFor(["PATIENT"])).toEqual([]);
	});
});
