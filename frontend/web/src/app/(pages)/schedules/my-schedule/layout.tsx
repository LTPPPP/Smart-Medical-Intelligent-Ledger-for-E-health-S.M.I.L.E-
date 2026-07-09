import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// B4.8: a doctor only ever sees their own schedule here (J2).
const MY_SCHEDULE_ROLES = ["DOCTOR"];

export default function MyScheduleLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={MY_SCHEDULE_ROLES}>{children}</ProtectedRoute>;
}
