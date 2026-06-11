// ============================================================
// Common shared types used across the application
// ============================================================

/** Standard paginated API response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

/** User roles enum (mirrors backend RBAC) */
export type UserRole =
  | "ADMIN"
  | "PATIENT"
  | "DENTIST"
  | "RECEPTIONIST"
  | "NURSE"
  | "CLINIC_ADMIN"
  | "SUPER_ADMIN";

/** Gender enum */
export type Gender = "MALE" | "FEMALE" | "OTHER";

/** Generic ID type */
export type ID = string;

/** Date string from API (ISO 8601) */
export type DateString = string;

/** Breadcrumb item */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
