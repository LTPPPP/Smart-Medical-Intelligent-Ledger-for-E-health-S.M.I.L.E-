import { apiClient } from '@/shared/api/client';
import { ENV } from '@/shared/constants/env';

import type { Service, Specialty, ServiceListParams, ServiceListResponse, SpecialtyListParams } from '../types/service.type';

const BASE = ENV.SERVICES.CLINICAL;

// Map BE snake_case → FE camelCase
function mapService(raw: Record<string, unknown>): Service {
  return {
    serviceId: (raw.service_id ?? raw.serviceId) as string,
    serviceCode: (raw.service_code ?? raw.serviceCode ?? '') as string,
    serviceName: (raw.service_name ?? raw.serviceName ?? '') as string,
    categoryId: (raw.category_id ?? raw.categoryId ?? null) as string | null,
    specialtyId: (raw.specialty_id ?? raw.specialtyId ?? null) as string | null,
    description: (raw.description ?? null) as string | null,
    durationMinutes: (raw.duration_minutes ?? raw.durationMinutes ?? 30) as number,
    basePrice: (raw.base_price ?? raw.basePrice ?? null) as number | null,
    currency: (raw.currency ?? 'VND') as string,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    requiresAppointment: (raw.requires_appointment ?? raw.requiresAppointment ?? true) as boolean,
    preparationInstructions: (raw.preparation_instructions ?? raw.preparationInstructions ?? null) as string | null,
    category: raw.category as Service['category'],
    specialty: raw.specialty as Service['specialty'],
    createdAt: (raw.created_at ?? raw.createdAt ?? '') as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? '') as string,
  };
}

function mapSpecialty(raw: Record<string, unknown>): Specialty {
  return {
    specialtyId: (raw.specialty_id ?? raw.specialtyId) as string,
    specialtyCode: (raw.specialty_code ?? raw.specialtyCode ?? '') as string,
    specialtyName: (raw.specialty_name ?? raw.specialtyName ?? '') as string,
    description: (raw.description ?? null) as string | null,
    iconUrl: (raw.icon_url ?? raw.iconUrl ?? null) as string | null,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    displayOrder: (raw.display_order ?? raw.displayOrder ?? null) as number | null,
  };
}

export const serviceApi = {
  getServices: async (params: ServiceListParams = {}): Promise<ServiceListResponse> => {
    const { page = 0, size, limit, specialtyId, isActive, ...rest } = params;
    const query: Record<string, unknown> = {
      page: page + 1, // BE is 1-indexed
      limit: size ?? limit ?? 12,
      ...rest,
    };
    if (specialtyId) query.specialty_id = specialtyId;
    if (isActive !== undefined) query.is_active = isActive;

    const { data } = await apiClient.get<{ data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number } }>(
      `${BASE}/services`,
      { params: query },
    );
    const pageSize = data.meta?.limit ?? 12;
    const total = data.meta?.total ?? 0;
    return {
      content: (data.data ?? []).map(mapService),
      totalPages: Math.ceil(total / pageSize),
      totalElements: total,
    };
  },

  getService: async (id: string): Promise<Service> => {
    const { data } = await apiClient.get<Record<string, unknown>>(`${BASE}/services/${id}`);
    return mapService(data);
  },

  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/services/${id}`);
  },

  getSpecialties: async (params: SpecialtyListParams = {}): Promise<Specialty[]> => {
    const query: Record<string, unknown> = { limit: 100 };
    if (params.isActive !== undefined) query.is_active = params.isActive;
    const { data } = await apiClient.get<{ data: Record<string, unknown>[]; meta?: unknown } | Record<string, unknown>[]>(
      `${BASE}/specialties`,
      { params: query },
    );
    const raw = Array.isArray(data) ? data : (data as { data: Record<string, unknown>[] }).data ?? [];
    return raw.map(mapSpecialty);
  },
};
