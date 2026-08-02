export type RoomType = "examination" | "surgery" | "imaging";

export interface Service {
	serviceId: string;
	serviceCode: string;
	serviceName: string;
	categoryId: string | null;
	specialtyId: string | null;
	description: string | null;
	durationMinutes: number;
	requiredRoomType: RoomType;
	basePrice: number | null;
	currency: string;
	isActive: boolean;
	requiresAppointment: boolean;
	preparationInstructions: string | null;
	category?: { categoryId: string; categoryName: string } | null;
	specialty?: { specialtyId: string; specialtyName: string } | null;
	createdAt: string;
	updatedAt: string;
}

export interface Specialty {
	specialtyId: string;
	specialtyCode: string;
	specialtyName: string;
	description: string | null;
	iconUrl: string | null;
	isActive: boolean;
	displayOrder: number | null;
}

export interface ServiceListParams {
	page?: number;
	limit?: number;
	service_name?: string;
	category_id?: string;
	specialtyId?: string;
	specialty_id?: string;
	isActive?: boolean;
	is_active?: boolean;
	size?: number;
}

export interface ServiceListResponse {
	content: Service[];
	totalPages: number;
	totalElements: number;
}

export interface SpecialtyListParams {
	isActive?: boolean;
}

export interface CreateServiceRequest {
	serviceName: string;
	serviceCode: string;
	categoryId?: string | null;
	specialtyId?: string | null;
	description?: string | null;
	durationMinutes?: number;
	requiredRoomType: RoomType;
	basePrice?: number | null;
	currency?: string;
	requiresAppointment?: boolean;
	preparationInstructions?: string | null;
}

export interface UpdateServiceRequest
	extends Partial<Omit<CreateServiceRequest, "serviceCode" | "currency">> {
	isActive?: boolean;
}

export interface CreateSpecialtyRequest {
	specialtyName: string;
	specialtyCode?: string;
	description?: string | null;
	iconUrl?: string | null;
	displayOrder?: number | null;
}

export interface UpdateSpecialtyRequest
	extends Partial<CreateSpecialtyRequest> {
	isActive?: boolean;
}

export interface ServiceCategory {
	categoryId: string;
	categoryCode?: string;
	categoryName: string;
	description?: string | null;
	isActive?: boolean;
}

export type CreateServiceCategoryRequest = Omit<ServiceCategory, "categoryId">;
export type UpdateServiceCategoryRequest =
	Partial<CreateServiceCategoryRequest>;
