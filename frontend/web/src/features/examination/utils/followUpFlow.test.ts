import { describe, expect, it } from "vitest";

import {
	buildFollowUpAppointmentPayload,
	getFollowUpFormBlocker,
} from "./followUpFlow";

describe("doctor follow-up scheduling flow rules", () => {
	it("requires a complete encounter and appointment schedule", () => {
		expect(
			getFollowUpFormBlocker({
				sessionId: "",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				appointmentDate: "2026-06-15",
				appointmentTime: "09:00",
				durationMinutes: 30,
			}),
		).toBe("Session is not loaded.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				appointmentDate: "2026-06-15",
				appointmentTime: "09:00",
				durationMinutes: 30,
			}),
		).toBe("Session has no patient.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "",
				clinicId: "clinic-1",
				appointmentDate: "2026-06-15",
				appointmentTime: "09:00",
				durationMinutes: 30,
			}),
		).toBe("Session has no doctor.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "",
				appointmentDate: "2026-06-15",
				appointmentTime: "09:00",
				durationMinutes: 30,
			}),
		).toBe("Session has no clinic.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				appointmentDate: "",
				appointmentTime: "09:00",
				durationMinutes: 30,
			}),
		).toBe("Follow-up date is required.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				appointmentDate: "2026-06-15",
				appointmentTime: "",
				durationMinutes: 30,
			}),
		).toBe("Follow-up time is required.");
		expect(
			getFollowUpFormBlocker({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				appointmentDate: "2026-06-15",
				appointmentTime: "09:00",
				durationMinutes: 0,
			}),
		).toBe("Duration must be at least 5 minutes.");
	});

	it("builds a linked follow-up appointment payload", () => {
		expect(
			buildFollowUpAppointmentPayload({
				sessionId: "session-1",
				patientId: "patient-1",
				doctorId: "doctor-1",
				clinicId: "clinic-1",
				actorId: "user-1",
				treatmentPlanId: "plan-1",
				form: {
					appointment_date: "2026-06-15",
					appointment_time: "09:00",
					duration_minutes: 30,
					notes: "Review healing",
				},
			}),
		).toEqual({
			patient_id: "patient-1",
			doctor_id: "doctor-1",
			clinic_id: "clinic-1",
			appointment_date: "2026-06-15",
			appointment_time: "09:00",
			duration_minutes: 30,
			appointment_type: "follow_up",
			session_id: "session-1",
			treatment_plan_id: "plan-1",
			created_by: "user-1",
			notes: "Review healing",
		});
	});
});
