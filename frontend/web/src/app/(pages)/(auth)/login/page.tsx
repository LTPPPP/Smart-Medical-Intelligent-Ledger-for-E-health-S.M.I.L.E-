import { LoginForm } from "@/features/auth/components/LoginForm";
import { OtpSection } from "@/features/auth/components/OtpSection";
import { PublicRoute } from "@/shared/components/auth/PublicRoute";
import Link from "next/link";

export default function LoginPage() {
  return (
    <PublicRoute redirectIfAuthenticated={true}>
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">LOGIN</h1>
            <p className="text-gray-500 mt-2">for test</p>
          </div>

          <LoginForm />
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or OTP</span></div>
          </div>

          <OtpSection />

          <p className="text-center text-sm text-gray-600">
            Not a member? <Link href="/register" className="text-blue-600 font-semibold underline">Register Now</Link>
          </p>
        </div>
      </main>
    </PublicRoute>
  );
}