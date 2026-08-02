/** Record Status */
export type RecordStatus = "DRAFT" | "FINALIZED";

/** Gender Code */
export type Gender = 0 | 1 | 2;

export interface EmergencyContact {
	name: string;
	phone: string;
	relationship: string;
}

export interface Patient {
	id: string;
	patientCode: string;
	fullName: string;
	dateOfBirth: string;
	gender: Gender;
	phone: string;
	email?: string;
	address?: string;
	emergencyContact?: EmergencyContact;
	allergies?: string[];
	insuranceNumber?: string;
	insuranceProvider?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Medication {
	name: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions?: string;
}

export interface Prescription {
	medications: Medication[];
	instructions?: string;
}

export interface MedicalRecord {
	id: string;
	patientId: string;
	visitDate: string;
	chiefComplaint?: string;
	diagnosis: string;
	treatment: string;
	notes?: string;
	status: RecordStatus;
	doctorName?: string;
	clinicName?: string;
	finalizedAt?: string;
	recordType?: string;
	prescription?: Prescription;
	createdAt: string;
	updatedAt: string;
}

export interface MedicalHistory {
	id: string;
	patientId: string;
	conditionName: string;
	conditionType: string;
	notes?: string;
	createdAt?: string;
}

export interface TreatmentHistory {
	id: string;
	patientId: string;
	recordId?: string;
	toothNumber?: number;
	procedure: string;
	description?: string;
	cost?: number;
	doctorName?: string;
	treatmentDate: string;
	createdAt?: string;
}

export interface TreatmentPlan {
	id: string;
	patientId: string;
	recordId?: string;
	title: string;
	description?: string;
	status?: string;
	startDate?: string;
	endDate?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface PaginatedResponse<T> {
	data: {
		content: T[];
		totalPages: number;
		total: number;
		page?: number;
		limit?: number;
	};
}
