"use client";

import { Fragment, useState, useEffect, useRef } from "react";

import Image from "next/image";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import {
	CldUploadWidget,
	type CloudinaryUploadWidgetResults,
} from "next-cloudinary";

import { usePublicConfig } from "@/app/provider/PublicConfigProvider";
import { BookingDatePicker } from "@/features/appointment/components/BookingDateTimeFields";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
	KYC_MESSAGES,
	getKycErrorMessage,
} from "@/features/auth/utils/kyc-message";
import { useTranslation } from "@/features/i18n";
import { KycStatusTimeline } from "@/features/profile/components/KycStatusTimeline";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { OtpInput, OtpResendButton } from "@/shared/components/common/OtpInput";
import { AppShell } from "@/shared/components/layout/AppShell";
import {
	GENDER,
	GENDER_OPTIONS,
	genderLabel,
	isGenderCode,
	type GENDER_TYPE,
} from "@/shared/constants/common";
import { resolveDashboardKind } from "@/shared/constants/nav";
import { toast } from "@/shared/lib/toast";

// Styled Card
function Card({
	children,
	className = "",
}: { children: React.ReactNode; className?: string }) {
	return (
		<div
			className={"rounded-[24px] border p-6 backdrop-blur-md " + className}
			style={{
				background: "var(--surface-card-bg)",
				borderColor: "var(--surface-card-border)",
				boxShadow: "var(--surface-card-shadow)",
			}}
		>
			{children}
		</div>
	);
}

// Info Field Row
function FieldRow({
	label,
	icon,
	error,
	children,
}: {
	label: string;
	icon?: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="group">
			<p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
				{label}
			</p>
			<div className="flex items-center gap-2 pb-2">
				{icon && (
					<Icon
						icon={icon}
						width={15}
						className="shrink-0 text-smile-primary opacity-70"
					/>
				)}
				<div className="flex-1">{children}</div>
			</div>
			<div
				className="h-px w-full transition-colors group-focus-within:bg-smile-primary"
				style={{ background: "var(--surface-panel-border)" }}
			/>
			{error && <p className="mt-1 font-inter text-xs text-red-500">{error}</p>}
		</div>
	);
}

// Info Item
function InfoItem({
	label,
	value,
	icon,
}: { label: string; value?: string | null; icon: string }) {
	return (
		<div
			className="flex items-start gap-3 rounded-xl border p-4"
			style={{
				background: "var(--surface-footer-bg)",
				borderColor: "var(--surface-panel-border)",
			}}
		>
			<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-smile-primary-light">
				<Icon icon={icon} width={17} className="text-smile-primary" />
			</div>
			<div className="min-w-0">
				<p className="font-inter text-xs text-smile-description">{label}</p>
				<p className="mt-0.5 truncate font-poppins text-sm font-medium text-smile-primary-dark">
					{value || "—"}
				</p>
			</div>
		</div>
	);
}

type KycFileField = "idFront" | "idBack";

export default function ProfilePage() {
	const { t } = useTranslation();
	const { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } = usePublicConfig();
	const { user } = useAuthStore();
	// Exclude Patient
	const isPatient = resolveDashboardKind(user?.roles) === "patient";
	const cloudinaryConfigured = Boolean(
		CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY,
	);
	const {
		updateProfile,
		isUpdatingProfile,
		getAvatarSignature,
		confirmAvatar,
		isConfirmingAvatar,
		kyc,
		kycHistory,
		isLoadingKyc,
		isLoadingKycHistory,
		sendPhoneOtp,
		verifyPhone,
		submitKyc,
		isSendingPhoneOtp,
		isVerifyingPhone,
		isSubmittingKyc,
	} = useAuth();

	const [activeTab, setActiveTab] = useState<
		"info" | "edit" | "password" | "kyc"
	>("info");

	const [profileForm, setProfileForm] = useState({
		fullName: "",
		dateOfBirth: "",
		gender: GENDER.MALE as GENDER_TYPE,
		address: "",
	});

	const [passwordForm, setPasswordForm] = useState({
		newPassword: "",
		confirmPassword: "",
	});
	const [passwordErrors, setPasswordErrors] = useState<{
		newPassword?: string;
		confirmPassword?: string;
	}>({});
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const passwordsMatch =
		passwordForm.confirmPassword.length > 0 &&
		passwordForm.newPassword === passwordForm.confirmPassword;
	const [avatarPreviewError, setAvatarPreviewError] = useState(false);
	const [phoneOtp, setPhoneOtp] = useState("");
	const [showKycHistory, setShowKycHistory] = useState(false);
	const [showConsentDetails, setShowConsentDetails] = useState(false);
	const [cameraField, setCameraField] = useState<KycFileField | null>(null);
	const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
	const [isCameraLoading, setIsCameraLoading] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [showCameraFlash, setShowCameraFlash] = useState(false);
	const [dragOverField, setDragOverField] = useState<KycFileField | null>(null);
	const [filePreviews, setFilePreviews] = useState<
		Partial<Record<KycFileField, string>>
	>({});
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [kycForm, setKycForm] = useState<{
		idNumber: string;
		idFront: File | null;
		idBack: File | null;
		consentAccepted: boolean;
	}>({
		idNumber: "",
		idFront: null,
		idBack: null,
		consentAccepted: false,
	});

	const isKycLocked =
		kyc?.status === "PENDING_REVIEW" || kyc?.status === "VERIFIED";
	const isKycVerified = kyc?.status === "VERIFIED";

	const passwordRequirements = [
		{
			test: passwordForm.newPassword.length >= 8,
			label: t("profile.page.reqAtLeast8", "At least 8 characters"),
		},
		{
			test: /[A-Z]/.test(passwordForm.newPassword),
			label: t("profile.page.reqUppercase", "One uppercase letter"),
		},
		{
			test: /[0-9]/.test(passwordForm.newPassword),
			label: t("profile.page.reqNumber", "One number"),
		},
	];
	const passwordStrengthCount = passwordRequirements.filter(
		(r) => r.test,
	).length;
	const passwordStrengthPct =
		(passwordStrengthCount / passwordRequirements.length) * 100;
	const passwordStrengthColor =
		passwordStrengthCount <= 1
			? "bg-red-400"
			: passwordStrengthCount === 2
				? "bg-amber-400"
				: "bg-emerald-500";

	useEffect(() => {
		if (user) {
			setProfileForm({
				fullName: user.fullName || "",
				dateOfBirth: user.dateOfBirth || "",
				gender: isGenderCode(user.gender) ? user.gender : GENDER.MALE,
				address: "",
			});
		}
	}, [user]);

	useEffect(() => {
		if (!cameraField) return;
		let mounted = true;
		let activeStream: MediaStream | null = null;

		if (!navigator.mediaDevices?.getUserMedia) {
			setCameraError(
				t(
					"profile.page.cameraNotSupported",
					"Camera capture is not supported in this browser. Please upload an image instead.",
				),
			);
			return;
		}

		const startCamera = async () => {
			setIsCameraLoading(true);
			setCameraError(null);
			setCameraStream(null);

			try {
				let stream: MediaStream;
				try {
					stream = await navigator.mediaDevices.getUserMedia({
						video: { facingMode: { ideal: "environment" } },
						audio: false,
					});
				} catch {
					stream = await navigator.mediaDevices.getUserMedia({
						video: true,
						audio: false,
					});
				}

				if (!mounted) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}

				activeStream = stream;
				setCameraStream(stream);
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch {
				if (!mounted) return;
				setCameraError(
					t(
						"profile.page.cameraAccessDenied",
						"Cannot access camera. Please allow camera permission or upload an image instead.",
					),
				);
			} finally {
				if (mounted) setIsCameraLoading(false);
			}
		};

		void startCamera();

		return () => {
			mounted = false;
			activeStream?.getTracks().forEach((track) => track.stop());
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cameraField]);

	useEffect(() => {
		if (videoRef.current && cameraStream) {
			videoRef.current.srcObject = cameraStream;
		}
	}, [cameraStream]);

	// Build File Previews
	useEffect(() => {
		const idFront = kycForm.idFront;
		const idBack = kycForm.idBack;
		const urls: Partial<Record<KycFileField, string>> = {};
		if (idFront) urls.idFront = URL.createObjectURL(idFront);
		if (idBack) urls.idBack = URL.createObjectURL(idBack);
		setFilePreviews(urls);
		return () => {
			if (urls.idFront) URL.revokeObjectURL(urls.idFront);
			if (urls.idBack) URL.revokeObjectURL(urls.idBack);
		};
	}, [kycForm.idFront, kycForm.idBack]);

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await updateProfile({
				fullName: profileForm.fullName || undefined,
				dateOfBirth: profileForm.dateOfBirth || undefined,
				gender: profileForm.gender,
				address: profileForm.address || undefined,
			});
		} catch {
			/* Handled By Hook */
		}
	};

	// Sign Upload Params
	const handleAvatarUploadSignature = async (
		callback: (signature: string) => void,
		paramsToSign: Record<string, string | number | undefined>,
	) => {
		const sig = await getAvatarSignature({
			timestamp: paramsToSign.timestamp
				? Number(paramsToSign.timestamp)
				: undefined,
			source: paramsToSign.source ? String(paramsToSign.source) : undefined,
			custom_coordinates: paramsToSign.custom_coordinates
				? String(paramsToSign.custom_coordinates)
				: undefined,
		});
		callback(sig.signature);
	};

	const handleAvatarUploadSuccess = async (
		result: CloudinaryUploadWidgetResults,
	) => {
		const info = result?.info;
		if (!info || typeof info !== "object" || !("secure_url" in info)) return;
		try {
			await confirmAvatar(info.secure_url as string);
			setAvatarPreviewError(false);
		} catch {
			/* Handled By Hook */
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		const errors: typeof passwordErrors = {};
		if (!passwordForm.newPassword) {
			errors.newPassword = t(
				"profile.page.toastEnterNewPassword",
				"Please enter a new password.",
			);
		} else if (passwordForm.newPassword.length < 8) {
			errors.newPassword = t(
				"profile.page.toastPasswordMinLength",
				"Password must be at least 8 characters.",
			);
		}
		setPasswordErrors(errors);
		if (Object.keys(errors).length > 0) return;
		if (passwordForm.newPassword !== passwordForm.confirmPassword) return;

		try {
			await updateProfile({ password: passwordForm.newPassword });
			setPasswordForm({ newPassword: "", confirmPassword: "" });
		} catch {
			/* Handled By Hook */
		}
	};

	const handleSendPhoneOtp = async () => {
		try {
			const response = await sendPhoneOtp();
			const devOtp = response.data?.devOtp
				? ` ${t("profile.page.toastDevOtpSuffix", "Dev OTP:")} ${response.data.devOtp}`
				: "";
			toast.success(`${t("profile.page.toastOtpSent", "OTP sent.")}${devOtp}`);
		} catch {
			toast.error(
				t("profile.page.toastSendOtpFailed", "Failed to send phone OTP."),
			);
		}
	};

	const handleVerifyPhoneCode = async (code: string) => {
		try {
			await verifyPhone({
				emailOrPhone: user?.phone || "",
				otpCode: code,
				otpType: "PHONE_VERIFY",
			});
			toast.success(
				t("profile.page.toastPhoneVerified", "Phone verified successfully."),
			);
			setPhoneOtp("");
		} catch {
			toast.error(t("profile.page.toastInvalidOtp", "Invalid or expired OTP."));
			setPhoneOtp("");
		}
	};

	const handleSubmitKyc = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isKycLocked) {
			toast.error(
				isKycVerified
					? t(
							"profile.page.toastKycAlreadyVerified",
							"Your KYC is already verified. Resubmission is disabled.",
						)
					: t(
							"profile.page.toastKycPendingReview",
							"Your KYC is pending review. Please wait for admin approval or rejection before submitting again.",
						),
			);
			return;
		}
		const fullName = profileForm.fullName || user?.fullName || "";
		const dateOfBirth = profileForm.dateOfBirth || user?.dateOfBirth || "";

		if (!fullName.trim()) {
			toast.error(
				t(
					"profile.page.toastEnterFullName",
					"Please enter your full name before submitting KYC.",
				),
			);
			return;
		}
		if (!dateOfBirth) {
			toast.error(
				t(
					"profile.page.toastEnterDob",
					"Please enter your date of birth before submitting KYC.",
				),
			);
			return;
		}
		if (!/^\d{12}$/.test(kycForm.idNumber)) {
			toast.error(KYC_MESSAGES.idNumber);
			return;
		}
		if (!kycForm.idFront) {
			toast.error(KYC_MESSAGES.frontImage);
			return;
		}
		if (!kycForm.idBack) {
			toast.error(KYC_MESSAGES.backImage);
			return;
		}
		if (!kycForm.consentAccepted) {
			toast.error(
				t(
					"profile.page.toastAcceptTerms",
					"Please accept the KYC terms before submitting.",
				),
			);
			return;
		}
		try {
			await submitKyc({
				idType: "CITIZEN_ID",
				idNumber: kycForm.idNumber,
				fullName,
				dateOfBirth,
				idFront: kycForm.idFront,
				idBack: kycForm.idBack,
				consentAccepted: kycForm.consentAccepted,
				documentStorageConsentAccepted: kycForm.consentAccepted,
				ocrProcessingConsentAccepted: kycForm.consentAccepted,
				noMarketingConsentAccepted: kycForm.consentAccepted,
				consentVersion: "kyc-consent-v2",
				retentionPolicyVersion: "kyc-retention-v1",
			});
			toast.success(KYC_MESSAGES.processing);
		} catch (error) {
			toast.error(getKycErrorMessage(error));
		}
	};

	const setKycFile = (field: KycFileField, file?: File | null) => {
		if (isKycLocked) return;
		if (!file) return;
		if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
			toast.error(
				t(
					"profile.page.toastInvalidImageFormat",
					"Please upload a JPG, PNG, or WEBP image.",
				),
			);
			return;
		}
		setKycForm((current) => ({ ...current, [field]: file }));
	};

	const clearKycFile = (field: KycFileField) => {
		if (isKycLocked) return;
		setKycForm((current) => ({ ...current, [field]: null }));
	};

	const handleDropFile = (
		event: React.DragEvent<HTMLLabelElement>,
		field: KycFileField,
	) => {
		event.preventDefault();
		event.stopPropagation();
		setDragOverField(null);
		setKycFile(field, event.dataTransfer.files?.[0]);
	};

	const closeCamera = () => {
		cameraStream?.getTracks().forEach((track) => track.stop());
		setCameraStream(null);
		setCameraError(null);
		setIsCameraLoading(false);
		setCameraField(null);
	};

	const captureCameraImage = () => {
		if (!cameraField || !videoRef.current) return;
		const video = videoRef.current;
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth || 1280;
		canvas.height = video.videoHeight || 720;
		const context = canvas.getContext("2d");
		if (!context) return;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const file = new File([blob], `${cameraField}-${Date.now()}.jpg`, {
					type: "image/jpeg",
				});
				setKycFile(cameraField, file);
				setShowCameraFlash(true);
				setTimeout(() => {
					setShowCameraFlash(false);
					closeCamera();
				}, 150);
			},
			"image/jpeg",
			0.92,
		);
	};

	const tabs = [
		{ id: "info", label: t("profile.page.tabProfileInfo", "Profile Info") },
		{ id: "edit", label: t("profile.page.tabEditProfile", "Edit Profile") },
		{
			id: "password",
			label: t("profile.page.tabChangePassword", "Change Password"),
		},
		...(isPatient
			? []
			: [
					{
						id: "kyc",
						label: t(
							"profile.page.tabIdentityVerification",
							"Identity Verification",
						),
					},
				]),
	];

	return (
		<ProtectedRoute>
			<AppShell>
				<div className="relative min-h-screen overflow-hidden">
					{/* Decorative Images */}
					<div
						className="pointer-events-none absolute -right-10 top-6 h-[220px] w-[190px] opacity-[0.10] dark:opacity-[0.05]"
						style={{ transform: "matrix(-0.99,-0.13,-0.13,0.99,0,0)" }}
					>
						<Image
							src="/images/glassy_tooth.png"
							alt=""
							fill
							className="object-contain"
						/>
					</div>
					<div className="pointer-events-none absolute bottom-8 left-8 rotate-[20deg] opacity-[0.08] dark:opacity-[0.04]">
						<Image
							src="/images/glassy_tool.png"
							alt=""
							width={120}
							height={135}
							className="object-contain"
						/>
					</div>

					<div className="relative mx-auto max-w-5xl px-4 py-10">
						{/* Page Heading */}
						<div className="mb-8">
							<p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[3px] text-smile-description">
								{t("profile.page.eyebrowAccount", "Account")}
							</p>
							<h1 className="font-poppins text-3xl font-semibold text-smile-primary">
								{t("profile.page.title", "My Profile")}
							</h1>
							<p className="mt-1 font-inter text-sm text-smile-title">
								{t(
									"profile.page.subtitle",
									"Manage your personal information and settings",
								)}
							</p>
						</div>

						<div className="space-y-6">
							{/* Profile Overview */}
							<Card className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
								{/* Avatar */}
								<div className="relative shrink-0">
									{user?.avatarUrl && !avatarPreviewError ? (
										<Image
											src={user.avatarUrl}
											alt={
												user.fullName ||
												t("profile.page.avatarFallbackAlt", "Avatar")
											}
											width={88}
											height={88}
											className="h-[88px] w-[88px] rounded-full object-cover ring-4 ring-smile-primary/20 ring-offset-2 ring-offset-background"
											onError={() => setAvatarPreviewError(true)}
											unoptimized
										/>
									) : (
										<div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-smile-primary-light to-smile-card-gradient-end ring-4 ring-smile-primary/15 ring-offset-2 ring-offset-background">
											<Icon
												icon="lucide:user"
												width={34}
												className="text-smile-primary"
											/>
										</div>
									)}
									{cloudinaryConfigured ? (
										<CldUploadWidget
											options={{
												cloudName: CLOUDINARY_CLOUD_NAME,
												apiKey: CLOUDINARY_API_KEY,
												folder: "smile/avatars",
												publicId: user?.userId,
												uploadSignature: handleAvatarUploadSignature,
												cropping: true,
												croppingAspectRatio: 1,
												showSkipCropButton: false,
												multiple: false,
												sources: ["local", "camera", "url"],
												clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
												maxImageFileSize: 5 * 1024 * 1024,
											}}
											onSuccess={handleAvatarUploadSuccess}
										>
											{({ open }) => (
												<button
													type="button"
													aria-label={t(
														"profile.page.changeAvatar",
														"Change avatar",
													)}
													disabled={isConfirmingAvatar}
													onClick={() => open()}
													className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-smile-primary shadow-md transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70"
												>
													<Icon
														icon={
															isConfirmingAvatar
																? "line-md:loading-twotone-loop"
																: "lucide:camera"
														}
														width={13}
														className="text-white"
													/>
												</button>
											)}
										</CldUploadWidget>
									) : (
										<button
											type="button"
											aria-label={t(
												"profile.page.avatarUploadUnavailable",
												"Avatar upload unavailable",
											)}
											title={t(
												"profile.page.avatarUploadNotConfiguredTitle",
												"Avatar upload is not configured",
											)}
											onClick={() =>
												toast.error(
													t(
														"profile.page.avatarUploadNotConfiguredToast",
														"Avatar upload is not configured. Add the Cloudinary keys to the environment.",
													),
												)
											}
											className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-400 shadow-md transition-transform hover:scale-110"
										>
											<Icon
												icon="lucide:camera-off"
												width={13}
												className="text-white"
											/>
										</button>
									)}
								</div>

								<div className="min-w-0 flex-1">
									<h2 className="font-poppins text-lg font-semibold text-smile-primary-dark">
										{user?.fullName || "—"}
									</h2>
									<p className="font-inter text-sm text-smile-description">
										@{user?.username}
									</p>

									{/* Roles */}
									<div className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
										{user?.status && (
											<span
												className={
													"inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-inter text-[11px] font-semibold " +
													(user.status === "ACTIVE"
														? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
														: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400")
												}
											>
												<Icon
													icon={
														user.status === "ACTIVE"
															? "lucide:check-circle"
															: "lucide:circle"
													}
													width={10}
												/>
												{user.status}
											</span>
										)}
										{user?.roles?.map((r) => (
											<span
												key={r}
												className="inline-flex items-center gap-1 rounded-full bg-smile-primary-light px-2.5 py-1 font-inter text-[11px] font-semibold text-smile-primary"
											>
												<Icon icon="lucide:crown" width={10} />
												{r.replace("ROLE_", "")}
											</span>
										))}
									</div>
								</div>

								{/* Verification Info */}
								<div
									className="flex shrink-0 gap-4 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
									style={{ borderColor: "var(--surface-panel-border)" }}
								>
									{[
										{
											icon: "lucide:mail",
											label: t("profile.page.emailLabel", "Email"),
											verified: user?.emailVerified,
										},
										{
											icon: "lucide:phone",
											label: t("profile.page.phoneLabel", "Phone"),
											verified: user?.phoneVerified,
										},
									].map(({ icon, label, verified }) => (
										<div
											key={label}
											className="flex flex-col items-center gap-1 text-sm"
										>
											<span className="flex items-center gap-1.5 font-inter text-smile-title">
												<Icon icon={icon} width={13} />
												{label}
											</span>
											<span
												className={
													"flex items-center gap-1 font-semibold " +
													(verified
														? "text-green-600 dark:text-green-400"
														: "text-amber-600 dark:text-amber-400")
												}
											>
												<Icon
													icon={
														verified
															? "lucide:check-circle"
															: "lucide:alert-circle"
													}
													width={13}
												/>
												{verified
													? t("profile.page.verified", "Verified")
													: t("profile.page.pending", "Pending")}
											</span>
										</div>
									))}
								</div>
							</Card>

							{/* Tab Nav */}
							<div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
								{tabs.map((tab, index, allTabs) => (
									<Fragment key={tab.id}>
										<button
											type="button"
											onClick={() => setActiveTab(tab.id as typeof activeTab)}
											className={
												"shrink-0 font-inter text-sm font-semibold transition-colors " +
												(activeTab === tab.id
													? "text-smile-primary"
													: "text-smile-title/70 hover:text-smile-primary")
											}
										>
											{tab.label}
										</button>
										{index < allTabs.length - 1 && (
											<span className="text-smile-title/30">|</span>
										)}
									</Fragment>
								))}
							</div>

							{/* Info Section */}
							{activeTab === "info" && (
								<Card>
									<h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
										{t(
											"profile.page.accountInformationHeading",
											"Account Information",
										)}
									</h3>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InfoItem
											label={t("profile.page.fullNameLabel", "Full Name")}
											value={user?.fullName}
											icon="lucide:user"
										/>
										<InfoItem
											label={t("profile.page.usernameLabel", "Username")}
											value={user?.username ? "@" + user.username : undefined}
											icon="lucide:at-sign"
										/>
										<InfoItem
											label={t("profile.page.emailLabel", "Email")}
											value={user?.email}
											icon="lucide:mail"
										/>
										<InfoItem
											label={t("profile.page.phoneLabel", "Phone")}
											value={
												user?.phone ||
												t("profile.page.notProvided", "Not provided")
											}
											icon="lucide:phone"
										/>
										<InfoItem
											label={t("profile.page.genderLabel", "Gender")}
											value={genderLabel(user?.gender)}
											icon="lucide:users"
										/>
										<InfoItem
											label={t(
												"profile.page.dateOfBirthLabel",
												"Date of Birth",
											)}
											value={
												user?.dateOfBirth
													? new Date(user.dateOfBirth).toLocaleDateString()
													: undefined
											}
											icon="lucide:calendar"
										/>
										<InfoItem
											label={t("profile.page.memberSinceLabel", "Member Since")}
											value={
												user?.createdAt
													? new Date(user.createdAt).toLocaleDateString()
													: undefined
											}
											icon="lucide:clock"
										/>
										<InfoItem
											label={t("profile.page.lastLoginLabel", "Last Login")}
											value={
												user?.lastLoginAt
													? new Date(user.lastLoginAt).toLocaleDateString()
													: undefined
											}
											icon="lucide:log-in"
										/>
									</div>

									{/* Permissions */}
									{(user?.permissions?.length ?? 0) > 0 && (
										<div
											className="mt-5 rounded-xl border p-4"
											style={{
												background: "var(--surface-footer-bg)",
												borderColor: "var(--surface-panel-border)",
											}}
										>
											<p className="mb-2.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
												{t("profile.page.permissionsHeading", "Permissions")}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{user?.permissions?.map((p) => (
													<span
														key={p}
														className="inline-flex rounded-lg px-2.5 py-1 font-inter text-[11px] text-smile-description"
														style={{ background: "var(--surface-panel-bg)" }}
													>
														{p}
													</span>
												))}
											</div>
										</div>
									)}
								</Card>
							)}

							{/* Edit Section */}
							{activeTab === "edit" && (
								<Card>
									<h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
										{t("profile.page.editProfileHeading", "Edit Profile")}
									</h3>

									<form onSubmit={handleUpdateProfile} className="space-y-5">
										<FieldRow
											label={t("profile.page.fullNameLabel", "Full Name")}
											icon="lucide:user"
										>
											<input
												type="text"
												placeholder={t(
													"profile.page.fullNamePlaceholder",
													"Your full name",
												)}
												value={profileForm.fullName}
												onChange={(e) =>
													setProfileForm({
														...profileForm,
														fullName: e.target.value,
													})
												}
												className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
											/>
										</FieldRow>

										<FieldRow
											label={t(
												"profile.page.dateOfBirthLabel",
												"Date of Birth",
											)}
										>
											<BookingDatePicker
												value={profileForm.dateOfBirth}
												onChange={(v) =>
													setProfileForm({
														...profileForm,
														dateOfBirth: v,
													})
												}
												maxDate={new Date()}
											/>
										</FieldRow>

										<div>
											<p className="mb-2.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
												{t("profile.page.genderLabel", "Gender")}
											</p>
											<div className="flex gap-2.5">
												{GENDER_OPTIONS.map(({ value: g, label }) => (
													<label
														key={g}
														className={
															"flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-inter text-sm font-medium transition-colors duration-150 " +
															(profileForm.gender === g
																? "border-smile-primary bg-smile-primary-light text-smile-primary"
																: "text-smile-description hover:border-smile-primary/50 hover:text-smile-primary")
														}
														style={
															profileForm.gender !== g
																? {
																		borderColor: "var(--surface-panel-border)",
																	}
																: undefined
														}
													>
														<input
															type="radio"
															name="gender"
															value={g}
															checked={profileForm.gender === g}
															onChange={() =>
																setProfileForm({ ...profileForm, gender: g })
															}
															className="sr-only"
														/>
														{label}
													</label>
												))}
											</div>
										</div>

										<FieldRow
											label={t("profile.page.addressLabel", "Address")}
											icon="lucide:map-pin"
										>
											<input
												type="text"
												placeholder={t(
													"profile.page.addressPlaceholder",
													"Your address (optional)",
												)}
												value={profileForm.address}
												onChange={(e) =>
													setProfileForm({
														...profileForm,
														address: e.target.value,
													})
												}
												className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
											/>
										</FieldRow>

										<button
											type="submit"
											disabled={isUpdatingProfile}
											className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_20px_rgba(65,126,170,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
										>
											{isUpdatingProfile && (
												<Icon icon="line-md:loading-twotone-loop" width={16} />
											)}
											{t("profile.page.saveChanges", "Save Changes")}
										</button>
									</form>
								</Card>
							)}

							{/* Password Section */}
							{activeTab === "password" && (
								<Card>
									<h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
										{t("profile.page.changePasswordHeading", "Change Password")}
									</h3>

									<form onSubmit={handleChangePassword} className="space-y-5">
										{[
											{
												label: t(
													"profile.page.newPasswordLabel",
													"New Password",
												),
												key: "newPassword" as const,
												show: showNew,
												toggle: () => setShowNew((p) => !p),
												ac: "new-password",
											},
											{
												label: t(
													"profile.page.confirmPasswordLabel",
													"Confirm Password",
												),
												key: "confirmPassword" as const,
												show: showConfirm,
												toggle: () => setShowConfirm((p) => !p),
												ac: "new-password",
											},
										].map(({ label, key, show, toggle, ac }) => (
											<FieldRow
												key={key}
												label={label}
												icon="lucide:lock"
												error={passwordErrors[key]}
											>
												<div className="flex items-center gap-2">
													<input
														type={show ? "text" : "password"}
														autoComplete={ac}
														placeholder="••••••••"
														value={passwordForm[key]}
														onChange={(e) => {
															setPasswordForm({
																...passwordForm,
																[key]: e.target.value,
															});
															setPasswordErrors((prev) => ({
																...prev,
																[key]: undefined,
															}));
														}}
														className="flex-1 bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
													/>
													{key === "confirmPassword" && passwordsMatch && (
														<Icon
															icon="lucide:check-circle-2"
															width={16}
															className="shrink-0 text-green-500"
														/>
													)}
													<button
														type="button"
														onClick={toggle}
														className="shrink-0 text-smile-description hover:text-smile-primary"
													>
														<Icon
															icon={show ? "lucide:eye-off" : "lucide:eye"}
															width={16}
														/>
													</button>
												</div>
											</FieldRow>
										))}

										{/* Strength Hints */}
										<div
											className="rounded-xl border p-4"
											style={{
												background: "var(--surface-footer-bg)",
												borderColor: "var(--surface-panel-border)",
											}}
										>
											<p className="mb-2 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
												{t("profile.page.requirementsHeading", "Requirements")}
											</p>

											{/* Strength Bar */}
											<div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
												<motion.div
													className={`h-full rounded-full ${passwordStrengthColor}`}
													animate={{ width: `${passwordStrengthPct}%` }}
													transition={{ duration: 0.3 }}
												/>
											</div>

											<ul className="space-y-1.5">
												{passwordRequirements.map(({ test, label }) => (
													<li
														key={label}
														className={
															"flex items-center gap-2 font-inter text-xs transition-colors " +
															(test
																? "text-green-600 dark:text-green-400"
																: "text-smile-description")
														}
													>
														<motion.span
															key={test ? "met" : "unmet"}
															animate={{ scale: test ? [1, 1.3, 1] : 1 }}
															transition={{ duration: 0.25 }}
															className="flex shrink-0"
														>
															<Icon
																icon={
																	test ? "lucide:check-circle" : "lucide:circle"
																}
																width={13}
															/>
														</motion.span>
														{label}
													</li>
												))}
											</ul>
										</div>

										<button
											type="submit"
											disabled={isUpdatingProfile}
											className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_20px_rgba(65,126,170,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
										>
											{isUpdatingProfile && (
												<Icon icon="line-md:loading-twotone-loop" width={16} />
											)}
											{t(
												"profile.page.changePasswordButton",
												"Change Password",
											)}
										</button>
									</form>
								</Card>
							)}

							{/* KYC Section */}
							{activeTab === "kyc" && (
								<Card>
									<div className="mb-5 flex items-start justify-between gap-4">
										<div>
											<h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">
												{t(
													"profile.page.identityVerificationHeading",
													"Identity Verification",
												)}
											</h3>
											<p className="mt-1 font-inter text-sm text-smile-description">
												{t(
													"profile.page.identityVerificationSubtitle",
													"Verify your phone and submit citizen ID documents before booking.",
												)}
											</p>
										</div>
										<span
											className={
												"shrink-0 rounded-full px-3 py-1 font-inter text-xs font-semibold " +
												(kyc?.status === "VERIFIED"
													? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
													: kyc?.status === "REJECTED"
														? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
														: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")
											}
										>
											{isLoadingKyc
												? t("profile.page.loadingStatus", "Loading")
												: kyc?.status || "NOT_SUBMITTED"}
										</span>
									</div>

									<div
										className="mb-5 rounded-xl border p-4"
										style={{ borderColor: "var(--surface-panel-border)" }}
									>
										<KycStatusTimeline
											status={kyc?.status ?? "NOT_SUBMITTED"}
											ocrStatus={kyc?.ocrStatus}
										/>
										{kyc?.status === "REJECTED" && kyc?.rejectionReason && (
											<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-inter text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
												<span className="font-semibold">
													{t("profile.page.reasonLabel", "Reason:")}
												</span>{" "}
												{kyc.rejectionReason}
											</p>
										)}
									</div>

									<div
										className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
										style={{ borderColor: "var(--surface-panel-border)" }}
									>
										<p className="font-inter text-xs text-smile-description">
											{kyc?.statusMessage ||
												(isKycVerified
													? t(
															"profile.page.statusVerifiedMessage",
															"Your identity is verified. This form is locked.",
														)
													: kyc?.status === "PENDING_REVIEW"
														? t(
																"profile.page.statusPendingMessage",
																"Your KYC is pending admin review. Editing and resubmission are locked for now.",
															)
														: kyc?.status === "REJECTED"
															? t(
																	"profile.page.statusRejectedMessage",
																	"Your previous submission was rejected. You can submit corrected documents.",
																)
															: t(
																	"profile.page.statusDefaultMessage",
																	"Upload or capture your identity documents to start verification.",
																))}
										</p>
										<button
											type="button"
											onClick={() => setShowKycHistory(true)}
											className="rounded-full border px-3 py-1.5 font-inter text-xs font-semibold text-smile-primary transition hover:bg-smile-primary/10"
											style={{ borderColor: "var(--surface-panel-border)" }}
										>
											{t(
												"profile.page.submissionHistoryButton",
												"Submission history",
											)}
										</button>
									</div>

									<div className="space-y-5">
										<div
											className="rounded-xl border p-4"
											style={{
												background: "var(--surface-footer-bg)",
												borderColor: "var(--surface-panel-border)",
											}}
										>
											<div className="flex items-center justify-between gap-3">
												<div>
													<p className="font-poppins text-sm font-semibold text-smile-primary-dark">
														{t(
															"profile.page.phoneVerificationHeading",
															"Phone Verification",
														)}
													</p>
													<p className="font-inter text-xs text-smile-description">
														{user?.phoneVerified
															? t(
																	"profile.page.phoneVerifiedMessage",
																	"Your phone number is verified.",
																)
															: t(
																	"profile.page.requestOtpMessage",
																	"Request an OTP and enter it below.",
																)}
													</p>
												</div>
												<motion.span
													key={user?.phoneVerified ? "verified" : "unverified"}
													initial={{ scale: 0.6, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 15,
													}}
													className={
														user?.phoneVerified
															? "text-green-600"
															: "text-amber-600"
													}
												>
													<Icon
														icon={
															user?.phoneVerified
																? "lucide:check-circle"
																: "lucide:alert-circle"
														}
														width={20}
													/>
												</motion.span>
											</div>
											{!user?.phoneVerified && (
												<div className="mt-4 space-y-2.5">
													<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
														<OtpInput
															value={phoneOtp}
															onChange={setPhoneOtp}
															onComplete={handleVerifyPhoneCode}
															disabled={isVerifyingPhone}
														/>
														<OtpResendButton
															onResend={handleSendPhoneOtp}
															isSending={isSendingPhoneOtp}
															cooldownSeconds={60}
														/>
													</div>
													<p className="font-inter text-xs text-smile-description">
														{isVerifyingPhone ? (
															<span className="inline-flex items-center gap-1.5">
																<Icon
																	icon="line-md:loading-twotone-loop"
																	width={12}
																/>
																{t(
																	"profile.page.verifyingLabel",
																	"Verifying...",
																)}
															</span>
														) : (
															t(
																"profile.page.enterOtpHint",
																"Enter the 6-digit code sent to your phone.",
															)
														)}
													</p>
												</div>
											)}
										</div>

										<form onSubmit={handleSubmitKyc} className="space-y-4">
											<div className="grid gap-4 sm:grid-cols-2">
												<FieldRow
													label={t("profile.page.fullNameLabel", "Full Name")}
													icon="lucide:user"
												>
													<input
														type="text"
														placeholder={t(
															"profile.page.fullNamePlaceholderKyc",
															"Nguyen Van A",
														)}
														value={profileForm.fullName}
														disabled
														className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none disabled:cursor-not-allowed disabled:opacity-60"
													/>
												</FieldRow>
												<FieldRow
													label={t(
														"profile.page.dateOfBirthLabel",
														"Date of Birth",
													)}
													icon="lucide:calendar"
												>
													<input
														type="date"
														value={profileForm.dateOfBirth}
														disabled
														className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none disabled:cursor-not-allowed disabled:opacity-60"
													/>
												</FieldRow>
											</div>

											<div className="grid gap-4 sm:grid-cols-2">
												<FieldRow
													label={t("profile.page.idTypeLabel", "ID Type")}
													icon="lucide:id-card"
												>
													<p className="py-1 font-poppins text-sm text-smile-title">
														{t(
															"profile.page.idTypeValue",
															"Vietnamese Citizen ID",
														)}
													</p>
												</FieldRow>
												<FieldRow
													label={t("profile.page.idNumberLabel", "ID Number")}
													icon="lucide:hash"
												>
													<input
														type="text"
														inputMode="numeric"
														maxLength={12}
														placeholder={t(
															"profile.page.idNumberPlaceholder",
															"079123456789",
														)}
														value={kycForm.idNumber}
														disabled={isKycLocked}
														onChange={(e) =>
															setKycForm({
																...kycForm,
																idNumber: e.target.value
																	.replace(/\D/g, "")
																	.slice(0, 12),
															})
														}
														className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none disabled:cursor-not-allowed disabled:opacity-60"
													/>
												</FieldRow>
											</div>

											<div className="grid gap-3 sm:grid-cols-2">
												{(
													[
														[
															"idFront",
															t(
																"profile.page.citizenIdFront",
																"Citizen ID Front",
															),
														],
														[
															"idBack",
															t(
																"profile.page.citizenIdBack",
																"Citizen ID Back",
															),
														],
													] as Array<[KycFileField, string]>
												).map(([key, label]) => {
													const file = kycForm[key];
													const previewUrl = filePreviews[key];
													const isDragOver = dragOverField === key;
													return (
														<div key={key} className="space-y-2">
															<label
																onDragEnter={(event) => {
																	event.preventDefault();
																	if (!isKycLocked) setDragOverField(key);
																}}
																onDragOver={(event) => event.preventDefault()}
																onDragLeave={(event) => {
																	event.preventDefault();
																	setDragOverField((prev) =>
																		prev === key ? null : prev,
																	);
																}}
																onDrop={(event) => handleDropFile(event, key)}
																className={
																	"relative flex min-h-32 flex-col items-center justify-center overflow-hidden rounded-xl border px-3 py-4 text-center transition-all duration-150 " +
																	(isKycLocked
																		? "cursor-not-allowed border-dashed opacity-60"
																		: isDragOver
																			? "cursor-pointer scale-[1.02] border-solid border-smile-primary bg-smile-primary/5"
																			: "cursor-pointer border-dashed hover:border-smile-primary hover:bg-smile-primary/5")
																}
																style={{
																	borderColor: isDragOver
																		? undefined
																		: "var(--surface-panel-border)",
																}}
															>
																{file && previewUrl ? (
																	<>
																		<Image
																			src={previewUrl}
																			alt={label}
																			fill
																			sizes="(max-width: 640px) 100vw, 240px"
																			className="object-cover"
																			unoptimized
																		/>
																		<span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 font-inter text-[11px] text-white">
																			{file.name}
																		</span>
																		{!isKycLocked && (
																			<button
																				type="button"
																				onClick={(event) => {
																					event.preventDefault();
																					event.stopPropagation();
																					clearKycFile(key);
																				}}
																				className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
																				title={t(
																					"profile.page.removeFileTitle",
																					"Remove file",
																				)}
																			>
																				<Icon icon="lucide:x" width={13} />
																			</button>
																		)}
																	</>
																) : (
																	<>
																		<Icon
																			icon="lucide:upload-cloud"
																			width={22}
																			className="mb-2 text-smile-primary"
																		/>
																		<span className="font-inter text-xs font-semibold text-smile-primary-dark">
																			{label}
																		</span>
																		<span className="mt-1 max-w-full truncate font-inter text-[11px] text-smile-description">
																			{isDragOver
																				? t(
																						"profile.page.dropToUpload",
																						"Drop to upload",
																					)
																				: t(
																						"profile.page.dropOrBrowse",
																						"Drop image here or browse",
																					)}
																		</span>
																	</>
																)}
																<input
																	type="file"
																	accept="image/jpeg,image/png,image/webp"
																	disabled={isKycLocked}
																	className="sr-only"
																	onChange={(e) =>
																		setKycFile(key, e.target.files?.[0])
																	}
																/>
															</label>
															<button
																type="button"
																disabled={isKycLocked}
																onClick={() => setCameraField(key)}
																className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-inter text-xs font-semibold text-smile-primary transition hover:bg-smile-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
																style={{
																	borderColor: "var(--surface-panel-border)",
																}}
															>
																<Icon icon="lucide:camera" width={14} />
																{t("profile.page.captureButton", "Capture")}
															</button>
														</div>
													);
												})}
											</div>

											<div
												className="rounded-xl border p-4"
												style={{ borderColor: "var(--surface-panel-border)" }}
											>
												<label className="flex items-start gap-3">
													<input
														type="checkbox"
														checked={kycForm.consentAccepted}
														disabled={isKycLocked}
														onChange={(e) =>
															setKycForm({
																...kycForm,
																consentAccepted: e.target.checked,
															})
														}
														className="mt-1"
													/>
													<span className="font-inter text-xs text-smile-description">
														{t(
															"profile.page.consentText",
															"I agree to the KYC document storage, OCR processing, booking safety, retention, and no-marketing terms.",
														)}
													</span>
												</label>
												<button
													type="button"
													onClick={() =>
														setShowConsentDetails((value) => !value)
													}
													className="mt-3 flex items-center gap-1.5 font-inter text-xs font-semibold text-smile-primary"
												>
													<Icon
														icon={
															showConsentDetails
																? "lucide:chevron-up"
																: "lucide:chevron-down"
														}
														width={14}
													/>
													{showConsentDetails
														? t("profile.page.hideFullTerms", "Hide full terms")
														: t(
																"profile.page.readFullTerms",
																"Read full terms",
															)}
												</button>
												{showConsentDetails && (
													<div className="mt-3 space-y-2 rounded-lg bg-smile-primary-light/40 p-3 font-inter text-xs leading-5 text-smile-title">
														<p>
															{t(
																"profile.page.consentP1",
																"S.M.I.L.E uses your identity data only to verify your account and support booking safety.",
															)}
														</p>
														<p>
															{t(
																"profile.page.consentP2",
																"Your uploaded citizen ID front and back images are stored securely for identity verification.",
															)}
														</p>
														<p>
															{t(
																"profile.page.consentP3",
																"OCR may verify clear matching documents automatically. Uncertain results are sent to authorized staff for manual review.",
															)}
														</p>
														<p>
															{t(
																"profile.page.consentP4",
																"Only authorized staff may review submitted documents, and access is logged for audit purposes.",
															)}
														</p>
														<p>
															{t(
																"profile.page.consentP5",
																"KYC data is retained under the active retention policy and is not used for marketing.",
															)}
														</p>
													</div>
												)}
											</div>

											<button
												type="submit"
												disabled={isSubmittingKyc || isKycLocked}
												className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
											>
												{isSubmittingKyc && (
													<Icon
														icon="line-md:loading-twotone-loop"
														width={16}
													/>
												)}
												{isKycVerified
													? t("profile.page.kycVerifiedButton", "KYC Verified")
													: kyc?.status === "PENDING_REVIEW"
														? t(
																"profile.page.pendingReviewButton",
																"Pending Review",
															)
														: t("profile.page.submitKycButton", "Submit KYC")}
											</button>
										</form>
									</div>
								</Card>
							)}
						</div>
					</div>

					<AnimatePresence>
						{cameraField && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.18 }}
								className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
							>
								<motion.div
									initial={{ opacity: 0, scale: 0.92 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.92 }}
									transition={{ duration: 0.22, ease: "easeOut" }}
									className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
								>
									<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
										<div>
											<p className="font-poppins text-base font-semibold text-slate-900 dark:text-white">
												{t(
													"profile.page.cameraModalTitle",
													"Capture document image",
												)}
											</p>
											<p className="font-inter text-xs text-slate-500">
												{t(
													"profile.page.cameraModalSubtitle",
													"Position the document inside the frame, then capture.",
												)}
											</p>
										</div>
										<button
											type="button"
											onClick={closeCamera}
											className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
										>
											<Icon icon="lucide:x" width={18} />
										</button>
									</div>
									<div className="space-y-4 p-5">
										<div className="relative overflow-hidden rounded-xl bg-black">
											<video
												ref={videoRef}
												autoPlay
												playsInline
												muted
												className="h-[420px] w-full object-contain"
											/>
											{!isCameraLoading && !cameraError && (
												<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
													<div className="aspect-[1.6/1] w-full max-w-md rounded-2xl border-2 border-white/70" />
												</div>
											)}
											{(isCameraLoading || cameraError) && (
												<div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center">
													<div>
														{isCameraLoading && (
															<>
																<Icon
																	icon="line-md:loading-twotone-loop"
																	width={28}
																	className="mx-auto mb-3 text-white"
																/>
																<p className="font-inter text-sm font-semibold text-white">
																	{t(
																		"profile.page.openingCamera",
																		"Opening camera...",
																	)}
																</p>
															</>
														)}
														{cameraError && (
															<>
																<Icon
																	icon="lucide:video-off"
																	width={28}
																	className="mx-auto mb-3 text-destructive"
																/>
																<p className="font-inter text-sm font-semibold text-white">
																	{cameraError}
																</p>
																<p className="mt-2 font-inter text-xs text-slate-300">
																	{t(
																		"profile.page.closeDialogHint",
																		"You can close this dialog and use image upload instead.",
																	)}
																</p>
															</>
														)}
													</div>
												</div>
											)}
										</div>
										<div className="flex gap-3">
											<button
												type="button"
												onClick={captureCameraImage}
												disabled={
													!cameraStream || isCameraLoading || !!cameraError
												}
												className="flex-1 rounded-xl bg-smile-primary px-4 py-3 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
											>
												{t("profile.page.capturePhotoButton", "Capture Photo")}
											</button>
											<button
												type="button"
												onClick={closeCamera}
												className="rounded-xl border border-slate-200 px-4 py-3 font-inter text-sm font-semibold text-slate-600"
											>
												{t("common.cancel", "Cancel")}
											</button>
										</div>
									</div>
								</motion.div>
								<AnimatePresence>
									{showCameraFlash && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: [0, 1, 0] }}
											transition={{ duration: 0.15 }}
											className="pointer-events-none fixed inset-0 z-[110] bg-white"
										/>
									)}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>

					<AnimatePresence>
						{showKycHistory && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.18 }}
								className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
							>
								<motion.div
									initial={{ opacity: 0, scale: 0.92 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.92 }}
									transition={{ duration: 0.22, ease: "easeOut" }}
									className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
								>
									<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
										<div>
											<p className="font-poppins text-base font-semibold text-slate-900 dark:text-white">
												{t(
													"profile.page.kycHistoryTitle",
													"KYC Submission History",
												)}
											</p>
											<p className="font-inter text-xs text-slate-500">
												{t(
													"profile.page.kycHistorySubtitle",
													"Review previous submissions and rejection reasons.",
												)}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setShowKycHistory(false)}
											className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
										>
											<Icon icon="lucide:x" width={18} />
										</button>
									</div>
									<div className="max-h-[calc(86vh-73px)] overflow-y-auto p-5">
										{isLoadingKycHistory ? (
											<div className="flex h-32 items-center justify-center">
												<Icon
													icon="lucide:loader-2"
													width={22}
													className="animate-spin text-smile-primary"
												/>
											</div>
										) : kycHistory.length === 0 ? (
											<div className="rounded-xl border border-slate-200 p-6 text-center font-inter text-sm text-slate-500">
												{t(
													"profile.page.noSubmissionsYet",
													"No KYC submissions yet.",
												)}
											</div>
										) : (
											<div className="space-y-3">
												{kycHistory.map((item, i) => {
													const statusIcon =
														item.status === "VERIFIED"
															? "lucide:check-circle"
															: item.status === "REJECTED"
																? "lucide:x-circle"
																: "lucide:clock";
													const statusColor =
														item.status === "VERIFIED"
															? "text-green-600"
															: item.status === "REJECTED"
																? "text-red-600"
																: "text-amber-600";
													return (
														<motion.div
															key={item.kycId}
															custom={i}
															initial={{ opacity: 0, y: -6 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{
																delay: i * 0.06,
																duration: 0.3,
																ease: "easeOut",
															}}
															className="flex gap-3 rounded-xl border border-slate-200 p-4"
														>
															<Icon
																icon={statusIcon}
																width={20}
																className={`mt-0.5 shrink-0 ${statusColor}`}
															/>
															<div className="min-w-0 flex-1">
																<div className="flex flex-wrap items-center justify-between gap-3">
																	<div>
																		<p className="font-inter text-sm font-semibold text-slate-900">
																			{item.idType ??
																				t(
																					"profile.page.identityDocumentFallback",
																					"Identity document",
																				)}{" "}
																			·{" "}
																			{item.idNumberMasked ??
																				t("profile.page.noIdFallback", "No ID")}
																		</p>
																		<p className="font-inter text-xs text-slate-500">
																			{t(
																				"profile.page.submittedLabel",
																				"Submitted",
																			)}{" "}
																			{item.submittedAt
																				? new Date(
																						item.submittedAt,
																					).toLocaleString()
																				: "—"}
																		</p>
																	</div>
																	<span
																		className={
																			"rounded-full px-3 py-1 font-inter text-xs font-semibold " +
																			(item.status === "VERIFIED"
																				? "bg-green-100 text-green-700"
																				: item.status === "REJECTED"
																					? "bg-red-100 text-red-700"
																					: "bg-amber-100 text-amber-700")
																		}
																	>
																		{item.status}
																	</span>
																</div>
																<div className="mt-3 grid gap-2 font-inter text-xs text-slate-600 sm:grid-cols-3">
																	<p>
																		{t("profile.page.ocrLabel", "OCR:")}{" "}
																		<span className="font-semibold">
																			{item.ocrStatus ?? "—"}
																		</span>
																	</p>
																	<p>
																		{t(
																			"profile.page.confidenceLabel",
																			"Confidence:",
																		)}{" "}
																		<span className="font-semibold">
																			{typeof item.ocrConfidence === "number"
																				? `${item.ocrConfidence}%`
																				: "—"}
																		</span>
																	</p>
																	<p>
																		{t(
																			"profile.page.verifiedLabel",
																			"Verified:",
																		)}{" "}
																		<span className="font-semibold">
																			{item.verifiedAt
																				? new Date(
																						item.verifiedAt,
																					).toLocaleString()
																				: "—"}
																		</span>
																	</p>
																</div>
																{item.rejectionReason && (
																	<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-inter text-xs text-red-700">
																		{t(
																			"profile.page.rejectedPrefix",
																			"Rejected:",
																		)}{" "}
																		{item.rejectionReason}
																	</p>
																)}
															</div>
														</motion.div>
													);
												})}
											</div>
										)}
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</AppShell>
		</ProtectedRoute>
	);
}
