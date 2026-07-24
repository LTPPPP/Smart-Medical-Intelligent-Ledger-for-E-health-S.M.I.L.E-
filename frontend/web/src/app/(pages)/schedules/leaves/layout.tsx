import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { LEAVES_ROLES } from "@/shared/constants";

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={LEAVES_ROLES}>{children}</ProtectedRoute>;
}
