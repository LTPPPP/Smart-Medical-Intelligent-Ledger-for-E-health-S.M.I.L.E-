import { describe, expect, it } from "vitest";

import { API_ENDPOINTS } from "./endpoint";

describe("API_ENDPOINTS", () => {
	it("builds the doctor worklist appointment endpoint", () => {
		expect(API_ENDPOINTS.APPOINTMENT.DOCTOR_WORKLIST("doctor-1")).toBe(
			"/api/v1/appointments/doctor/doctor-1/worklist",
		);
	});
});
