import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { BaseResponse, PaginatedResponse } from "@/shared/types/response.type";

import {
  Clinic,
  CreateClinicRequest,
  UpdateClinicRequest,
} from "../types/clinic.type";

export const clinicApi = {
  getClinics: async (params?: {
    page?: number;
    size?: number;
  }): Promise<BaseResponse<PaginatedResponse<Clinic>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<Clinic>>
    >(API_ENDPOINTS.CLINIC.LIST, { params });
    return data;
  },

  getClinicById: async (clinicId: string): Promise<BaseResponse<Clinic>> => {
    const { data } = await apiClient.get<BaseResponse<Clinic>>(
      API_ENDPOINTS.CLINIC.DETAIL(clinicId),
    );
    return data;
  },

  getClinicByCode: async (code: string): Promise<BaseResponse<Clinic>> => {
    const { data } = await apiClient.get<BaseResponse<Clinic>>(
      API_ENDPOINTS.CLINIC.BY_CODE(code),
    );
    return data;
  },

  searchClinics: async (params: {
    name?: string;
    city?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<BaseResponse<PaginatedResponse<Clinic>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<Clinic>>
    >(API_ENDPOINTS.CLINIC.SEARCH, { params });
    return data;
  },

  createClinic: async (
    request: CreateClinicRequest,
  ): Promise<BaseResponse<Clinic>> => {
    const { data } = await apiClient.post<BaseResponse<Clinic>>(
      API_ENDPOINTS.CLINIC.CREATE,
      request,
    );
    return data;
  },

  updateClinic: async (
    clinicId: string,
    request: UpdateClinicRequest,
  ): Promise<BaseResponse<Clinic>> => {
    const { data } = await apiClient.patch<BaseResponse<Clinic>>(
      API_ENDPOINTS.CLINIC.UPDATE(clinicId),
      request,
    );
    return data;
  },

  deleteClinic: async (clinicId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.CLINIC.DELETE(clinicId),
    );
    return data;
  },
};
