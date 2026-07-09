import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Clinical PHI — a PATIENT/RECEPTIONIST must never reach these pages (J2).
const EXAMINATION_ROLES = ["ADMIN", "DOCTOR", "NURSE"];

export default function ExaminationsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={EXAMINATION_ROLES}>{children}</ProtectedRoute>;
}
