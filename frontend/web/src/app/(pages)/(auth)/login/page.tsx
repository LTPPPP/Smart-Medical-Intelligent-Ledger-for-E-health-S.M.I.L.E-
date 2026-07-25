import { LoginForm } from "@/features/auth/components/LoginForm";
import { PublicRoute } from "@/shared/components/auth/PublicRoute";

export default function LoginPage() {
	return (
		<PublicRoute redirectIfAuthenticated={true}>
			<LoginForm />
		</PublicRoute>
	);
}
