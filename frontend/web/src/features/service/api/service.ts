import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import { 
  Specialty,
  CreateSpecialtyRequest,
  UpdateSpecialtyRequest,
  SpecialtyListParams,
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceListParams,
  ServiceCategory,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
} from '../types/service.type';

export const serviceApi = {
  // SPECIALTY Management

  getSpecialties: async (params?: SpecialtyListParams): Promise<BaseResponse<PaginatedResponse<Specialty>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Specialty>>>(
      API_ENDPOINTS.SPECIALTY.LIST,
      { params }
    );
    return data;
  },

  getSpecialtyById: async (specialtyId: string): Promise<BaseResponse<Specialty>> => {
    const { data } = await apiClient.get<BaseResponse<Specialty>>(
      API_ENDPOINTS.SPECIALTY.DETAIL(specialtyId)
    );
    return data;
  },

  createSpecialty: async (request: CreateSpecialtyRequest): Promise<BaseResponse<Specialty>> => {
    const { data } = await apiClient.post<BaseResponse<Specialty>>(
      API_ENDPOINTS.SPECIALTY.CREATE,
      request
    );
    return data;
  },

  updateSpecialty: async (
    specialtyId: string, 
    request: UpdateSpecialtyRequest
  ): Promise<BaseResponse<Specialty>> => {
    const { data } = await apiClient.put<BaseResponse<Specialty>>(
      API_ENDPOINTS.SPECIALTY.UPDATE(specialtyId),
      request
    );
    return data;
  },

  deleteSpecialty: async (specialtyId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.SPECIALTY.DELETE(specialtyId)
    );
    return data;
  },

  // SERVICE Management

  getServices: async (params?: ServiceListParams): Promise<BaseResponse<PaginatedResponse<Service>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Service>>>(
      API_ENDPOINTS.SERVICE.LIST,
      { params }
    );
    return data;
  },

  getServiceById: async (serviceId: string): Promise<BaseResponse<Service>> => {
    const { data } = await apiClient.get<BaseResponse<Service>>(
      API_ENDPOINTS.SERVICE.DETAIL(serviceId)
    );
    return data;
  },

  getServicesBySpecialty: async (specialtyId: string): Promise<BaseResponse<Service[]>> => {
    const { data } = await apiClient.get<BaseResponse<Service[]>>(
      API_ENDPOINTS.SERVICE.BY_SPECIALTY(specialtyId)
    );
    return data;
  },

  searchServices: async (params: {
    name?: string;
    specialtyId?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Promise<BaseResponse<PaginatedResponse<Service>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Service>>>(
      API_ENDPOINTS.SERVICE.SEARCH,
      { params }
    );
    return data;
  },

  createService: async (request: CreateServiceRequest): Promise<BaseResponse<Service>> => {
    const { data } = await apiClient.post<BaseResponse<Service>>(
      API_ENDPOINTS.SERVICE.CREATE,
      request
    );
    return data;
  },

  updateService: async (
    serviceId: string, 
    request: UpdateServiceRequest
  ): Promise<BaseResponse<Service>> => {
    const { data } = await apiClient.put<BaseResponse<Service>>(
      API_ENDPOINTS.SERVICE.UPDATE(serviceId),
      request
    );
    return data;
  },

  deleteService: async (serviceId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.SERVICE.DELETE(serviceId)
    );
    return data;
  },

  // SERVICE CATEGORY Management
  getCategories: async (): Promise<BaseResponse<ServiceCategory[]>> => {
    const { data } = await apiClient.get<BaseResponse<ServiceCategory[]>>(
      API_ENDPOINTS.SERVICE_CATEGORY.LIST
    );
    return data;
  },

  getCategoryById: async (categoryId: string): Promise<BaseResponse<ServiceCategory>> => {
    const { data } = await apiClient.get<BaseResponse<ServiceCategory>>(
      API_ENDPOINTS.SERVICE_CATEGORY.DETAIL(categoryId)
    );
    return data;
  },

  createCategory: async (request: CreateServiceCategoryRequest): Promise<BaseResponse<ServiceCategory>> => {
    const { data } = await apiClient.post<BaseResponse<ServiceCategory>>(
      API_ENDPOINTS.SERVICE_CATEGORY.CREATE,
      request
    );
    return data;
  },

  updateCategory: async (
    categoryId: string,
    request: UpdateServiceCategoryRequest
  ): Promise<BaseResponse<ServiceCategory>> => {
    const { data } = await apiClient.put<BaseResponse<ServiceCategory>>(
      API_ENDPOINTS.SERVICE_CATEGORY.UPDATE(categoryId),
      request
    );
    return data;
  },

  deleteCategory: async (categoryId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.SERVICE_CATEGORY.DELETE(categoryId)
    );
    return data;
  },
};