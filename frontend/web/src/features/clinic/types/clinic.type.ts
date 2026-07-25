import {
	ClinicStatus,
	RoomType,
	RoomStatus,
} from "../constants/clinic.constant";

// EQUIPMENT TYPES
export interface EquipmentItem {
	name: string;
	quantity: number;
	condition?: "good" | "fair" | "poor";
	lastMaintenance?: string;
}

export type EquipmentList = Record<string, EquipmentItem>;

export interface MaintenanceSchedule {
	frequency: string;
	lastDate?: string;
	nextDate?: string;
	notes?: string;
}

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

// TREATMENT ROOM TYPES
export interface TreatmentRoom {
	roomId: string;
	clinicId: string;
	roomName: string;
	roomCode: string;
	roomType: RoomType;
	floorNumber?: number;
	capacity?: number;
	equipmentList?: EquipmentList;
	status: RoomStatus;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTreatmentRoomRequest {
	roomName: string;
	roomCode: string;
	roomType: RoomType;
	floorNumber?: number;
	capacity?: number;
	equipmentList?: EquipmentList;
}

export interface UpdateTreatmentRoomRequest {
	roomName?: string;
	roomType?: RoomType;
	floorNumber?: number;
	capacity?: number;
	equipmentList?: EquipmentList;
	status?: RoomStatus;
}

// EQUIPMENT TYPES
export interface Equipment {
	equipmentId: string;
	clinicId: string;
	roomId?: string;
	equipmentName: string;
	equipmentType?: string;
	serialNumber?: string;
	purchaseDate?: string;
	warrantyExpiry?: string;
	maintenanceSchedule?: MaintenanceSchedule;
	lastMaintenance?: string;
	status: "active" | "inactive" | "maintenance";
	createdAt: string;
	updatedAt: string;
}
