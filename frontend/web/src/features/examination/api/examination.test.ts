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
