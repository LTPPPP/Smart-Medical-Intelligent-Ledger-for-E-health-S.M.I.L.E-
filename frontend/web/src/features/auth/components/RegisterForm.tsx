"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Icon } from "@iconify/react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";

import { ROUTES } from "@/shared/constants";
import {
	GENDER,
	GENDER_LABELS,
	type GENDER_TYPE,
} from "@/shared/constants/common";
import { ENV } from "@/shared/constants/env";
import { FIELD_LIMITS } from "@/shared/constants/field-limits";
import { extractApiError, toast } from "@/shared/lib/toast";
import { collectErrors, registerFormSchema } from "@/shared/lib/validators";

import { useAuth } from "../hooks/useAuth";

// firstName + lastName are joined into full_name, so each half gets half the width.
const HALF_NAME = Math.floor(FIELD_LIMITS.fullName / 2);

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
			<p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
				{label}
			</p>
			<div className="flex items-center gap-3 rounded-lg pb-2 transition-shadow duration-150 group-focus-within:shadow-[0_0_0_3px_rgba(65,126,170,0.12)]">
				<Icon
					icon={icon}
					width={15}
					className="shrink-0 text-smile-primary/70"
				/>
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

// Section divider label
function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-2">
			<span className="h-px w-4 shrink-0 rounded-full bg-smile-primary/50" />
			<p className="font-inter text-[11px] font-bold uppercase tracking-[2px] text-smile-primary/80">
				{children}
			</p>
			<span
				className="h-px flex-1 rounded-full"
				style={{ background: "var(--surface-panel-border)" }}
			/>
		</div>
	);
}

// Gender chip
function GenderChip({
	value,
	current,
	icon,
	onChange,
}: {
	value: GENDER_TYPE;
	current: GENDER_TYPE;
	icon: string;
	onChange: (v: GENDER_TYPE) => void;
}) {
	const active = current === value;
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={
				"flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 font-inter text-xs font-semibold transition-all " +
				(active
					? "border-smile-primary bg-smile-primary-light text-smile-primary shadow-[0_2px_8px_rgba(65,126,170,0.2)]"
					: "text-smile-description hover:border-smile-primary/40 hover:text-smile-primary")
			}
			style={
				!active ? { borderColor: "var(--surface-panel-border)" } : undefined
			}
		>
			<Icon icon={icon} width={13} />
			{GENDER_LABELS[value]}
		</button>
	);
}

function GoogleRegisterButton({
	googleLogin,
	isGoogleLoggingIn,
}: {
	googleLogin: (variables: {
		accessToken: string;
		callbackUrl?: string;
	}) => Promise<unknown>;
	isGoogleLoggingIn: boolean;
}) {
	const loginWithGoogle = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			try {
				await googleLogin({ accessToken: tokenResponse.access_token });
			} catch {
				// error handled inside googleLoginMutation
			}
		},
		onError: () => toast.error("Google login failed. Please try again."),
	});

	return (
		<button
			type="button"
			onClick={() => loginWithGoogle()}
			disabled={isGoogleLoggingIn}
			className="flex w-full items-center justify-center gap-3 rounded-full border py-2.5 font-inter text-sm font-medium text-smile-title transition-all hover:text-smile-primary disabled:cursor-not-allowed disabled:opacity-60"
			style={{
				borderColor: "var(--surface-card-border)",
				background: "var(--surface-panel-bg)",
			}}
		>
			{isGoogleLoggingIn ? (
				<Icon icon="line-md:loading-twotone-loop" width={18} />
			) : (
				<Icon icon="flat-color-icons:google" width={18} />
			)}
			Continue with Google
		</button>
	);
}

function DisabledGoogleRegisterButton() {
	return (
		<button
			type="button"
			disabled
			className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border py-2.5 font-inter text-sm font-medium text-smile-description opacity-60"
			style={{
				borderColor: "var(--surface-card-border)",
				background: "var(--surface-panel-bg)",
			}}
		>
			<Icon icon="flat-color-icons:google" width={18} />
			Continue with Google
		</button>
	);
}

// Main
export function RegisterForm() {
	const {
		register: registerUser,
		isRegistering,
		registerError,
		googleLogin,
		isGoogleLoggingIn,
	} = useAuth();
	const isGoogleAuthConfigured = Boolean(ENV.GOOGLE_CLIENT_ID);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		username: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		gender: GENDER.MALE as GENDER_TYPE,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = () => {
		// Schema-driven: adds the column-width caps and gender-code check the
		// hand-rolled version had no way to express.
		const e = collectErrors(registerFormSchema, form);
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		try {
			await registerUser({
				username: form.username,
				fullName: (form.firstName + " " + form.lastName).trim(),
				email: form.email,
				phone: form.phone || undefined,
				password: form.password,
				gender: form.gender,
			});
		} catch {
			/* captured in registerError */
		}
	};

	const errorMsg = registerError
		? extractApiError(registerError, "Registration failed. Please try again.")
		: null;

	return (
		<div className="relative flex h-screen overflow-hidden bg-background">
			{/* LEFT — Form panel */}
			<div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 lg:px-12">
				{/* Mobile-only blobs */}
				<div className="liquid-blob pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-blob-primary lg:hidden" />
				<div className="liquid-blob-slow pointer-events-none absolute -left-16 bottom-16 h-64 w-64 rounded-full bg-blob-secondary lg:hidden" />

				{/* Mobile logo */}
				<Link
					href={ROUTES.HOME}
					className="mb-6 flex items-center gap-2 lg:hidden"
				>
					<Image
						src="/images/logo.png"
						alt="S.M.I.L.E"
						width={30}
						height={30}
					/>
					<span className="font-poppins text-xl font-semibold tracking-[2px] text-smile-primary">
						S.M.I.L.E
					</span>
				</Link>

				{/* Card wrapper — ambient glow + floating decoration bleed outside the clipped card */}
				<div className="relative w-full max-w-lg">
					{/* Soft ambient glow behind the card for depth */}
					<div
						className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] opacity-70 blur-2xl"
						style={{
							background:
								"radial-gradient(60% 60% at 50% 0%, rgba(65,126,170,0.16), transparent 70%)",
						}}
					/>
					{/* Decorative tooth corner — floating, bleeds over the top-left corner */}
					<motion.div
						animate={{ y: [0, -10, 0], rotate: [-12, -8, -12] }}
						transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
						className="pointer-events-none absolute -left-6 -top-6 z-0 opacity-30"
					>
						<Image
							src="/images/glassy_tooth.png"
							alt=""
							width={80}
							height={90}
							className="object-contain"
						/>
					</motion.div>

					{/* ── Glass card ── */}
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, ease: "easeOut" }}
						className="relative z-10 w-full overflow-hidden rounded-[20px] border px-8 py-8 backdrop-blur-md"
						style={{
							background: "var(--surface-card-bg)",
							borderColor: "var(--surface-card-border)",
							boxShadow: "var(--surface-card-shadow)",
						}}
					>
						{/* Accent top bar — clipped to the card's rounded corners, no overflow */}
						<div
							className="absolute inset-x-0 top-0 h-[3px]"
							style={{
								background:
									"linear-gradient(90deg, var(--color-smile-primary), #60A5FA, var(--color-smile-primary))",
							}}
						/>
						{/* Soft top highlight for glass depth */}
						<div
							className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
							style={{
								background:
									"radial-gradient(60% 100% at 50% 0%, rgba(96,165,250,0.10), transparent 75%)",
							}}
						/>

						<h1 className="font-poppins text-5xl font-bold leading-none tracking-tight text-smile-primary">
							SIGN UP
						</h1>
						<p className="mb-5 mt-2 font-inter text-sm text-smile-description">
							Create your S.M.I.L.E account
						</p>

						{/* Error banner */}
						{errorMsg && (
							<motion.div
								key={errorMsg}
								initial={{ opacity: 0, x: 0 }}
								animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
								transition={{ duration: 0.4 }}
								className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-inter text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400"
							>
								<Icon icon="lucide:alert-circle" width={15} />
								{errorMsg}
							</motion.div>
						)}

						<form onSubmit={onSubmit} className="space-y-5">
							{/* Section: Personal Info */}
							<div className="space-y-4">
								<SectionLabel>Personal Info</SectionLabel>

								<div className="grid grid-cols-2 gap-4">
									<Field
										label="First Name"
										icon="lucide:user"
										error={errors.firstName}
									>
										<input
											type="text"
											autoComplete="given-name"
											placeholder="First name"
											maxLength={HALF_NAME}
											value={form.firstName}
											onChange={(e) =>
												setForm({ ...form, firstName: e.target.value })
											}
											className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
										/>
									</Field>
									<Field
										label="Last Name"
										icon="lucide:user"
										error={errors.lastName}
									>
										<input
											type="text"
											autoComplete="family-name"
											placeholder="Last name"
											maxLength={HALF_NAME}
											value={form.lastName}
											onChange={(e) =>
												setForm({ ...form, lastName: e.target.value })
											}
											className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
										/>
									</Field>
								</div>

								<div>
									<p className="mb-2 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
										Gender
									</p>
									<div className="flex gap-2">
										<GenderChip
											value={GENDER.MALE}
											icon="lucide:mars"
											current={form.gender}
											onChange={(g) => setForm({ ...form, gender: g })}
										/>
										<GenderChip
											value={GENDER.FEMALE}
											icon="lucide:venus"
											current={form.gender}
											onChange={(g) => setForm({ ...form, gender: g })}
										/>
										<GenderChip
											value={GENDER.UNKNOWN}
											icon="lucide:circle"
											current={form.gender}
											onChange={(g) => setForm({ ...form, gender: g })}
										/>
									</div>
								</div>
							</div>

							{/* Section: Account */}
							<div className="space-y-4">
								<SectionLabel>Account</SectionLabel>

								<div className="grid grid-cols-2 gap-4">
									<Field
										label="Username"
										icon="lucide:at-sign"
										error={errors.username}
									>
										<input
											type="text"
											autoComplete="username"
											placeholder="your_username"
											maxLength={FIELD_LIMITS.username}
											value={form.username}
											onChange={(e) =>
												setForm({ ...form, username: e.target.value })
											}
											className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
										/>
									</Field>
									<Field label="Email" icon="lucide:mail" error={errors.email}>
										<input
											type="email"
											autoComplete="email"
											placeholder="your@email.com"
											maxLength={FIELD_LIMITS.email}
											value={form.email}
											onChange={(e) =>
												setForm({ ...form, email: e.target.value })
											}
											className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
										/>
									</Field>
								</div>

								<Field label="Phone (optional)" icon="lucide:phone">
									<input
										type="tel"
										autoComplete="tel"
										placeholder="+84 xxx xxx xxx"
										maxLength={FIELD_LIMITS.phone}
										value={form.phone}
										onChange={(e) =>
											setForm({ ...form, phone: e.target.value })
										}
										className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
									/>
								</Field>
							</div>

							{/* Section: Security */}
							<div className="space-y-4">
								<SectionLabel>Security</SectionLabel>

								<div className="grid grid-cols-2 gap-4">
									<Field
										label="Password"
										icon="lucide:lock"
										error={errors.password}
									>
										<div className="flex items-center gap-1.5">
											<input
												type={showPassword ? "text" : "password"}
												autoComplete="new-password"
												placeholder="Min. 8 chars"
												maxLength={FIELD_LIMITS.password}
												value={form.password}
												onChange={(e) =>
													setForm({ ...form, password: e.target.value })
												}
												className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
											/>
											<button
												type="button"
												onClick={() => setShowPassword((p) => !p)}
												className="shrink-0 text-smile-description hover:text-smile-primary"
											>
												<Icon
													icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
													width={14}
												/>
											</button>
										</div>
									</Field>
									<Field
										label="Confirm"
										icon="lucide:lock"
										error={errors.confirmPassword}
									>
										<div className="flex items-center gap-1.5">
											<input
												type={showConfirm ? "text" : "password"}
												autoComplete="new-password"
												placeholder="Repeat"
												maxLength={FIELD_LIMITS.password}
												value={form.confirmPassword}
												onChange={(e) =>
													setForm({ ...form, confirmPassword: e.target.value })
												}
												className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
											/>
											<button
												type="button"
												onClick={() => setShowConfirm((p) => !p)}
												className="shrink-0 text-smile-description hover:text-smile-primary"
											>
												<Icon
													icon={showConfirm ? "lucide:eye-off" : "lucide:eye"}
													width={14}
												/>
											</button>
										</div>
									</Field>
								</div>
							</div>

							{/* Submit */}
							<button
								type="submit"
								disabled={isRegistering}
								className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_24px_rgba(65,126,170,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isRegistering && (
									<Icon icon="line-md:loading-twotone-loop" width={16} />
								)}
								Create Account
							</button>
						</form>

						{/* Divider */}
						<div className="my-4 flex items-center gap-3">
							<div
								className="h-px flex-1"
								style={{ background: "var(--surface-panel-border)" }}
							/>
							<span className="font-inter text-[11px] text-smile-description">
								or
							</span>
							<div
								className="h-px flex-1"
								style={{ background: "var(--surface-panel-border)" }}
							/>
						</div>

						{/* Google */}
						{isGoogleAuthConfigured ? (
							<GoogleRegisterButton
								googleLogin={googleLogin}
								isGoogleLoggingIn={isGoogleLoggingIn}
							/>
						) : (
							<DisabledGoogleRegisterButton />
						)}

						<p className="mt-5 text-center font-inter text-sm text-smile-description">
							Already have an account?{" "}
							<Link
								href={ROUTES.LOGIN}
								className="font-semibold text-smile-primary hover:underline"
							>
								Sign In
							</Link>
						</p>
					</motion.div>
				</div>
			</div>

			{/* RIGHT — Brand panel */}
			<div
				className="relative hidden lg:flex lg:w-[40%] lg:flex-col lg:overflow-hidden"
				style={{
					background:
						"linear-gradient(155deg, var(--color-smile-primary) 0%, #2a6494 50%, var(--color-smile-primary-dark) 100%)",
				}}
			>
				{/* Ambient glows */}
				<div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-white/8 blur-[90px]" />
				<div className="pointer-events-none absolute -left-16 bottom-20 h-80 w-80 rounded-full bg-white/6 blur-[110px]" />
				<div
					className="pointer-events-none absolute right-1/3 top-2/5 h-40 w-40 rounded-full blur-[60px]"
					style={{ background: "rgba(96, 165, 250,0.18)" }}
				/>

				{/* Top content block */}
				<div className="relative z-10 flex flex-shrink-0 flex-col px-10 pt-8">
					{/* Logo */}
					<Link href={ROUTES.HOME} className="flex items-center gap-3">
						<Image
							src="/images/logo.png"
							alt="S.M.I.L.E"
							width={46}
							height={46}
							className="drop-shadow-xl"
						/>
						<div>
							<p className="font-poppins text-xl font-bold tracking-[4px] text-white">
								S.M.I.L.E
							</p>
							<p className="font-inter text-[10px] tracking-[1.5px] text-white/50">
								DENTAL PLATFORM
							</p>
						</div>
					</Link>

					{/* Divider */}
					<div className="mt-5 flex items-center gap-3">
						<div className="h-[2px] w-3 rounded-full bg-smile-accent/70" />
						<div className="h-[2px] w-10 rounded-full bg-white/40" />
					</div>

					{/* Hero heading */}
					<h2 className="mt-4 font-poppins text-[40px] font-extrabold leading-[1.08] tracking-tight text-white">
						Join <span className="text-smile-accent">10,000+</span>
						<br />
						patients today.
					</h2>
					<p className="mt-3 font-inter text-sm leading-relaxed text-white/65">
						Your complete dental health
						<br />
						management platform.
					</p>

					{/* Features with bullets */}
					<div className="mt-6 space-y-2.5">
						{(
							[
								{
									icon: "lucide:calendar-check",
									text: "Smart appointment scheduling",
								},
								{ icon: "lucide:file-text", text: "Digital health records" },
								{
									icon: "lucide:brain-circuit",
									text: "AI-powered diagnostics",
								},
								{
									icon: "lucide:shield-check",
									text: "Private & secure records",
								},
							] as const
						).map((f) => (
							<div key={f.text} className="flex items-center gap-3">
								<div
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
									style={{
										background: "rgba(255,255,255,0.12)",
										backdropFilter: "blur(8px)",
									}}
								>
									<Icon icon={f.icon} width={15} className="text-white" />
								</div>
								<span className="font-inter text-[13px] font-medium text-white/80">
									{f.text}
								</span>
							</div>
						))}
					</div>

					{/* Stats strip */}
					<div className="mt-6 flex items-center gap-8 border-t border-white/15 pt-4">
						{(
							[
								{ val: "10K+", lbl: "Patients" },
								{ val: "50+", lbl: "Clinics" },
								{ val: "99%", lbl: "Uptime" },
							] as const
						).map((s) => (
							<div key={s.lbl}>
								<p className="font-poppins text-xl font-extrabold text-white">
									{s.val}
								</p>
								<p className="font-inter text-[11px] text-white/50">{s.lbl}</p>
							</div>
						))}
					</div>
				</div>

				{/* Teeth image — fills remaining height */}
				<motion.div
					animate={{ y: [0, -10, 0] }}
					transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
					className="relative z-10 min-h-0 flex-1"
				>
					<Image
						src="/images/glassy_teeth.png"
						alt=""
						fill
						className="object-contain object-bottom drop-shadow-2xl"
					/>
				</motion.div>

				{/* Floating tool */}
				<motion.div
					animate={{ y: [0, -12, 0], rotate: [18, 24, 18] }}
					transition={{
						duration: 4.5,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 0.8,
					}}
					className="pointer-events-none absolute right-5 top-32 opacity-40"
				>
					<Image
						src="/images/glassy_tool.png"
						alt=""
						width={88}
						height={88}
						className="object-contain"
					/>
				</motion.div>

				{/* Floating block */}
				<motion.div
					animate={{ y: [0, 10, 0], rotate: [-8, -3, -8] }}
					transition={{
						duration: 6,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1.5,
					}}
					className="pointer-events-none absolute left-6 top-1/2 opacity-25"
				>
					<Image
						src="/images/glassy_block.png"
						alt=""
						width={72}
						height={72}
						className="object-contain"
					/>
				</motion.div>
			</div>
		</div>
	);
}

export default RegisterForm;
