import { describe, expect, it } from "vitest";

import { mapMedicalRecordForPatient } from "./patient.api";

describe("patient medical record API mapper", () => {
	it("maps clinical backend record fields to patient UI fields", () => {
		const record = mapMedicalRecordForPatient({
			record_id: "11111111-1111-4111-8111-111111111111",
			patient_id: "22222222-2222-4222-8222-222222222222",
			visit_date: "2026-07-02",
			chief_complaint: "Tooth pain",
			diagnosis: "Pulpitis",
			treatment_plan: "Root canal treatment",
			notes: "Signed by doctor",
			record_status: "finalized",
			finalized_at: "2026-07-02T10:00:00.000Z",
			created_at: "2026-07-02T09:00:00.000Z",
			updated_at: "2026-07-02T10:00:00.000Z",
		});

		expect(record).toEqual(
			expect.objectContaining({
				id: "11111111-1111-4111-8111-111111111111",
				patientId: "22222222-2222-4222-8222-222222222222",
				treatment: "Root canal treatment",
				status: "FINALIZED",
				finalizedAt: "2026-07-02T10:00:00.000Z",
			}),
		);
	});
});
