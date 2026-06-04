"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { ROUTES } from "@/shared/constants";

import { useAuth } from "../hooks/useAuth";

// Underline input row
function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">{label}</p>
      <div className="flex items-center gap-3 pb-2">
        <Icon icon={icon} width={16} className="shrink-0 text-smile-primary/70" />
        <div className="flex-1">{children}</div>
      </div>
      <div
        className="h-px transition-colors group-focus-within:bg-smile-primary"
        style={{ background: "var(--surface-panel-border)" }}
      />
      {error && <p className="mt-1 font-inter text-xs text-red-500">{error}</p>}
    </div>
  );
}

type ApiErr = { response?: { data?: { message?: string; errors?: Record<string, string> } }; message?: string };

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [form, setForm] = useState({ emailOrPhone: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emailOrPhone || !form.password) return;
    try { await login(form); } catch { /* handled by hook */ }
  };

  const errorMsg = (() => {
    const err = loginError as ApiErr;
    if (!err) return null;
    return (
      err?.response?.data?.message ||
      (err?.response?.data?.errors ? Object.values(err.response.data.errors).join(", ") : null) ||
      (err?.message === "Network Error" ? "Cannot connect to server. Please try again." : null) ||
      err?.message ||
      "Login failed. Please try again."
    );
  })();

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">

      {/* LEFT — Brand panel */}
      <div
        className="relative hidden lg:flex lg:w-[46%] lg:flex-col lg:overflow-hidden"
        style={{ background: "linear-gradient(155deg, var(--color-smile-primary-dark) 0%, #2a6494 55%, var(--color-smile-primary) 100%)" }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/8 blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-white/6 blur-[110px]" />
        <div className="pointer-events-none absolute left-1/3 top-2/5 h-40 w-40 rounded-full blur-[60px]" style={{ background: "rgba(94,255,136,0.18)" }} />

        {/* Top content block */}
        <div className="relative z-10 flex flex-shrink-0 flex-col px-10 pt-8">

          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="S.M.I.L.E" width={46} height={46} className="drop-shadow-xl" />
            <div>
              <p className="font-poppins text-xl font-bold tracking-[4px] text-white">S.M.I.L.E</p>
              <p className="font-inter text-[10px] tracking-[1.5px] text-white/50">DENTAL PLATFORM</p>
            </div>
          </Link>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-[2px] w-10 rounded-full bg-white/40" />
            <div className="h-[2px] w-3 rounded-full bg-smile-accent/70" />
          </div>

          {/* Hero heading */}
          <h2 className="mt-4 font-poppins text-[44px] font-extrabold leading-[1.08] tracking-tight text-white">
            Welcome<br />
            <span style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.5)", color: "transparent" }}>back.</span>
          </h2>
          <p className="mt-3 font-inter text-sm leading-relaxed text-white/65">
            AI-powered diagnostics &amp;<br />blockchain-secured records.
          </p>

          {/* Features */}
          <div className="mt-6 space-y-3">
            {([
              { icon: "lucide:brain-circuit", text: "AI dental diagnostics" },
              { icon: "lucide:shield-check", text: "Blockchain-secured records" },
              { icon: "lucide:calendar-check", text: "Smart appointment booking" },
            ] as const).map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <Icon icon={f.icon} width={15} className="text-white" />
                </div>
                <span className="font-inter text-[13px] font-medium text-white/80">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="mt-6 flex items-center gap-8 border-t border-white/15 pt-4">
            {([
              { val: "10K+", lbl: "Patients" },
              { val: "98%", lbl: "Satisfaction" },
              { val: "5.0★", lbl: "Rating" },
            ] as const).map(s => (
              <div key={s.lbl}>
                <p className="font-poppins text-xl font-extrabold text-white">{s.val}</p>
                <p className="font-inter text-[11px] text-white/50">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor image — fills remaining height */}
        <div className="relative z-10 min-h-0 flex-1">
          <Image
            src="/images/doctor.png"
            alt="Dental professional"
            fill
            className="object-contain object-bottom drop-shadow-[0_-8px_40px_rgba(0,0,0,0.3)]"
          />
        </div>

        {/* Floating tooth */}
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [12, 17, 12] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute right-6 top-28 opacity-40"
        >
          <Image src="/images/glassy_tooth.png" alt="" width={110} height={135} className="object-contain" />
        </motion.div>

        {/* Floating tool */}
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="pointer-events-none absolute left-8 bottom-52 opacity-35"
        >
          <Image src="/images/glassy_tool.png" alt="" width={86} height={86} className="object-contain" />
        </motion.div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 lg:px-14">
        {/* Mobile-only blobs */}
        <div className="liquid-blob pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-blob-primary lg:hidden" />
        <div className="liquid-blob-slow pointer-events-none absolute -right-16 bottom-16 h-64 w-64 rounded-full bg-blob-secondary lg:hidden" />

        {/* Mobile logo */}
        <Link href={ROUTES.HOME} className="mb-8 flex items-center gap-2 lg:hidden">
          <Image src="/images/logo.png" alt="S.M.I.L.E" width={32} height={32} />
          <span className="font-poppins text-xl font-semibold tracking-[2px] text-smile-primary">S.M.I.L.E</span>
        </Link>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-[32px] border px-8 py-10 backdrop-blur-md"
          style={{
            background: "var(--surface-card-bg)",
            borderColor: "var(--surface-card-border)",
            boxShadow: "var(--surface-card-shadow)",
          }}
        >
          {/* Accent top bar */}
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[32px]"
            style={{ background: "linear-gradient(90deg, var(--color-smile-primary), #5eff88, var(--color-smile-primary))" }} />
          {/* Decorative glassy block */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-28 opacity-[0.12]"
            style={{ transform: "matrix(-0.99,-0.13,-0.13,0.99,0,0)" }}>
            <Image src="/images/glassy_block.png" alt="" fill className="object-contain" />
          </div>

          <h1 className="font-poppins text-5xl font-bold leading-none tracking-tight text-smile-primary">
            LOG IN
          </h1>
          <p className="mb-8 mt-2 font-inter text-sm text-smile-description">
            Sign in to your S.M.I.L.E account
          </p>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-inter text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <Icon icon="lucide:alert-circle" width={15} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <Field label="Email or Phone" icon="lucide:mail">
              <input
                type="text"
                autoComplete="username"
                placeholder="your@email.com"
                value={form.emailOrPhone}
                onChange={e => setForm({ ...form, emailOrPhone: e.target.value })}
                className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
              />
            </Field>

            <Field label="Password" icon="lucide:lock">
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="shrink-0 text-smile-description hover:text-smile-primary"
                >
                  <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width={16} />
                </button>
              </div>
            </Field>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                  className="h-4 w-4 accent-smile-primary"
                />
                <span className="font-inter text-xs text-smile-title">Remember me</span>
              </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="font-inter text-xs font-semibold text-smile-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_24px_rgba(65,126,170,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn && <Icon icon="line-md:loading-twotone-loop" width={16} />}
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--surface-panel-border)" }} />
            <span className="font-inter text-[11px] text-smile-description">or</span>
            <div className="h-px flex-1" style={{ background: "var(--surface-panel-border)" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => (window.location.href = "http://localhost:8081/api/account/oauth/google")}
            className="flex w-full items-center justify-center gap-3 rounded-full border py-3 font-inter text-sm font-medium text-smile-title transition-all hover:text-smile-primary"
            style={{
              borderColor: "var(--surface-card-border)",
              background: "var(--surface-panel-bg)",
            }}
          >
            <Icon icon="flat-color-icons:google" width={18} />
            Continue with Google
          </button>

          <p className="mt-6 text-center font-inter text-sm text-smile-description">
            No account?{" "}
            <Link href={ROUTES.REGISTER} className="font-semibold text-smile-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
