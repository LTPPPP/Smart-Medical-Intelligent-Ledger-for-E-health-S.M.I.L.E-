import { expect, test } from "vitest";

import {
	getAdditionalOcrFields,
	getTechnicalOcrPayload,
} from "../src/features/admin/utils/kycOcrPayload";

test("additional OCR fields excludes fields already presented in the review UI", () => {
	const payload = {
		provider: "scanocr-onnx-vietocr-fast",
		issueDate: "22/11/2021",
		expiryDate: "08/10/2029",
		placeOfOrigin: "QUOI AN",
		placeOfResidence: "AP NHAT",
		idNumber: "087204009012",
		rawText: "raw content",
		checks: [],
		front: { lines: [{ text: "large nested data" }] },
	};

	expect(getAdditionalOcrFields(payload)).toEqual([]);
});

test("technical OCR payload excludes values already presented to reviewers", () => {
	const payload = {
		provider: "scanocr-onnx-vietocr-fast",
		issueDate: "22/11/2021",
		idNumber: "087204009012",
		fullName: "TRAN DAI NHAN",
		dateOfBirth: "08/10/2004",
		rawText: "raw content",
		riskLevel: "LOW",
		riskReason: "No high-risk signal.",
		checks: [],
		front: { lines: [{ text: "front line" }] },
		back: { lines: [{ text: "back line" }] },
	};

	expect(getTechnicalOcrPayload(payload)).toEqual({
		front: { lines: [{ text: "front line" }] },
		back: { lines: [{ text: "back line" }] },
	});
});
