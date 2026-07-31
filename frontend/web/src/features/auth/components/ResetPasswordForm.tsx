"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export function ResetPasswordForm() {
	const { t } = useTranslation();
	const searchParams = useSearchParams();
	// The reset email links to /reset-password?hash=... (IAM uses ?hash; accept ?token too).
	const hash = searchParams.get("hash") || searchParams.get("token") || "";

	const { resetPasswordByHash, isResettingPassword } = useAuth();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!hash) {
			setError(
				t(
					"auth.missingResetLinkError",
					"Missing or invalid reset link. Please request a new reset email.",
				),
			);
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
			await resetPasswordByHash({ hash, password: form.newPassword });
			setDone(true);
		} catch (requestError) {
			setError(
				extractApiError(
					requestError,
					t(
						"auth.resetFailedExpiredLink",
						"Failed to reset. The link may have expired — request a new reset email.",
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

			<AnimatePresence mode="wait">
				{done ? (
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
				) : (
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
						<div
							className="absolute inset-x-0 top-0 h-[3px]"
							style={{
								background:
									"linear-gradient(90deg, var(--color-smile-primary), #60A5FA, var(--color-smile-primary))",
							}}
						/>
						<div className="px-8 py-9">
							<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-smile-primary/10">
								<Icon
									icon="lucide:key-round"
									width={24}
									className="text-smile-primary"
								/>
							</div>
							<h1 className="font-poppins text-[28px] font-bold leading-snug text-smile-primary">
								{t("auth.setNewPasswordTitle", "Set a new password")}
							</h1>
							<p className="mb-7 mt-2 font-inter text-sm leading-relaxed text-smile-description">
								{t(
									"auth.chooseStrongPasswordSubtitle",
									"Choose a strong password for your account.",
								)}
							</p>

							{!hash && (
								<div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 font-inter text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
									<Icon
										icon="lucide:link-2-off"
										width={15}
										className="mt-0.5 shrink-0"
									/>
									<span>
										{t(
											"auth.invalidResetLinkWarning",
											"This reset link is invalid or missing. Please use the link from your reset email.",
										)}
									</span>
								</div>
							)}

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
												icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
												width={15}
											/>
										</button>
									</div>
								</Field>
								<Field
									label={t("auth.confirmPasswordLabel", "Confirm Password")}
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
												width={15}
											/>
										</button>
									</div>
								</Field>

								<button
									type="submit"
									disabled={isResettingPassword || !hash}
									className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isResettingPassword && (
										<Icon icon="line-md:loading-twotone-loop" width={16} />
									)}
									{isResettingPassword
										? t("auth.resetting", "Resetting...")
										: t("auth.resetPassword", "Reset Password")}
								</button>
							</form>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

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

export default ResetPasswordForm;
