import { describe, expect, it } from "vitest";

import { GENDER } from "@/shared/constants/common";
import { FIELD_LIMITS } from "@/shared/constants/field-limits";

import {
	collectErrors,
	patientFormSchema,
	registerFormSchema,
	roomFormSchema,
} from "./validators";

const validPatient = {
	full_name: "Nguyễn Văn An",
	date_of_birth: "1990-04-12",
	gender: GENDER.MALE,
	phone: "0901000001",
	email: "",
	address: "",
	insurance_number: "",
	insurance_provider: "",
	emergency_contact_name: "",
	emergency_contact_phone: "",
	emergency_contact_relationship: "",
	allergies_raw: "",
};

describe("patientFormSchema", () => {
	it("accepts a valid patient", () => {
		expect(collectErrors(patientFormSchema, validPatient)).toEqual({});
	});

	it("rejects a full_name longer than the column width", () => {
		const errs = collectErrors(patientFormSchema, {
			...validPatient,
			full_name: "a".repeat(FIELD_LIMITS.fullName + 1),
		});
		expect(errs.full_name).toMatch(/cannot exceed 255/);
	});

	it("rejects a phone longer than the column width", () => {
		const errs = collectErrors(patientFormSchema, {
			...validPatient,
			phone: "0".repeat(FIELD_LIMITS.phone + 1),
		});
		expect(errs.phone).toBeDefined();
	});

	it("rejects a gender code outside ISO 5218 0/1/2", () => {
		expect(
			collectErrors(patientFormSchema, { ...validPatient, gender: 7 }).gender,
		).toBe("Select a valid gender");
	});

	it("accepts gender 0, which is falsy but valid", () => {
		expect(
			collectErrors(patientFormSchema, {
				...validPatient,
				gender: GENDER.UNKNOWN,
			}),
		).toEqual({});
	});

	it("requires the fields the API requires", () => {
		const errs = collectErrors(patientFormSchema, {
			...validPatient,
			full_name: "",
			phone: "",
			date_of_birth: "",
		});
		expect(Object.keys(errs).sort()).toEqual([
			"date_of_birth",
			"full_name",
			"phone",
		]);
	});
});

describe("registerFormSchema", () => {
	const valid = {
		firstName: "Nguyen",
		lastName: "An",
		username: "nguyen_an",
		email: "an@example.com",
		phone: "",
		gender: GENDER.MALE,
		password: "Passw0rd!",
		confirmPassword: "Passw0rd!",
	};

	it("accepts a valid registration", () => {
		expect(collectErrors(registerFormSchema, valid)).toEqual({});
	});

	it("rejects mismatched passwords", () => {
		expect(
			collectErrors(registerFormSchema, {
				...valid,
				confirmPassword: "other1!",
			}).confirmPassword,
		).toBe("Passwords do not match");
	});

	it("rejects a password beyond bcrypt's 72-byte limit", () => {
		const errs = collectErrors(registerFormSchema, {
			...valid,
			password: "A1!".repeat(30),
			confirmPassword: "A1!".repeat(30),
		});
		expect(errs.password).toMatch(/cannot exceed 72/);
	});

	it("rejects a username the column cannot hold", () => {
		expect(
			collectErrors(registerFormSchema, {
				...valid,
				username: "a".repeat(FIELD_LIMITS.username + 1),
			}).username,
		).toMatch(/cannot exceed 50/);
	});
});

describe("roomFormSchema", () => {
	const valid = {
		room_name: "Examination Room 1",
		room_code: "PK-01",
		room_type: "examination",
		status: "AVAILABLE",
		floor_number: 1,
		capacity: 1,
	};

	it("accepts a valid room", () => {
		expect(collectErrors(roomFormSchema, valid)).toEqual({});
	});

	it("rejects a room_type outside the Postgres clinic_room_type enum", () => {
		// Rejected Room Types
		for (const room_type of ["xray", "consultation"]) {
			expect(
				collectErrors(roomFormSchema, { ...valid, room_type }).room_type,
			).toBeDefined();
		}
	});

	it("accepts every value the enum does define", () => {
		for (const room_type of ["examination", "surgery", "imaging"]) {
			expect(collectErrors(roomFormSchema, { ...valid, room_type })).toEqual(
				{},
			);
		}
	});
});
