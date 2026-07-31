"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Icon } from "@iconify/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "@/features/i18n";
import { ROUTES } from "@/shared/constants";
import { extractApiError } from "@/shared/lib/toast";

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 16 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: "easeOut" },
	},
	exit: { opacity: 0, y: -14, transition: { duration: 0.22 } },
};

function Field({
	label,
	icon,
	children,
}: { label: string; icon: string; children: React.ReactNode }) {
	return (
		<div className="group">
			<p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
				{label}
			</p>
			<div className="flex items-center gap-3 pb-2.5">
				<Icon
					icon={icon}
					width={15}
					className="shrink-0 text-smile-primary/60"
				/>
				<div className="flex-1">{children}</div>
			</div>
			<div
				className="h-px transition-all duration-200 group-focus-within:bg-smile-primary"
				style={{ background: "var(--surface-panel-border)" }}
			/>
		</div>
	);
}

const STEPS = [
	{ id: "SEND", n: 1 },
	{ id: "RESET", n: 2 },
	{ id: "DONE", n: 3 },
] as const;

function StepBar({ step }: { step: "SEND" | "RESET" | "DONE" }) {
	const { t } = useTranslation();
	const order: Record<string, number> = { SEND: 0, RESET: 1, DONE: 2 };
	const stepLabels: Record<string, string> = {
		SEND: t("auth.stepVerify", "Verify"),
		RESET: t("auth.stepReset", "Reset"),
		DONE: t("auth.stepComplete", "Complete"),
	};
	const cur = order[step];
	return (
		<div className="flex items-center">
			{STEPS.map((s, i) => {
				const done = i < cur;
				const active = i === cur;
				return (
					<div key={s.id} className="flex items-center">
						<div
							className={
								"flex h-8 w-8 items-center justify-center rounded-full border-2 font-inter text-xs font-bold transition-all duration-300 " +
								(done
									? "border-smile-primary bg-smile-primary text-white"
									: active
										? "border-smile-primary bg-smile-primary/10 text-smile-primary shadow-[0_0_12px_rgba(65,126,170,0.3)]"
										: "")
							}
							style={
								!done && !active
									? {
											background: "var(--surface-panel-bg)",
											border: "2px solid var(--surface-panel-border)",
											color: "var(--color-smile-description)",
										}
									: undefined
							}
						>
							{done ? <Icon icon="lucide:check" width={13} /> : s.n}
						</div>
						<span
							className={
								"mx-2 font-inter text-[11px] " +
								(active
									? "font-semibold text-smile-primary"
									: "text-smile-description")
							}
						>
							{stepLabels[s.id]}
						</span>
						{i < STEPS.length - 1 && (
							<div
								className="mr-2 h-px w-8 rounded-full transition-all duration-500"
								style={{
									background:
										i < cur
											? "var(--color-smile-primary)"
											: "var(--surface-panel-border)",
								}}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function ForgotPasswordForm() {
	const { t } = useTranslation();
	const {
		forgotPassword,
		resetPassword,
		isForgotPassword,
		isResettingPassword,
	} = useAuth();
	const [step, setStep] = useState<"SEND" | "RESET" | "DONE">("SEND");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({
		emailOrPhone: "",
		otp: "",
		newPassword: "",
		confirmPassword: "",
	});

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.emailOrPhone) {
			setError(t("auth.enterEmailOrPhoneError", "Please enter your email or phone"));
			return;
		}
		try {
			setError("");
			await forgotPassword({ emailOrPhone: form.emailOrPhone });
			setStep("RESET");
		} catch (requestError) {
			setError(
				extractApiError(
					requestError,
					t(
						"auth.sendOtpFailed",
						"Failed to send OTP. Please check your email or phone and try again.",
					),
				),
			);
		}
	};

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.otp) {
			setError(t("auth.enterOtpError", "Please enter the OTP code"));
			return;
		}
		if (!form.newPassword) {
			setError(t("auth.enterNewPasswordError", "Please enter a new password"));
			return;
		}
		if (form.newPassword.length < 8) {
			setError(
				t("auth.passwordMinLengthError", "Password must be at least 8 characters"),
			);
			return;
		}
		if (form.newPassword !== form.confirmPassword) {
			setError(t("auth.passwordsMismatchError", "Passwords do not match"));
			return;
		}
		try {
			setError("");
			await resetPassword({
				emailOrPhone: form.emailOrPhone,
				otp: form.otp,
				newPassword: form.newPassword,
			});
			setStep("DONE");
		} catch (requestError) {
			setError(
				extractApiError(
					requestError,
					t(
						"auth.resetFailedCheckOtp",
						"Failed to reset. Please check your OTP and try again.",
					),
				),
			);
		}
	};

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
			{/* Background blobs */}
			<div
				className="pointer-events-none absolute -left-40 -top-24 h-[480px] w-[480px] rounded-full liquid-blob"
				style={{ background: "var(--blob-primary)" }}
			/>
			<div
				className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full liquid-blob-slow"
				style={{ background: "var(--blob-secondary)" }}
			/>
			<div
				className="pointer-events-none absolute bottom-1/4 left-1/4 h-56 w-56 rounded-full blur-[60px]"
				style={{ background: "rgba(96, 165, 250,0.07)" }}
			/>

			{/* Floating decorative images */}
			<motion.div
				animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
				transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
				className="pointer-events-none absolute right-[8%] top-[14%] opacity-30 hidden md:block"
			>
				<Image
					src="/images/glassy_tooth.png"
					alt=""
					width={90}
					height={110}
					className="object-contain"
				/>
			</motion.div>
			<motion.div
				animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
				transition={{
					duration: 6,
					repeat: Infinity,
					ease: "easeInOut",
					delay: 1.2,
				}}
				className="pointer-events-none absolute left-[6%] bottom-[16%] opacity-30 hidden md:block"
			>
				<Image
					src="/images/glassy_tool.png"
					alt=""
					width={80}
					height={80}
					className="object-contain"
				/>
			</motion.div>
			<motion.div
				animate={{ y: [0, -10, 0] }}
				transition={{
					duration: 4.5,
					repeat: Infinity,
					ease: "easeInOut",
					delay: 0.6,
				}}
				className="pointer-events-none absolute left-[10%] top-[12%] opacity-20 hidden lg:block"
			>
				<Image
					src="/images/glassy_block.png"
					alt=""
					width={70}
					height={70}
					className="object-contain"
				/>
			</motion.div>

			{/* Logo */}
			<motion.div
				initial={{ opacity: 0, y: -12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="mb-7 flex flex-col items-center gap-1"
			>
				<Link href={ROUTES.HOME} className="flex items-center gap-2.5">
					<Image
						src="/images/logo.png"
						alt="S.M.I.L.E"
						width={42}
						height={42}
						className="drop-shadow-md"
					/>
					<span className="font-poppins text-2xl font-semibold tracking-[3px] text-smile-primary">
						S.M.I.L.E
					</span>
				</Link>
				<p className="font-inter text-xs text-smile-description">
					{t("auth.tagline", "Smart Dental Platform")}
				</p>
			</motion.div>

			{/* Step bar */}
			<AnimatePresence>
				{step !== "DONE" && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="mb-5"
					>
						<StepBar step={step} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Card */}
			<AnimatePresence mode="wait">
				{/* Done */}
				{step === "DONE" && (
					<motion.div
						key="done"
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="relative w-full max-w-[400px] rounded-[28px] border px-8 py-10 text-center backdrop-blur-md"
						style={{
							background: "var(--surface-card-bg)",
							borderColor: "var(--surface-card-border)",
							boxShadow: "var(--surface-card-shadow)",
						}}
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
							className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40"
						>
							<Icon
								icon="lucide:check-circle"
								width={46}
								className="text-green-500"
							/>
						</motion.div>
						<h2 className="font-poppins text-2xl font-bold text-smile-primary">
							{t("auth.allDone", "All done!")}
						</h2>
						<p className="mt-2 font-inter text-sm leading-relaxed text-smile-description">
							{t("auth.passwordResetDone", "Your password has been reset.")}
							<br />
							{t(
								"auth.signInWithNewPassword",
								"You can now sign in with your new password.",
							)}
						</p>
						<Link
							href={ROUTES.LOGIN}
							className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:arrow-left" width={15} />
							{t("auth.backToLogin", "Back to Sign In")}
						</Link>
					</motion.div>
				)}

				{/* Send / Reset card */}
				{step !== "DONE" && (
					<motion.div
						key="card"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border backdrop-blur-md"
						style={{
							background: "var(--surface-card-bg)",
							borderColor: "var(--surface-card-border)",
							boxShadow: "var(--surface-card-shadow)",
						}}
					>
						{/* Accent top bar */}
						<div
							className="absolute inset-x-0 top-0 h-[3px]"
							style={{
								background:
									"linear-gradient(90deg, var(--color-smile-primary), #60A5FA, var(--color-smile-primary))",
							}}
						/>

						<div className="px-8 py-9">
							<AnimatePresence mode="wait">
								{/* Step 1: send */}
								{step === "SEND" && (
									<motion.div
										key="send"
										variants={fadeUp}
										initial="hidden"
										animate="visible"
										exit="exit"
									>
										<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-smile-primary/10">
											<Icon
												icon="lucide:mail-open"
												width={24}
												className="text-smile-primary"
											/>
										</div>
										<h1 className="font-poppins text-[28px] font-bold leading-snug text-smile-primary">
											{t("auth.forgotPasswordTitle", "Forgot your password?")}
										</h1>
										<p className="mb-7 mt-2 font-inter text-sm leading-relaxed text-smile-description">
											{t(
												"auth.forgotPasswordDescription",
												"Enter the email or phone linked to your account and we'll send a reset code.",
											)}
										</p>

										{error && (
											<div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 font-inter text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
												<Icon
													icon="lucide:alert-circle"
													width={15}
													className="mt-0.5 shrink-0"
												/>
												<span>{error}</span>
											</div>
										)}

										<form onSubmit={handleSend} className="space-y-7">
											<Field
												label={t("auth.emailOrPhoneLabel", "Email or Phone")}
												icon="lucide:at-sign"
											>
												<input
													type="text"
													placeholder={t(
														"auth.emailOrPhonePlaceholder",
														"your@email.com or 0xxxxxxxxx",
													)}
													value={form.emailOrPhone}
													onChange={(e) =>
														setForm({ ...form, emailOrPhone: e.target.value })
													}
													className="w-full bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
												/>
											</Field>
											<button
												type="submit"
												disabled={isForgotPassword}
												className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
											>
												{isForgotPassword && (
													<Icon
														icon="line-md:loading-twotone-loop"
														width={16}
													/>
												)}
												{isForgotPassword
													? t("auth.sending", "Sending...")
													: t("auth.sendResetCode", "Send Reset Code")}
											</button>
										</form>
									</motion.div>
								)}

								{/* Step 2: reset */}
								{step === "RESET" && (
									<motion.div
										key="reset"
										variants={fadeUp}
										initial="hidden"
										animate="visible"
										exit="exit"
									>
										<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-smile-primary/10">
											<Icon
												icon="lucide:key-round"
												width={24}
												className="text-smile-primary"
											/>
										</div>
										<h1 className="font-poppins text-[28px] font-bold leading-snug text-smile-primary">
											{t("auth.resetYourPasswordTitle", "Reset your password")}
										</h1>
										<p className="mb-7 mt-2 font-inter text-sm leading-relaxed text-smile-description">
											{t("auth.codeSentTo", "Code sent to")}{" "}
											<span className="font-semibold text-smile-primary">
												{form.emailOrPhone}
											</span>
											{t("auth.enterCodeBelow", ". Enter it below.")}
										</p>

										{error && (
											<div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 font-inter text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
												<Icon
													icon="lucide:alert-circle"
													width={15}
													className="mt-0.5 shrink-0"
												/>
												<span>{error}</span>
											</div>
										)}

										<form onSubmit={handleReset} className="space-y-5">
											<Field
												label={t("auth.otpCodeLabel", "OTP Code")}
												icon="lucide:shield-check"
											>
												<input
													type="text"
													inputMode="numeric"
													maxLength={6}
													placeholder="● ● ● ● ● ●"
													value={form.otp}
													onChange={(e) =>
														setForm({
															...form,
															otp: e.target.value.replace(/\D/g, ""),
														})
													}
													className="w-full bg-transparent font-poppins text-lg tracking-[8px] text-smile-title outline-none placeholder:text-xs placeholder:tracking-[6px] placeholder:text-smile-description"
												/>
											</Field>
											<Field
												label={t("auth.newPasswordLabel", "New Password")}
												icon="lucide:lock"
											>
												<div className="flex items-center gap-2">
													<input
														type={showPassword ? "text" : "password"}
														placeholder={t(
															"auth.minEightCharsPlaceholder",
															"Min. 8 characters",
														)}
														value={form.newPassword}
														onChange={(e) =>
															setForm({ ...form, newPassword: e.target.value })
														}
														className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
													/>
													<button
														type="button"
														onClick={() => setShowPassword((p) => !p)}
														className="shrink-0 text-smile-description hover:text-smile-primary"
													>
														<Icon
															icon={
																showPassword ? "lucide:eye-off" : "lucide:eye"
															}
															width={15}
														/>
													</button>
												</div>
											</Field>
											<Field
												label={t(
													"auth.confirmPasswordLabel",
													"Confirm Password",
												)}
												icon="lucide:lock"
											>
												<div className="flex items-center gap-2">
													<input
														type={showConfirm ? "text" : "password"}
														placeholder={t(
															"auth.repeatNewPasswordPlaceholder",
															"Repeat new password",
														)}
														value={form.confirmPassword}
														onChange={(e) =>
															setForm({
																...form,
																confirmPassword: e.target.value,
															})
														}
														className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
													/>
													<button
														type="button"
														onClick={() => setShowConfirm((p) => !p)}
														className="shrink-0 text-smile-description hover:text-smile-primary"
													>
														<Icon
															icon={
																showConfirm ? "lucide:eye-off" : "lucide:eye"
															}
															width={15}
														/>
													</button>
												</div>
											</Field>

											<div className="flex gap-3 pt-1">
												<button
													type="button"
													onClick={() => {
														setStep("SEND");
														setError("");
													}}
													className="flex items-center gap-1.5 rounded-full border px-5 py-3 font-inter text-sm font-semibold text-smile-primary transition-all hover:bg-smile-primary-light"
													style={{ borderColor: "var(--surface-card-border)" }}
												>
													<Icon icon="lucide:arrow-left" width={13} />{" "}
													{t("common.back", "Back")}
												</button>
												<button
													type="submit"
													disabled={isResettingPassword}
													className="flex flex-1 items-center justify-center gap-2 rounded-full bg-smile-primary py-3 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
												>
													{isResettingPassword && (
														<Icon
															icon="line-md:loading-twotone-loop"
															width={16}
														/>
													)}
													{isResettingPassword
														? t("auth.resetting", "Resetting...")
														: t("auth.resetPassword", "Reset Password")}
												</button>
											</div>
										</form>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Footer */}
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.4 }}
				className="mt-6 font-inter text-sm text-smile-description"
			>
				{t("auth.rememberPassword", "Remember your password?")}{" "}
				<Link
					href={ROUTES.LOGIN}
					className="font-semibold text-smile-primary hover:underline"
				>
					{t("auth.login", "Sign In")}
				</Link>
			</motion.p>
		</div>
	);
}

export default ForgotPasswordForm;
