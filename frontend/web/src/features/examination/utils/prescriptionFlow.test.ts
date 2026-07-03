import { describe, expect, it } from "vitest";

import {
  canCreatePrescription,
  canIssuePrescription,
  canModifyPrescriptionItems,
  mapBackendPrescription,
  normalizePrescriptionStatus,
  toPrescriptionItemPayload,
  validatePrescriptionItemForm,
} from "./prescriptionFlow";

describe("doctor prescription flow rules", () => {
  it("normalizes backend prescription statuses to lower-case workflow states", () => {
    expect(normalizePrescriptionStatus("DRAFT")).toBe("draft");
    expect(normalizePrescriptionStatus(" issued ")).toBe("issued");
    expect(normalizePrescriptionStatus(null)).toBe("draft");
  });

  it("allows creating prescriptions only while the encounter is mutable and has a patient", () => {
    expect(
      canCreatePrescription({ isFinalized: false, patientId: "patient-1" }),
    ).toBe(true);
    expect(
      canCreatePrescription({ isFinalized: true, patientId: "patient-1" }),
    ).toBe(false);
    expect(canCreatePrescription({ isFinalized: false, patientId: "" })).toBe(
      false,
    );
  });

  it("allows drug changes only on a selected draft prescription in a mutable encounter", () => {
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "draft",
      }),
    ).toBe(true);

    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "issued",
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "cancelled",
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: true,
        prescriptionId: "prescription-1",
        status: "draft",
      }),
    ).toBe(false);
    expect(
      canModifyPrescriptionItems({
        isFinalized: false,
        prescriptionId: null,
        status: "draft",
      }),
    ).toBe(false);
  });

  it("allows issuing only mutable draft prescriptions with at least one item", () => {
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "draft",
        itemCount: 1,
      }),
    ).toBe(true);
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "draft",
        itemCount: 0,
      }),
    ).toBe(false);
    expect(
      canIssuePrescription({
        isFinalized: false,
        prescriptionId: "prescription-1",
        status: "issued",
        itemCount: 1,
      }),
    ).toBe(false);
    expect(
      canIssuePrescription({
        isFinalized: true,
        prescriptionId: "prescription-1",
        status: "draft",
        itemCount: 1,
      }),
    ).toBe(false);
  });

  it("requires positive integer duration and quantity when prescription item fields are provided", () => {
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: 7,
        quantity: 21,
        instructions: "Take after meals.",
      }),
    ).toBeNull();
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: 0,
        quantity: 21,
        instructions: "Take after meals.",
      }),
    ).toBe("Duration must be a positive whole number.");
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: 7,
        quantity: -1,
        instructions: "Take after meals.",
      }),
    ).toBe("Quantity must be a positive whole number.");
  });

  it("requires complete legal dosing details before adding a medication item", () => {
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "",
        frequency: "3x/day",
        duration_days: 7,
        quantity: 21,
        instructions: "Take after meals.",
      }),
    ).toBe("Route is required.");
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: null,
        quantity: 21,
        instructions: "Take after meals.",
      }),
    ).toBe("Duration is required.");
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: 7,
        quantity: null,
        instructions: "Take after meals.",
      }),
    ).toBe("Quantity is required.");
    expect(
      validatePrescriptionItemForm({
        medication_name: "Amoxicillin",
        dosage: "500 mg",
        route: "oral",
        frequency: "3x/day",
        duration_days: 7,
        quantity: 21,
        instructions: "",
      }),
    ).toBe("Instructions are required.");
  });

  it("maps backend prescription entities to doctor workspace prescription fields", () => {
    expect(
      mapBackendPrescription({
        prescription_id: "prescription-1",
        session_id: "session-1",
        patient_id: "patient-1",
        doctor_id: "doctor-1",
        status: "draft",
        notes: "Take after meals",
        created_at: "2026-07-03T01:00:00.000Z",
        updated_at: "2026-07-03T01:05:00.000Z",
        items: [
          {
            item_id: "item-1",
            medication_name: "Amoxicillin",
            dosage: "500 mg",
            frequency: "3 times/day",
            duration_days: 7,
            route: "oral",
            quantity: 21,
            instructions: "Take after meals.",
          },
        ],
      }),
    ).toEqual({
      id: "prescription-1",
      sessionId: "session-1",
      patientId: "patient-1",
      doctorId: "doctor-1",
      prescriptionCode: "prescription-1",
      status: "DRAFT",
      notes: "Take after meals",
      createdAt: "2026-07-03T01:00:00.000Z",
      updatedAt: "2026-07-03T01:05:00.000Z",
      items: [
        {
          id: "item-1",
          medicationName: "Amoxicillin",
          dosage: "500 mg",
          frequency: "3 times/day",
          duration: "7 days",
          route: "ORAL",
          quantity: 21,
          instructions: "Take after meals.",
        },
      ],
    });
  });

  it("builds backend prescription item payloads from doctor form values", () => {
    expect(
      toPrescriptionItemPayload("prescription-1", {
        medicationName: "Amoxicillin",
        dosage: "500 mg",
        frequency: "3 times/day",
        duration: "7 days",
        route: "ORAL",
        quantity: 21,
        instructions: "Take after meals.",
      }),
    ).toEqual({
      prescription_id: "prescription-1",
      medication_name: "Amoxicillin",
      dosage: "500 mg",
      frequency: "3 times/day",
      duration_days: 7,
      route: "ORAL",
      quantity: 21,
      instructions: "Take after meals.",
    });
  });
});
