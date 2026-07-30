import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { ENV } from "@/shared/constants/env";

import { serviceApi } from "./service.api";

vi.mock("@/shared/api/client", () => ({
	apiClient: {
		delete: vi.fn(),
		get: vi.fn(),
		patch: vi.fn(),
		post: vi.fn(),
	},
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);
const mockedPost = vi.mocked(apiClient.post);

const rawService = {
	service_id: "service-1",
	service_code: "EXAM-01",
	service_name: "General Dental Examination",
	category_id: null,
	specialty_id: "specialty-1",
	description: "Routine oral examination.",
	duration_minutes: 30,
	required_room_type: "examination",
	base_price: "200000.00",
	currency: "VND",
	is_active: true,
	requires_appointment: true,
	preparation_instructions: null,
	specialty: {
		specialty_id: "specialty-1",
		specialty_code: "GENERAL",
		specialty_name: "General Dentistry",
		description: null,
		icon_url: null,
		is_active: true,
		display_order: 1,
	},
	created_at: "2026-07-29T00:00:00.000Z",
	updated_at: "2026-07-29T00:00:00.000Z",
};

describe("serviceApi write contract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("maps a create request to the backend snake_case contract", async () => {
		mockedPost.mockResolvedValueOnce({ data: rawService });

		const result = await serviceApi.createService({
			serviceCode: "EXAM-01",
			serviceName: "General Dental Examination",
			categoryId: null,
			specialtyId: "specialty-1",
			description: "Routine oral examination.",
			durationMinutes: 30,
			requiredRoomType: "examination",
			basePrice: 200000,
			currency: "VND",
			requiresAppointment: true,
			preparationInstructions: null,
		});

		expect(mockedPost).toHaveBeenCalledWith(
			`${ENV.SERVICES.CLINICAL}/services`,
			{
				service_code: "EXAM-01",
				service_name: "General Dental Examination",
				category_id: null,
				specialty_id: "specialty-1",
				description: "Routine oral examination.",
				duration_minutes: 30,
				required_room_type: "examination",
				base_price: 200000,
				currency: "VND",
				requires_appointment: true,
				preparation_instructions: null,
			},
		);
		expect(result.requiredRoomType).toBe("examination");
		expect(result.basePrice).toBe(200000);
		expect(result.specialty?.specialtyName).toBe("General Dentistry");
	});

	it("uses PATCH and omits fields that were not supplied", async () => {
		mockedPatch.mockResolvedValueOnce({
			data: { ...rawService, service_name: "Updated Examination" },
		});

		const result = await serviceApi.updateService("service-1", {
			serviceName: "Updated Examination",
			requiredRoomType: "imaging",
			isActive: false,
		});

		expect(mockedPatch).toHaveBeenCalledWith(
			`${ENV.SERVICES.CLINICAL}/services/service-1`,
			{
				service_name: "Updated Examination",
				required_room_type: "imaging",
				is_active: false,
			},
		);
		expect(result.serviceName).toBe("Updated Examination");
	});

	it("maps room type from a service detail response", async () => {
		mockedGet.mockResolvedValueOnce({ data: rawService });

		const result = await serviceApi.getService("service-1");

		expect(result.requiredRoomType).toBe("examination");
	});
});
