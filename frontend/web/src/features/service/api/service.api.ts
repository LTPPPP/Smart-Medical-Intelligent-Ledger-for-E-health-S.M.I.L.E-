import { apiClient } from "@/shared/api/client";
import { ENV } from "@/shared/constants/env";

import type {
	Service,
	Specialty,
	CreateServiceRequest,
	ServiceListParams,
	ServiceListResponse,
	SpecialtyListParams,
	UpdateServiceRequest,
} from "../types/service.type";

const BASE = ENV.SERVICES.CLINICAL;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNullableNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function mapCategory(raw: unknown): Service["category"] {
	if (!isRecord(raw)) return null;
	return {
		categoryId: (raw.category_id ?? raw.categoryId) as string,
		categoryName: (raw.category_name ?? raw.categoryName ?? "") as string,
	};
}

// Snake To Camel
function mapService(raw: Record<string, unknown>): Service {
	return {
		serviceId: (raw.service_id ?? raw.serviceId) as string,
		serviceCode: (raw.service_code ?? raw.serviceCode ?? "") as string,
		serviceName: (raw.service_name ?? raw.serviceName ?? "") as string,
		categoryId: (raw.category_id ?? raw.categoryId ?? null) as string | null,
		specialtyId: (raw.specialty_id ?? raw.specialtyId ?? null) as string | null,
		description: (raw.description ?? null) as string | null,
		durationMinutes:
			toNullableNumber(raw.duration_minutes ?? raw.durationMinutes) ?? 30,
		requiredRoomType: (raw.required_room_type ??
			raw.requiredRoomType ??
			"examination") as Service["requiredRoomType"],
		basePrice: toNullableNumber(raw.base_price ?? raw.basePrice),
		currency: (raw.currency ?? "VND") as string,
		isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
		requiresAppointment: (raw.requires_appointment ??
			raw.requiresAppointment ??
			true) as boolean,
		preparationInstructions: (raw.preparation_instructions ??
			raw.preparationInstructions ??
			null) as string | null,
		category: mapCategory(raw.category),
		specialty: isRecord(raw.specialty) ? mapSpecialty(raw.specialty) : null,
		createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
		updatedAt: (raw.updated_at ?? raw.updatedAt ?? "") as string,
	};
}

type ServiceWriteRequest = Partial<CreateServiceRequest> & {
	isActive?: boolean;
};

function mapServiceRequest(
	request: ServiceWriteRequest,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	const fields = [
		["serviceCode", "service_code"],
		["serviceName", "service_name"],
		["categoryId", "category_id"],
		["specialtyId", "specialty_id"],
		["description", "description"],
		["durationMinutes", "duration_minutes"],
		["requiredRoomType", "required_room_type"],
		["basePrice", "base_price"],
		["currency", "currency"],
		["isActive", "is_active"],
		["requiresAppointment", "requires_appointment"],
		["preparationInstructions", "preparation_instructions"],
	] as const;

	for (const [frontendKey, backendKey] of fields) {
		const value = request[frontendKey];
		if (value !== undefined) payload[backendKey] = value;
	}

	return payload;
}

function mapSpecialty(raw: Record<string, unknown>): Specialty {
	return {
		specialtyId: (raw.specialty_id ?? raw.specialtyId) as string,
		specialtyCode: (raw.specialty_code ?? raw.specialtyCode ?? "") as string,
		specialtyName: (raw.specialty_name ?? raw.specialtyName ?? "") as string,
		description: (raw.description ?? null) as string | null,
		iconUrl: (raw.icon_url ?? raw.iconUrl ?? null) as string | null,
		isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
		displayOrder: (raw.display_order ?? raw.displayOrder ?? null) as
			| number
			| null,
	};
}

export const serviceApi = {
	getServices: async (
		params: ServiceListParams = {},
	): Promise<ServiceListResponse> => {
		const { page = 0, size, limit, specialtyId, isActive, ...rest } = params;
		const query: Record<string, unknown> = {
			page: page + 1, // BE 1-Indexed
			limit: size ?? limit ?? 12,
			...rest,
		};
		if (specialtyId) query.specialty_id = specialtyId;
		if (isActive !== undefined) query.is_active = isActive;

		const { data } = await apiClient.get<{
			data: Record<string, unknown>[];
			meta: { total: number; page: number; limit: number };
		}>(`${BASE}/services`, { params: query });
		const pageSize = data.meta?.limit ?? 12;
		const total = data.meta?.total ?? 0;
		return {
			content: (data.data ?? []).map(mapService),
			totalPages: Math.ceil(total / pageSize),
			totalElements: total,
		};
	},

	getService: async (id: string): Promise<Service> => {
		const { data } = await apiClient.get<Record<string, unknown>>(
			`${BASE}/services/${id}`,
		);
		return mapService(data);
	},

	createService: async (request: CreateServiceRequest): Promise<Service> => {
		const { data } = await apiClient.post<Record<string, unknown>>(
			`${BASE}/services`,
			mapServiceRequest(request),
		);
		return mapService(data);
	},

	updateService: async (
		id: string,
		request: UpdateServiceRequest,
	): Promise<Service> => {
		const { data } = await apiClient.patch<Record<string, unknown>>(
			`${BASE}/services/${id}`,
			mapServiceRequest(request),
		);
		return mapService(data);
	},

	deleteService: async (id: string): Promise<void> => {
		await apiClient.delete(`${BASE}/services/${id}`);
	},

	getSpecialties: async (
		params: SpecialtyListParams = {},
	): Promise<Specialty[]> => {
		const query: Record<string, unknown> = { limit: 100 };
		if (params.isActive !== undefined) query.is_active = params.isActive;
		const { data } = await apiClient.get<
			| { data: Record<string, unknown>[]; meta?: unknown }
			| Record<string, unknown>[]
		>(`${BASE}/specialties`, { params: query });
		const raw = Array.isArray(data)
			? data
			: ((data as { data: Record<string, unknown>[] }).data ?? []);
		return raw.map(mapSpecialty);
	},
};
