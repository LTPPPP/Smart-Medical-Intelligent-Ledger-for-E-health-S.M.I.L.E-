import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import { examinationApi } from "./examination";

vi.mock("@/shared/api/client", () => ({
	apiClient: {
		delete: vi.fn(),
		get: vi.fn(),
		patch: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
	},
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPatch = vi.mocked(apiClient.patch);

describe("examination prescription API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a prescription header, adds medication items, then returns the session prescription", async () => {
		mockedPost
			.mockResolvedValueOnce({
				data: {
					prescription_id: "prescription-1",
					session_id: "session-1",
					patient_id: "patient-1",
					doctor_id: "doctor-1",
					status: "draft",
					created_at: "2026-07-03T01:00:00.000Z",
					updated_at: "2026-07-03T01:00:00.000Z",
				},
			})
			.mockResolvedValueOnce({ data: { item_id: "item-1" } });
		mockedGet.mockResolvedValueOnce({
			data: {
				prescription_id: "prescription-1",
				session_id: "session-1",
				patient_id: "patient-1",
				doctor_id: "doctor-1",
				status: "draft",
				created_at: "2026-07-03T01:00:00.000Z",
				updated_at: "2026-07-03T01:05:00.000Z",
				items: [
					{
						item_id: "item-1",
						medication_name: "Amoxicillin",
						dosage: "500 mg",
						route: "ORAL",
						frequency: "3 times/day",
						duration_days: 7,
						quantity: 21,
						instructions: "Take after meals.",
					},
				],
			},
		});

		const result = await examinationApi.createPrescription({
			sessionId: "session-1",
			patientId: "patient-1",
			notes: "Take after meals",
			items: [
				{
					medicationName: "Amoxicillin",
					dosage: "500 mg",
					route: "ORAL",
					frequency: "3 times/day",
					duration: "7 days",
					quantity: 21,
					instructions: "Take after meals.",
				},
			],
		});

		expect(mockedPost).toHaveBeenNthCalledWith(
			1,
			API_ENDPOINTS.PRESCRIPTION.CREATE,
			{
				session_id: "session-1",
				patient_id: "patient-1",
				notes: "Take after meals",
			},
		);
		expect(mockedPost).toHaveBeenNthCalledWith(
			2,
			`${API_ENDPOINTS.PRESCRIPTION.CREATE.replace(
				"/prescriptions",
				"/prescription-items",
			)}`,
			{
				prescription_id: "prescription-1",
				medication_name: "Amoxicillin",
				dosage: "500 mg",
				route: "ORAL",
				frequency: "3 times/day",
				duration_days: 7,
				quantity: 21,
				instructions: "Take after meals.",
			},
		);
		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.PRESCRIPTION.BY_SESSION("session-1"),
		);
		expect(result.data?.items[0]?.medicationName).toBe("Amoxicillin");
	});

	it("rejects invalid medication details before creating a prescription header", async () => {
		await expect(
			examinationApi.createPrescription({
				sessionId: "session-1",
				patientId: "patient-1",
				items: [
					{
						medicationName: "Paracetamol",
						dosage: "500 mg",
						route: "ORAL",
						frequency: "As needed",
						duration: "As needed",
						quantity: 10,
						instructions: "Take only when painful.",
					},
				],
			}),
		).rejects.toThrow("Duration must be a positive whole number.");

		expect(mockedPost).not.toHaveBeenCalled();
	});
});

describe("examination follow-up and amendment API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads patient clinical alert context for the examination workspace", async () => {
		mockedGet
			.mockResolvedValueOnce({
				data: {
					patient_id: "patient-1",
					allergies: ["Penicillin"],
					chronic_diseases: ["Diabetes"],
				},
			})
			.mockResolvedValueOnce({
				data: [
					{
						history_id: "history-1",
						condition_name: "Asthma",
						condition_type: "chronic",
					},
				],
			});

		const result = await examinationApi.getPatientClinicalContext("patient-1");

		expect(mockedGet).toHaveBeenNthCalledWith(
			1,
			API_ENDPOINTS.PATIENT.DETAIL("patient-1"),
		);
		expect(mockedGet).toHaveBeenNthCalledWith(
			2,
			API_ENDPOINTS.MEDICAL_HISTORY.BY_PATIENT("patient-1"),
		);
		expect(result.patient?.allergies).toEqual(["Penicillin"]);
		expect(result.medicalHistory[0]?.condition_name).toBe("Asthma");
	});

	it("queries linked follow-up recall appointments by session", async () => {
		mockedGet.mockResolvedValueOnce({
			data: {
				data: [{ appointment_id: "appointment-1", session_id: "session-1" }],
				total: 1,
			},
		});

		const result = await examinationApi.getFollowUpsBySession("session-1");

		expect(mockedGet).toHaveBeenCalledWith(API_ENDPOINTS.APPOINTMENT.LIST, {
			params: {
				session_id: "session-1",
				appointment_type: "follow_up",
				limit: 50,
			},
		});
		expect(result.data[0]?.appointment_id).toBe("appointment-1");
	});

	it("creates a follow-up recall linked to the encounter and treatment plan", async () => {
		mockedPost.mockResolvedValueOnce({
			data: {
				appointment_id: "appointment-1",
				session_id: "session-1",
				treatment_plan_id: "plan-1",
			},
		});

		await examinationApi.createFollowUp({
			sessionId: "session-1",
			patientId: "patient-1",
			doctorId: "doctor-1",
			clinicId: "clinic-1",
			actorId: "actor-1",
			treatmentPlanId: "plan-1",
			form: {
				appointment_date: "2026-07-10",
				appointment_time: "09:00",
				duration_minutes: 30,
				notes: " Review healing ",
			},
		});

		expect(mockedPost).toHaveBeenCalledWith(API_ENDPOINTS.APPOINTMENT.LIST, {
			patient_id: "patient-1",
			doctor_id: "doctor-1",
			clinic_id: "clinic-1",
			appointment_date: "2026-07-10",
			appointment_time: "09:00",
			duration_minutes: 30,
			appointment_type: "follow_up",
			session_id: "session-1",
			treatment_plan_id: "plan-1",
			created_by: "actor-1",
			notes: "Review healing",
		});
	});

	it("queries append-only amendments by session", async () => {
		mockedGet.mockResolvedValueOnce({
			data: [
				{
					amendment_id: "amendment-1",
					amendment_reason: "Correct typo",
					amendment_text: "Corrected tooth number.",
				},
			],
		});

		const result = await examinationApi.getAmendmentsBySession("session-1");

		expect(mockedGet).toHaveBeenCalledWith(
			`${API_ENDPOINTS.EXAMINATION.CREATE}/session-1/amendments`,
		);
		expect(result.data[0]?.amendment_id).toBe("amendment-1");
	});

	it("creates a trimmed append-only amendment for a finalized encounter", async () => {
		mockedPost.mockResolvedValueOnce({
			data: {
				amendment_id: "amendment-1",
				amendment_reason: "Correct typo",
				amendment_text: "Corrected tooth number.",
			},
		});

		await examinationApi.createAmendment("session-1", {
			amendment_reason: " Correct typo ",
			amendment_text: " Corrected tooth number. ",
			amended_by: "doctor-1",
		});

		expect(mockedPost).toHaveBeenCalledWith(
			`${API_ENDPOINTS.EXAMINATION.CREATE}/session-1/amendments`,
			{
				amendment_reason: "Correct typo",
				amendment_text: "Corrected tooth number.",
				amended_by: "doctor-1",
			},
		);
	});
});

describe("examination treatment plan API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("queries treatment plans by exact examination session", async () => {
		mockedGet.mockResolvedValueOnce({
			data: [
				{
					plan_id: "plan-1",
					session_id: "session-1",
					patient_id: "patient-1",
					status: "draft",
				},
			],
		});

		const result = await examinationApi.getTreatmentPlansBySession("session-1");

		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.TREATMENT_PLAN.BY_SESSION("session-1"),
		);
		expect(result.data[0]?.plan_id).toBe("plan-1");
	});
});

describe("examination representative and reminder API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads, creates, and updates legal representatives for the encounter patient", async () => {
		mockedGet.mockResolvedValueOnce({
			data: [
				{
					representative_id: "rep-1",
					patient_id: "patient-1",
					full_name: "Guardian One",
					relationship: "mother",
					phone: "0900000000",
					is_primary: true,
					authorized_for_treatment: true,
				},
			],
		});
		mockedPost.mockResolvedValueOnce({
			data: { representative_id: "rep-2", full_name: "Guardian Two" },
		});
		mockedPatch.mockResolvedValueOnce({
			data: {
				representative_id: "rep-1",
				full_name: "Guardian One Updated",
			},
		});
		mockedPost.mockResolvedValueOnce({
			data: {
				representative_id: "rep-1",
				verified_by: "11111111-1111-4111-8111-111111111111",
			},
		});

		const representatives =
			await examinationApi.getPatientRepresentatives("patient-1");
		await examinationApi.createPatientRepresentative({
			patient_id: "patient-1",
			full_name: " Guardian Two ",
			relationship: "father",
			phone: " 0911111111 ",
			is_primary: false,
			authorized_for_treatment: true,
			authorized_for_payment: false,
			authorized_for_records: true,
		});
		await examinationApi.updatePatientRepresentative("rep-1", {
			full_name: "Guardian One Updated",
			authorized_for_payment: true,
		});
		await examinationApi.verifyPatientRepresentative("rep-1");

		expect(mockedGet).toHaveBeenCalledWith(
			API_ENDPOINTS.PATIENT_REPRESENTATIVE.BY_PATIENT("patient-1"),
		);
		expect(representatives[0]?.full_name).toBe("Guardian One");
		expect(mockedPost).toHaveBeenCalledWith(
			API_ENDPOINTS.PATIENT_REPRESENTATIVE.CREATE,
			{
				patient_id: "patient-1",
				full_name: "Guardian Two",
				relationship: "father",
				phone: "0911111111",
				is_primary: false,
				authorized_for_treatment: true,
				authorized_for_payment: false,
				authorized_for_records: true,
			},
		);
		expect(mockedPatch).toHaveBeenCalledWith(
			API_ENDPOINTS.PATIENT_REPRESENTATIVE.UPDATE("rep-1"),
			{
				full_name: "Guardian One Updated",
				authorized_for_payment: true,
			},
		);
		expect(mockedPost).toHaveBeenNthCalledWith(
			2,
			API_ENDPOINTS.PATIENT_REPRESENTATIVE.VERIFY("rep-1"),
		);
	});

	it("omits verifier fields from legal representative payloads", async () => {
		mockedPost.mockResolvedValueOnce({
			data: { representative_id: "rep-2", full_name: "Guardian Two" },
		});

		await examinationApi.createPatientRepresentative({
			patient_id: "patient-1",
			full_name: "Guardian Two",
			relationship: "father",
			phone: "0911111111",
			verified_by: "doctor-1",
		});

		expect(mockedPost).toHaveBeenCalledWith(
			API_ENDPOINTS.PATIENT_REPRESENTATIVE.CREATE,
			{
				patient_id: "patient-1",
				full_name: "Guardian Two",
				relationship: "father",
				phone: "0911111111",
			},
		);
	});

	it("manages appointment reminder preference and notification lifecycle", async () => {
		mockedPatch
			.mockResolvedValueOnce({
				data: {
					patient_id: "patient-1",
					enabled: false,
					reminder_minutes_before: 720,
				},
			})
			.mockResolvedValueOnce({
				data: { log_id: "log-1", status: "read" },
			})
			.mockResolvedValueOnce({
				data: { log_id: "log-1", status: "responded" },
			});
		mockedPost
			.mockResolvedValueOnce({
				data: { log_id: "log-1", status: "skipped" },
			})
			.mockResolvedValueOnce({
				data: { log_id: "log-1", status: "sent", attempt_count: 2 },
			});
		mockedGet
			.mockResolvedValueOnce({
				data: {
					patient_id: "patient-1",
					enabled: false,
					reminder_minutes_before: 720,
				},
			})
			.mockResolvedValueOnce({
				data: [{ log_id: "log-1", status: "responded" }],
			});

		const preference =
			await examinationApi.getReminderPreference("appointment-1");
		await examinationApi.updateReminderPreference("appointment-1", {
			enabled: false,
			reminder_minutes_before: 720,
		});
		await examinationApi.sendAppointmentReminder("appointment-1");
		await examinationApi.retryAppointmentReminder("appointment-1");
		await examinationApi.markAppointmentReminderRead("appointment-1");
		await examinationApi.markAppointmentReminderResponded("appointment-1");
		const logs =
			await examinationApi.getAppointmentNotificationLogs("appointment-1");

		expect(mockedGet).toHaveBeenNthCalledWith(
			1,
			API_ENDPOINTS.APPOINTMENT.REMINDER_PREFERENCE("appointment-1"),
		);
		expect(mockedPatch).toHaveBeenNthCalledWith(
			1,
			API_ENDPOINTS.APPOINTMENT.REMINDER_PREFERENCE("appointment-1"),
			{
				enabled: false,
				reminder_minutes_before: 720,
			},
		);
		expect(mockedPost).toHaveBeenNthCalledWith(
			1,
			API_ENDPOINTS.APPOINTMENT.SEND_REMINDER("appointment-1"),
		);
		expect(mockedPost).toHaveBeenNthCalledWith(
			2,
			API_ENDPOINTS.APPOINTMENT.RETRY_REMINDER("appointment-1"),
		);
		expect(mockedPatch).toHaveBeenNthCalledWith(
			2,
			API_ENDPOINTS.APPOINTMENT.REMINDER_READ("appointment-1"),
		);
		expect(mockedPatch).toHaveBeenNthCalledWith(
			3,
			API_ENDPOINTS.APPOINTMENT.REMINDER_RESPONDED("appointment-1"),
		);
		expect(mockedGet).toHaveBeenNthCalledWith(
			2,
			API_ENDPOINTS.APPOINTMENT.NOTIFICATION_LOGS("appointment-1"),
		);
		expect(preference.enabled).toBe(false);
		expect(logs[0]?.status).toBe("responded");
	});
});
