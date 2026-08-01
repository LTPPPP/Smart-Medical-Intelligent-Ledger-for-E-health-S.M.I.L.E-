// Common Types

/** API Response Wrapper */
export interface ApiResponse<T> {
	data: T;
	message?: string;
	statusCode: number;
}

/** Pagination Params */
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/** Search Params */
export interface SearchParams extends PaginationParams {
	search?: string;
}

/** Select Option */
export interface SelectOption<T = string> {
	label: string;
	value: T;
	disabled?: boolean;
}

/** Nav Item */
export interface NavItem {
	title: string;
	i18nKey?: string;
	href: string;
	icon?: string;
	badge?: string;
	disabled?: boolean;
	children?: NavItem[];
	roles?: UserRole[];
}

/** User Roles */
export type UserRole =
	| "ADMIN"
	| "PATIENT"
	| "DOCTOR"
	| "RECEPTIONIST"
	| "NURSE"
	| "MANAGER";

/** Gender Code */
export type Gender = 0 | 1 | 2;

/** ID Type */
export type ID = string;

/** Date String */
export type DateString = string;

/** Breadcrumb Item */
export interface BreadcrumbItem {
	label: string;
	href?: string;
}

/** Patient Filters */
export interface PatientFilters extends SearchParams {
	status?: string;
	clinicId?: string;
}

/** Appointment Filters */
export interface AppointmentFilters extends SearchParams {
	status?: string;
	patientId?: string;
	doctorId?: string;
	clinicId?: string;
	dateFrom?: string;
	dateTo?: string;
}
