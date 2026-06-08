// ============================================================
// Authentication & user types
// ============================================================

import type { DateString, Gender, ID, UserRole } from "./common.types";

/** Authenticated user profile */
export interface User {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  gender?: Gender;
  dateOfBirth?: DateString;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  clinicId?: ID;
  createdAt: DateString;
  updatedAt: DateString;
}

/** Auth session state (client-side) */
export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** OAuth provider */
export type OAuthProvider = "google" | "facebook" | "apple";

/** Permission item */
export interface Permission {
  id: ID;
  name: string;
  description?: string;
  resource: string;
  action: string;
}
