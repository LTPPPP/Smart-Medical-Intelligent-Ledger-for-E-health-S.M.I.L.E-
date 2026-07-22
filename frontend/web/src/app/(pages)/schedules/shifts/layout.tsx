import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { WORK_SHIFT_ROLES } from "@/shared/constants";

export default function WorkShiftLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={WORK_SHIFT_ROLES}>{children}</ProtectedRoute>;
}
