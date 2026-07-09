import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { EXAMINATION_ROLES } from "@/shared/constants";

export default function ExaminationsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={EXAMINATION_ROLES}>{children}</ProtectedRoute>;
}
