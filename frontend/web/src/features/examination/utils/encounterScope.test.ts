import { describe, expect, it } from "vitest";

import {
	filterByAppointmentScope,
	filterByEncounterScope,
} from "./encounterScope";

describe("encounter workspace scoping", () => {
	it("keeps only session-scoped resources for the active encounter", () => {
		const scoped = filterByEncounterScope(
			[
				{ id: "current", session_id: "session-1", record_id: "record-1" },
				{ id: "other-session", session_id: "session-2", record_id: "record-1" },
				{ id: "legacy-record", session_id: null, record_id: "record-1" },
				{ id: "other-record", session_id: null, record_id: "record-2" },
				{ id: "unscoped", session_id: null, record_id: null },
			],
			{ sessionId: "session-1", recordId: "record-1" },
		);

		expect(scoped.map((item) => item.id)).toEqual(["current", "legacy-record"]);
	});

	it("keeps diagnostic orders for the active appointment only", () => {
		const scoped = filterByAppointmentScope(
			[
				{ id: "current", appointment_id: "appointment-1" },
				{ id: "old", appointment_id: "appointment-2" },
				{ id: "missing", appointment_id: null },
			],
			"appointment-1",
		);

		expect(scoped.map((item) => item.id)).toEqual(["current"]);
	});
});
