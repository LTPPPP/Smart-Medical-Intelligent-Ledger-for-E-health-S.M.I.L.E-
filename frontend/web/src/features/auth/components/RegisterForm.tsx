// ============================================================
// RegisterForm — Full-page sign-up form matching Figma design
// Preserves all existing form logic (useAuth, react-hook-form, zod)
// ============================================================

"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/shared/constants";
import { useAuth, useTranslation } from "@/shared/hooks";
import { registerSchema, type RegisterFormData } from "@/shared/lib/validators";

// ─── Underline input row ──────────────────────────────────────
interface FieldRowProps {
    label: string;
    icon: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}

function FieldRow({ label, icon, error, children }: FieldRowProps) {
    return (
        <div>
            <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                    <p className="mb-1 font-poppins text-lg font-medium text-smile-primary">
                        {label}
                    </p>
                    {children}
                </div>
                <span className="mb-2 shrink-0 text-smile-primary">{icon}</span>
            </div>
            <div className="h-px w-full bg-smile-primary" />
            {error && (
                <p className="mt-1 font-inter text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────
export function RegisterForm() {
    const { register: registerUser, isRegisterPending, registerError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                password: data.password,
            });
        } catch {
            // captured in registerError
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white py-8">
            {/* ── Decorative blobs ── */}
            <div className="pointer-events-none absolute -right-20 top-12 h-96 w-96 rounded-full bg-smile-primary-light opacity-70 blur-[60px]" />
            <div className="pointer-events-none absolute bottom-36 left-10 h-[590px] w-96 rounded-full bg-smile-primary-light opacity-50 blur-[60px]" />

            {/* ── Glassy block top-right (flipped) ── */}
            <div className="pointer-events-none absolute -right-12 -top-8 h-[369px] w-[323px] opacity-80"
                style={{ transform: "matrix(-0.99, -0.13, -0.13, 0.99, 0, 0)" }}>
                <Image
                    src="/images/landing/glassy-block.svg"
                    alt=""
                    width={323}
                    height={369}
                    className="h-full w-full object-contain"
                />
            </div>

            {/* ── Glassy tooth bottom-left ── */}
            <div className="pointer-events-none absolute bottom-8 left-48 rotate-[25.88deg] opacity-70">
                <Image
                    src="/images/landing/glassy-tooth.svg"
                    alt=""
                    width={238}
                    height={271}
                    className="object-contain"
                />
            </div>

            {/* ── Logo top-left ── */}
            <Link
                href={ROUTES.HOME}
                className="absolute left-4 top-4 flex items-center gap-2"
            >
                <Image
                    src="/images/landing/logo.svg"
                    alt="S.M.I.L.E"
                    width={32}
                    height={32}
                />
                <span className="font-poppins text-2xl font-medium tracking-[2.4px] text-smile-primary">
                    SMILE
                </span>
            </Link>

            {/* ── Glassmorphism card ── */}
            <div className="relative z-10 mx-4 w-full max-w-[515px] rounded-[40px] bg-white/[0.02] px-12 py-10 shadow-[0px_5px_5px_rgba(0,0,0,0.25),inset_-2px_-2px_4px_rgba(255,255,255,0.25),inset_2px_2px_4px_rgba(255,255,255,0.25)] backdrop-blur-[10px]">
                {/* Heading */}
                <h1 className="mb-2 font-poppins text-7xl font-semibold leading-none tracking-tight text-smile-primary md:text-[80px]">
                    {t("auth.signUpTitle", "SIGN UP")}
                </h1>
                <p className="mb-8 font-poppins text-base font-medium text-smile-title">
                    {t("auth.signUpSubtitle", "Join the future of dental care excellence")}
                </p>

                {/* Error banner */}
                {registerError && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 font-inter text-sm text-red-600">
                        {registerError.message || t("auth.registrationFailed")}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                    {/* Full name: first + last side by side */}
                    <div>
                        <p className="mb-1 font-poppins text-lg font-medium text-smile-primary">
                            {t("auth.fullNameLabel", "Full name")}
                        </p>
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    placeholder={t("auth.firstNamePlaceholder")}
                                    className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                                    {...register("firstName")}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    placeholder={t("auth.lastNamePlaceholder")}
                                    className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                                    {...register("lastName")}
                                />
                            </div>
                            <span className="mb-1 shrink-0 text-smile-primary">
                                <Icon icon="lucide:user" width={24} />
                            </span>
                        </div>
                        <div className="h-px w-full bg-smile-primary" />
                        {(errors.firstName || errors.lastName) && (
                            <p className="mt-1 font-inter text-xs text-red-500">
                                {errors.firstName?.message ?? errors.lastName?.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <FieldRow
                        label={t("auth.emailLabel", "Email")}
                        icon={<Icon icon="lucide:mail" width={24} />}
                        error={errors.email?.message}
                    >
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="your@email.com"
                            className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                            {...register("email")}
                        />
                    </FieldRow>

                    {/* Phone number */}
                    <FieldRow
                        label={t("auth.phoneLabel", "Phone number")}
                        icon={<Icon icon="lucide:phone" width={24} />}
                        error={errors.phone?.message}
                    >
                        <input
                            type="tel"
                            autoComplete="tel"
                            placeholder="+84 123 456 789"
                            className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                            {...register("phone")}
                        />
                    </FieldRow>

                    {/* Password */}
                    <FieldRow
                        label={t("auth.passwordLabel", "Password")}
                        icon={
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                                className="text-smile-primary"
                            >
                                {showPassword ? <Icon icon="lucide:eye-off" width={24} /> : <Icon icon="lucide:eye" width={24} />}
                            </button>
                        }
                        error={errors.password?.message}
                    >
                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                            {...register("password")}
                        />
                    </FieldRow>

                    {/* Confirm password */}
                    <FieldRow
                        label={t("auth.confirmPasswordLabel", "Confirm password")}
                        icon={
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((p) => !p)}
                                aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                                className="text-smile-primary"
                            >
                                {showConfirmPassword ? <Icon icon="lucide:eye-off" width={24} /> : <Icon icon="lucide:eye" width={24} />}
                            </button>
                        }
                        error={errors.confirmPassword?.message}
                    >
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="w-full bg-transparent font-poppins text-base text-smile-title outline-none placeholder:text-smile-description"
                            {...register("confirmPassword")}
                        />
                    </FieldRow>

                    {/* Remember me */}
                    <div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-5 w-5 cursor-pointer rounded bg-smile-border accent-smile-primary"
                            />
                            <span className="font-inter text-sm font-medium text-smile-title">
                                {t("auth.rememberMe", "Remember me")}
                            </span>
                        </label>
                    </div>

                    {/* REGISTER button */}
                    <button
                        type="submit"
                        disabled={isRegisterPending}
                        className="flex h-[67px] w-full items-center justify-center rounded-[15px] bg-smile-primary font-poppins text-xl font-semibold tracking-[4px] text-white shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.2),inset_0px_2px_4px_rgba(255,255,255,0.4)] backdrop-blur-[5px] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {isRegisterPending ? (
                            <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin" />
                        ) : (
                            t("auth.registerButton", "R E G I S T E R")
                        )}
                    </button>
                </form>

                {/* OR divider */}
                <div className="relative my-6 flex items-center">
                    <div className="flex-1 border-t border-smile-border" />
                    <span className="px-4 font-inter text-xs font-semibold uppercase tracking-[1.2px] text-smile-title">
                        {t("auth.orContinueWith")}
                    </span>
                    <div className="flex-1 border-t border-smile-border" />
                </div>

                {/* Google SSO */}
                <button
                    type="button"
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[rgba(195,199,206,0.3)] bg-white/40 font-inter text-base font-semibold text-[#121D21] transition-colors hover:bg-white/60"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" />
                        <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00" />
                        <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3037 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50" />
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2" />
                    </svg>
                    {t("auth.google")}
                </button>

                {/* Login link */}
                <div className="mt-6 flex items-center justify-center gap-1">
                    <span className="font-poppins text-sm font-medium text-smile-title">
                        {t("auth.hasAccount", "Already have an account?")}
                    </span>
                    <Link
                        href={ROUTES.LOGIN}
                        className="font-poppins text-sm font-semibold text-smile-primary transition-colors hover:underline"
                    >
                        {t("auth.loginNow", "Login now")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
