import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Doctor's own performance view (J2) — distinct from /admin/performance,
// which is gated separately by the admin layout.
const PERFORMANCE_ROLES = ["DOCTOR"];

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={PERFORMANCE_ROLES}>{children}</ProtectedRoute>;
}
