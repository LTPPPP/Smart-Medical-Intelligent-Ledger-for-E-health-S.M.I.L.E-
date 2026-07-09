import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Dental images/X-rays are clinical PHI (J2: Patient/Receptionist blocked).
const DENTAL_IMAGE_ROLES = ["ADMIN", "DOCTOR", "NURSE"];

export default function DentalImagesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={DENTAL_IMAGE_ROLES}>{children}</ProtectedRoute>;
}
