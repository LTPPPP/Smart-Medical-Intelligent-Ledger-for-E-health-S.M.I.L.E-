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
