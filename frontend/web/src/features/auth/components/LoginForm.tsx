'use client';
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { Icon } from "@iconify/react";
import { Input } from "@/shared/components/common/Input";

export const LoginForm = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const [form, setForm] = useState({ 
    emailOrPhone: "", 
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    if (!form.emailOrPhone || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await login(form);
    } catch (error) {
      // Error handled by hook......
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <Input 
        label="Email Or Phone" 
        value={form.emailOrPhone}
        onChange={e => setForm({...form, emailOrPhone: e.target.value})}
        placeholder="Enter your email or phone"
      />
      
      <div className="relative">
        <Input 
          label="Password" 
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          placeholder="Enter your password"
        />
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
        >
          <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} width={20} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox"
            checked={form.rememberMe}
            onChange={e => setForm({...form, rememberMe: e.target.checked})}
            className="w-4 h-4"
          />
          <span>Remember me</span>
        </label>
        
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      {loginError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
          Login failed. Please check your credentials.
        </div>
      )}
      
      <button 
        onClick={onSubmit}
        disabled={isLoggingIn}
        className="bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
      >
        {isLoggingIn && <Icon icon="line-md:loading-twotone-loop" />}
        L O G I N
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <button 
        type="button"
        onClick={() => window.location.href = 'http://localhost:8081/api/account/oauth/google'}
        className="border border-gray-300 py-3 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <Icon icon="logos:google-icon" width={20} />
        Google
      </button>
    </div>
  );
};