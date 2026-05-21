import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { PublicRoute } from "@/shared/components/auth/PublicRoute";

export default function RegisterPage() {
  return (
    <PublicRoute redirectIfAuthenticated={true}>
      <RegisterForm />
    </PublicRoute>
  );
}
