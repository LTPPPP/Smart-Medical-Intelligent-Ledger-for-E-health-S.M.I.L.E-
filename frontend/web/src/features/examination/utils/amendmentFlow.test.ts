import { describe, expect, it } from "vitest";

import {
	buildExaminationAmendmentPayload,
	getAmendmentFormBlocker,
} from "./amendmentFlow";

describe("doctor finalized encounter amendment flow rules", () => {
	it("requires a finalized encounter and complete amendment details", () => {
		expect(
			getAmendmentFormBlocker({
				isFinalized: false,
				sessionId: "session-1",
				amendmentReason: "Correct typo",
				amendmentText: "Corrected tooth number.",
				amendedBy: "doctor-1",
			}),
		).toBe("Only finalized encounters can be amended.");
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "",
				amendmentReason: "Correct typo",
				amendmentText: "Corrected tooth number.",
				amendedBy: "doctor-1",
			}),
		).toBe("Session is not loaded.");
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "session-1",
				amendmentReason: "",
				amendmentText: "Corrected tooth number.",
				amendedBy: "doctor-1",
			}),
		).toBe("Amendment reason is required.");
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "session-1",
				amendmentReason: "Correct typo",
				amendmentText: "",
				amendedBy: "doctor-1",
			}),
		).toBe("Amendment note is required.");
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "session-1",
				amendmentReason: "Correct typo",
				amendmentText: "Corrected tooth number.",
				amendedBy: "",
			}),
		).toBe("Current user is required.");
	});

	it("requires meaningful amendment text after trimming", () => {
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "session-1",
				amendmentReason: " x ",
				amendmentText: "Corrected tooth number.",
				amendedBy: "doctor-1",
			}),
		).toBe("Amendment reason must be at least 3 characters.");
		expect(
			getAmendmentFormBlocker({
				isFinalized: true,
				sessionId: "session-1",
				amendmentReason: "Correct typo",
				amendmentText: " x ",
				amendedBy: "doctor-1",
			}),
		).toBe("Amendment note must be at least 3 characters.");
	});

	it("builds a trimmed amendment payload", () => {
		expect(
			buildExaminationAmendmentPayload({
				amendment_reason: " Correct typo ",
				amendment_text: " Corrected tooth number. ",
				amended_by: "doctor-1",
			}),
		).toEqual({
			amendment_reason: "Correct typo",
			amendment_text: "Corrected tooth number.",
			amended_by: "doctor-1",
		});
	});
});
