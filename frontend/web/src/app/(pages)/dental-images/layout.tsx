import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { DENTAL_IMAGE_ROLES } from "@/shared/constants";

export default function DentalImagesLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={DENTAL_IMAGE_ROLES}>
			{children}
		</ProtectedRoute>
	);
}
