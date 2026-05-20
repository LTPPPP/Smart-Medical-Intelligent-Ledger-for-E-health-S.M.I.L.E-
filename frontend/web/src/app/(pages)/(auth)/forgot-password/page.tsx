'use client';
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Input } from "@/shared/components/common/Input";

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword, isForgotPassword, isResettingPassword } = useAuth();
  const [step, setStep] = useState<'SEND' | 'RESET'>('SEND');
  const [form, setForm] = useState({
    emailOrPhone: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!form.emailOrPhone) {
      setError("Please enter email or phone");
      return;
    }
    
    try {
      await forgotPassword({ emailOrPhone: form.emailOrPhone });
      setStep('RESET');
      setError("");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!form.otp || !form.newPassword) {
      setError("Please fill all fields");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await resetPassword({
        emailOrPhone: form.emailOrPhone,
        otp: form.otp,
        newPassword: form.newPassword
      });
      setError("");
    } catch (err) {
      setError("Failed to reset password. Please check your OTP.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">FORGOT PASSWORD</h1>
          <p className="text-gray-500 mt-2">Reset your password</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 'SEND' ? (
          <div className="space-y-4">
            <Input 
              label="Email or Phone" 
              value={form.emailOrPhone}
              onChange={e => setForm({...form, emailOrPhone: e.target.value})}
              placeholder="Enter your email or phone"
            />
            
            <button 
              onClick={handleSendOtp}
              disabled={isForgotPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isForgotPassword && <Icon icon="line-md:loading-twotone-loop" />}
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              OTP has been sent to <strong>{form.emailOrPhone}</strong>
            </div>

            <Input 
              label="OTP Code" 
              value={form.otp}
              onChange={e => setForm({...form, otp: e.target.value})}
              placeholder="Enter 6-digit OTP"
            />

            <Input 
              label="New Password" 
              type="password"
              value={form.newPassword}
              onChange={e => setForm({...form, newPassword: e.target.value})}
              placeholder="Enter new password"
            />

            <Input 
              label="Confirm Password" 
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              placeholder="Confirm new password"
            />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setStep('SEND')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isResettingPassword && <Icon icon="line-md:loading-twotone-loop" />}
                Reset Password
              </button>
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Remember your password? <Link href="/login" className="text-blue-600 font-semibold underline">Login</Link>
          </p>
          <p className="text-sm text-gray-600">
            Don`&apos`t have an account? <Link href="/register" className="text-blue-600 font-semibold underline">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}