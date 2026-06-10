import { ClinicStatus } from "../constants/clinic.constant";

// CLINIC TYPES
export interface Clinic {
  clinicId: string;
  clinicName: string;
  clinicCode: string;
  address: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  operatingHours?: Record<string, string>;
  status: ClinicStatus;
  licenseNumber?: string;
  licenseExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicRequest {
  clinicName: string;
  clinicCode: string;
  address: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: Record<string, string>;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export interface UpdateClinicRequest {
  clinicName?: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: Record<string, string>;
  status?: ClinicStatus;
  licenseNumber?: string;
  licenseExpiry?: string;
}
