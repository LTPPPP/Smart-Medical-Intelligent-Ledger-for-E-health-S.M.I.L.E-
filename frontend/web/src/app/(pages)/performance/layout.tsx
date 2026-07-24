import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { PERFORMANCE_ROLES } from "@/shared/constants";

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={PERFORMANCE_ROLES}>{children}</ProtectedRoute>;
}
