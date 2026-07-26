// ============================================================
// Common shared types used across the application
// ============================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
	data: T;
	message?: string;
	statusCode: number;
}

/** Standard pagination query params */
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/** Search/filter params */
export interface SearchParams extends PaginationParams {
	search?: string;
}

/** Generic select option */
export interface SelectOption<T = string> {
	label: string;
	value: T;
	disabled?: boolean;
}

/** Navigation item for sidebar/menu */
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

/** User roles enum — mirrors backend RoleEnum (ADMIN, DOCTOR, PATIENT, RECEPTIONIST, NURSE, MANAGER) */
export type UserRole =
	| "ADMIN"
	| "PATIENT"
	| "DOCTOR"
	| "RECEPTIONIST"
	| "NURSE"
	| "MANAGER";

/** Gender code — ISO/IEC 5218: 0 unknown, 1 male, 2 female. See shared/constants/common. */
export type Gender = 0 | 1 | 2;

/** Generic ID type */
export type ID = string;

/** Date string from API (ISO 8601) */
export type DateString = string;

/** Breadcrumb item */
export interface BreadcrumbItem {
	label: string;
	href?: string;
}

/** Patient filter params */
export interface PatientFilters extends SearchParams {
	status?: string;
	clinicId?: string;
}

/** Appointment filter params */
export interface AppointmentFilters extends SearchParams {
	status?: string;
	patientId?: string;
	doctorId?: string;
	clinicId?: string;
	dateFrom?: string;
	dateTo?: string;
}
