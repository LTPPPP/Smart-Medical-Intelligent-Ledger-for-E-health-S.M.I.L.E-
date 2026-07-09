import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Doctor schedule management (create/edit shifts for any doctor) is Admin-only (J2).
const SCHEDULE_MANAGEMENT_ROLES = ["ADMIN"];

export default function ScheduleManagementLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={SCHEDULE_MANAGEMENT_ROLES}>{children}</ProtectedRoute>;
}
