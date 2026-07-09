import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Leave requests/approvals are staff-only (J2) — a PATIENT must not reach this.
const LEAVES_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE"];

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={LEAVES_ROLES}>{children}</ProtectedRoute>;
}
