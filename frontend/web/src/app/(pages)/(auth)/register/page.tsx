'use client';
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

import { Input } from "@/shared/components/common/Input";
import { PublicRoute } from "@/shared/components/auth/PublicRoute";
import { GENDER_TYPE } from "@/shared/constants";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function RegisterPage() {
  const { register, isRegistering } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.username) newErrors.username = "Username is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!form.fullName) newErrors.fullName = "Full name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      await register({
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender
      });
    } catch (error) {
      alert("Registration failed!");
    }
  };

  return (
    <PublicRoute redirectIfAuthenticated={true}>  
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">REGISTER</h1>
            <p className="text-gray-500 mt-2">Create your S.M.I.L.E account</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input 
                  label="Username *" 
                  value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})}
                  />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              <div>
                <Input 
                  label="Full Name *" 
                  value={form.fullName}
                  onChange={e => setForm({...form, fullName: e.target.value})}
                  />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <Input 
                  label="Email *" 
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <Input 
                  label="Phone" 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  />
              </div>

              <div>
                <Input 
                  label="Password *" 
                  type="password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <Input 
                  label="Confirm Password *" 
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <Input 
                  label="Date of Birth" 
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm({...form, dateOfBirth: e.target.value})}
                  />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select 
                  className="px-3 py-2 border rounded-md outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={form.gender}
                  onChange={e => setForm({...form, gender: e.target.value as GENDER_TYPE})}
                  >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <button 
              onClick={onSubmit}
              disabled={isRegistering}
              className="w-full bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-6"
              >
              {isRegistering && <Icon icon="line-md:loading-twotone-loop" />}
              R E G I S T E R
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account? <Link href="/login" className="text-blue-600 font-semibold underline">Login</Link>
          </p>
        </div>
      </main>
    </PublicRoute>
  );
}