import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Patient directory holds PHI — a PATIENT must never reach it (J2/patients.controller.ts).
const PATIENT_DIRECTORY_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE"];

export default function PatientsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={PATIENT_DIRECTORY_ROLES}>{children}</ProtectedRoute>;
}
