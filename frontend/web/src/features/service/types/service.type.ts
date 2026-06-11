// Service Status
export const SERVICE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ServiceStatus = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];

// SPECIALTY TYPES
export interface Specialty {
  specialtyId: string;
  specialtyName: string;
  specialtyCode: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecialtyRequest {
  specialtyName: string;
  specialtyCode: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
}

export interface UpdateSpecialtyRequest {
  specialtyName?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// SERVICE CATEGORY TYPES
export interface ServiceCategory {
  categoryId: string;
  categoryName: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
}

export interface CreateServiceCategoryRequest {
  categoryName: string;
  description?: string;
  parentCategoryId?: string;
  displayOrder?: number;
}

export interface UpdateServiceCategoryRequest {
  categoryName?: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// SERVICE TYPES
export interface Service {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  categoryId: string;
  categoryName?: string;
  specialtyId: string;
  specialtyName?: string;
  description?: string;
  durationMinutes: number;
  basePrice: number;
  currency: string;
  isActive: boolean;
  requiresAppointment: boolean;
  preparationInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  serviceCode: string;
  serviceName: string;
  categoryId: string;
  specialtyId: string;
  description?: string;
  durationMinutes?: number;
  basePrice: number;
  currency?: string;
  requiresAppointment?: boolean;
  preparationInstructions?: string;
}

export interface UpdateServiceRequest {
  serviceName?: string;
  categoryId?: string;
  specialtyId?: string;
  description?: string;
  durationMinutes?: number;
  basePrice?: number;
  isActive?: boolean;
  requiresAppointment?: boolean;
  preparationInstructions?: string;
}

// CLINIC SERVICE TYPES (Pricing per clinic)
export interface ClinicService {
  clinicServiceId: string;
  clinicId: string;
  clinicName?: string;
  serviceId: string;
  serviceName?: string;
  customPrice?: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicServiceRequest {
  clinicId: string;
  serviceId: string;
  customPrice?: number;
}

export interface UpdateClinicServiceRequest {
  customPrice?: number;
  isAvailable?: boolean;
}

// LIST PARAMS
export interface ServiceListParams {
  page?: number;
  size?: number;
  specialtyId?: string;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export interface SpecialtyListParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}