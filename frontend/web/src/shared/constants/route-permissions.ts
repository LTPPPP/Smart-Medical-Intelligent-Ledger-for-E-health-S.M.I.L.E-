// ============================================================
// Centralized page → role permission matrix
// Source of truth: main_flow.md, Phần J "Ma trận phân quyền theo trang" (J2) + B5.3.
// Consumed by middleware.ts (edge enforcement) and ProtectedRoute wraps on
// high-PHI-sensitivity pages (defense in depth).
//
// A route with no matching rule below is reachable by any authenticated role
// (e.g. /dashboard, /profile, /chat, /specialties — all ✅ for every role in J2).
// ============================================================

import type { UserRole } from "@/shared/types";

interface RoutePermissionRule {
  /** Path pattern; segments starting with ":" match any single path segment. */
  pattern: string;
  roles: UserRole[];
}

// Ordered most-specific-first so a literal segment (e.g. "new") is checked before a
// same-position dynamic segment (e.g. ":id") — mirrors how the backend avoids shadow routes.
export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  // Appointments
  { pattern: "/appointments/new", roles: ["PATIENT", "RECEPTIONIST", "ADMIN"] },
  { pattern: "/appointments/:id/edit", roles: ["RECEPTIONIST", "ADMIN"] },
  { pattern: "/appointments/:id/payment/callback", roles: ["PATIENT", "RECEPTIONIST", "ADMIN"] },
  { pattern: "/appointments/:id/payment", roles: ["PATIENT", "RECEPTIONIST", "ADMIN"] },
  // /appointments/:id itself: no restriction — every role may view its own appointment,
  // ownership is enforced backend-side (appointments.controller.ts is JwtAuthGuard-only).
  { pattern: "/appointments", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },

  // Patients directory (PHI) — never PATIENT
  { pattern: "/patients/new", roles: ["RECEPTIONIST", "ADMIN"] },
  { pattern: "/patients/:id/edit", roles: ["RECEPTIONIST", "ADMIN"] },
  { pattern: "/patients/:id/images", roles: ["NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/patients/:id/medical-records/:recordId", roles: ["DOCTOR", "ADMIN"] },
  { pattern: "/patients/:id/medical-records/new", roles: ["DOCTOR", "ADMIN"] },
  { pattern: "/patients/:id", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/patients", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },

  // Examinations — doctor-only clinical workspace (nurse: vitals/upload support only)
  { pattern: "/examinations/new", roles: ["DOCTOR"] },
  { pattern: "/examinations/:id", roles: ["NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/examinations", roles: ["NURSE", "DOCTOR", "ADMIN"] },

  // Dental images — nurse may upload/view, not just doctor/admin
  { pattern: "/dental-images", roles: ["NURSE", "DOCTOR", "ADMIN"] },

  // Clinics — staff-only management directory, never PATIENT (see nav.ts note)
  { pattern: "/clinics/new", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/clinics/:id/edit", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/clinics/:id", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },
  { pattern: "/clinics", roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"] },

  // Services — everyone can view, only Admin can CRUD
  { pattern: "/services/new", roles: ["ADMIN"] },
  { pattern: "/services/:id/edit", roles: ["ADMIN"] },

  // Schedules
  { pattern: "/schedules/my-schedule", roles: ["DOCTOR"] },
  { pattern: "/schedules/doctors/new", roles: ["ADMIN"] },
  { pattern: "/schedules/doctors/edit/:scheduleId", roles: ["ADMIN"] },
  { pattern: "/schedules/doctors/:doctorId", roles: ["ADMIN"] },
  { pattern: "/schedules/doctors", roles: ["ADMIN"] },

  // Performance (staff self-view; the admin-wide equivalent lives under /admin)
  { pattern: "/performance", roles: ["DOCTOR"] },

  // Standalone role dashboards
  { pattern: "/dashboards/doctor", roles: ["DOCTOR", "ADMIN"] },
  { pattern: "/dashboards/patient", roles: ["PATIENT", "ADMIN"] },

  // Admin console — defense-in-depth mirror of admin/layout.tsx's ProtectedRoute
  { pattern: "/admin", roles: ["ADMIN"] },
];

function segmentsMatch(pathSegments: string[], patternSegments: string[]): boolean {
  if (pathSegments.length !== patternSegments.length) return false;
  return patternSegments.every(
    (seg, i) => seg.startsWith(":") || seg === pathSegments[i],
  );
}

/** Returns the allowed roles for a pathname, or null if no rule applies (any authenticated role). */
export function getRequiredRoles(pathname: string): UserRole[] | null {
  const pathSegments = pathname.split("/").filter(Boolean);

  for (const rule of ROUTE_PERMISSION_RULES) {
    const patternSegments = rule.pattern.split("/").filter(Boolean);

    // Prefix match for the /admin* umbrella rule (single segment pattern covers all sub-routes);
    // exact segment-count match for everything else.
    if (rule.pattern === "/admin") {
      if (pathSegments[0] === "admin") return rule.roles;
      continue;
    }

    if (segmentsMatch(pathSegments, patternSegments)) return rule.roles;
  }

  return null;
}
