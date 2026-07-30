"use client";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";

interface UserProfile {
	fullName: string;
	role: string;
	department?: string;
	email: string;
	phone: string;
	address: string;
	dob: string;
	gender: string;
	username: string;
	accountType: string;
	lastLogin: string;
	memberSince: string;
	licenseNumber?: string;
	specialties?: string[];
	avatarUrl?: string;
}

const MOCK_PROFILE: UserProfile = {
	fullName: "Dr. Alexander James Vance",
	role: "Chief Surgeon",
	department: "Neurology Diagnostics",
	email: "a.vance@aetheris.med",
	phone: "+1 (555) 019-8372",
	address: "1400 Medical Center Dr, Suite 400 Seattle, WA 98104",
	dob: "October 14, 1978",
	gender: "Male",
	username: "drvance_sea",
	accountType: "Enterprise Provider",
	lastLogin: "2 hours ago · Chrome",
	memberSince: "September 2023",
	licenseNumber: "WA-MD-58291",
	specialties: ["Oral Surgery", "Orthodontics", "Periodontics"],
};

function SectionHeading({
	icon,
	label,
}: {
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-[#92CDFD] dark:text-[#92CDFD]">{icon}</span>
			<span
				className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#92CDFD] dark:text-[#92CDFD]"
				style={{ fontFamily: "var(--font-space-grotesk)" }}
			>
				{label}
			</span>
		</div>
	);
}

function InfoField({
	label,
	value,
	children,
}: {
	label: string;
	value?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<p
				className="text-sm text-muted-foreground dark:text-[#C1C7CF]"
				style={{ fontFamily: "var(--font-space-grotesk)" }}
			>
				{label}
			</p>
			{children ?? (
				<p
					className="text-base text-foreground dark:text-[#E1E2E6]"
					style={{ fontFamily: "var(--font-public-sans)" }}
				>
					{value}
				</p>
			)}
		</div>
	);
}

export function ViewProfile({ onEdit }: { onEdit: () => void }) {
	const p = MOCK_PROFILE;
	const { t } = useTranslation();

	return (
		<div className="flex gap-6">
			{/* ── Left: Identity Card ─────────────────────────────── */}
			<div
				className="relative w-80 shrink-0 rounded-2xl border bg-card text-card-foreground shadow-sm dark:border-white/[0.08] dark:bg-transparent dark:shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)] dark:backdrop-blur-[10px]"
				style={
					typeof window !== "undefined" &&
					document.documentElement.classList.contains("dark")
						? { background: "rgba(255,255,255,0.03)" }
						: {}
				}
			>
				{/* Avatar */}
				<div className="flex flex-col items-center pt-6">
					<div className="relative mb-4">
						{/* glowing ring */}
						<div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 dark:border-[rgba(146,205,253,0.3)] dark:shadow-[0_0_16px_rgba(146,205,253,0.25)]">
							<div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-muted dark:bg-[#1B2C3A]">
								<Icon
									icon="lucide:user"
									className="h-8 w-8 text-muted-foreground dark:text-[#C1C7CF]"
								/>
							</div>
							{/* hover overlay — shown on hover via group */}
							<div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100 backdrop-blur-sm cursor-pointer">
								<Icon icon="lucide:camera" className="h-5 w-5 text-white" />
							</div>
						</div>
						{/* Online indicator */}
						<span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-[#38BDF8] dark:border-[#0B1420] dark:shadow-[0_0_8px_rgba(56, 189, 248,0.5)]" />
					</div>

					{/* Name */}
					<h2
						className="text-center text-2xl font-semibold text-foreground dark:text-[#E1E2E6]"
						style={{ fontFamily: "var(--font-public-sans)" }}
					>
						{p.fullName}
					</h2>

					{/* Location */}
					<div className="mt-1 flex items-center gap-2 text-muted-foreground dark:text-[#C1C7CF]">
						<Icon
							icon="lucide:map-pin"
							className="h-[10px] w-[10px] text-muted-foreground/60 dark:text-[#8B9199]"
						/>
						<span
							className="text-base"
							style={{ fontFamily: "var(--font-public-sans)" }}
						>
							Seattle, WA
						</span>
					</div>

					{/* Role badge */}
					<div className="mt-2 rounded-full border px-3 py-[3px] dark:border-[rgba(146,205,253,0.2)] dark:bg-[rgba(146,205,253,0.1)]">
						<span
							className="text-xs font-semibold tracking-[0.6px] text-[#92CDFD] dark:text-[#92CDFD]"
							style={{ fontFamily: "var(--font-space-grotesk)" }}
						>
							{p.role}
						</span>
					</div>
				</div>

				{/* Digital Signature Status */}
				<div className="mx-6 mt-6 rounded-xl border px-3 py-[10px] dark:border-white/[0.05] dark:bg-[rgba(20, 33, 46,0.5)]">
					<div className="flex items-center justify-between">
						<span
							className="text-sm text-muted-foreground dark:text-[#C1C7CF]"
							style={{ fontFamily: "var(--font-space-grotesk)" }}
						>
							{t("profile.digitalSignature", "Digital Signature")}
						</span>
						<div className="flex items-center gap-1.5">
							<Icon
								icon="lucide:check-circle-2"
								className="h-3 w-3 text-[#38BDF8]"
							/>
							<span
								className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#38BDF8]"
								style={{ fontFamily: "var(--font-space-grotesk)" }}
							>
								{t("profile.active", "Active")}
							</span>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
					<button
						onClick={onEdit}
						className="flex h-9 w-full items-center justify-center rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{
							background: "#5B96C4",
							boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
							fontFamily: "var(--font-space-grotesk)",
						}}
					>
						<Icon icon="lucide:edit-3" className="mr-1.5 h-3.5 w-3.5" />
						{t("profile.editProfile", "Edit Profile")}
					</button>
					<button
						className="flex h-9 w-full items-center justify-center rounded-full border text-sm font-medium text-foreground transition-colors dark:border-white/[0.1] dark:text-[#E1E2E6] dark:hover:bg-white/[0.05]"
						style={{ fontFamily: "var(--font-space-grotesk)" }}
					>
						{t("profile.downloadCredentials", "Download Credentials")}
					</button>
				</div>

				{/* spacer for buttons */}
				<div className="h-32" />
			</div>

			{/* ── Right: Details Card ──────────────────────────────── */}
			<div
				className="flex-1 rounded-2xl border bg-card text-card-foreground shadow-sm dark:border-white/[0.08] dark:bg-transparent dark:shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)] dark:backdrop-blur-[10px]"
				style={
					typeof window !== "undefined" &&
					document.documentElement.classList.contains("dark")
						? { background: "rgba(255,255,255,0.03)" }
						: {}
				}
			>
				{/* Personal Info */}
				<div className="p-6">
					<SectionHeading
						icon={<Icon icon="lucide:user" className="h-3 w-3" />}
						label={t("profile.personalInfo", "Personal Information")}
					/>
					<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
						<InfoField
							label={t("profile.fullName", "Full Name")}
							value={p.fullName}
						/>
						<InfoField
							label={t("profile.dob", "Date of Birth")}
							value={p.dob}
						/>
						<InfoField label={t("profile.gender", "Gender")} value={p.gender} />
					</div>
				</div>

				<hr
					className="border-0 h-px mx-0"
					style={{
						background:
							"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(128,128,128,0.15) 50%,rgba(255,255,255,0) 100%)",
					}}
				/>

				{/* Contact */}
				<div className="p-6">
					<SectionHeading
						icon={<Icon icon="lucide:shield" className="h-3 w-3" />}
						label={t("profile.contact", "Contact")}
					/>
					<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
						<InfoField label={t("profile.email", "Email Address")}>
							<div className="flex items-center gap-2">
								<span
									className="text-base text-foreground dark:text-[#E1E2E6]"
									style={{ fontFamily: "var(--font-public-sans)" }}
								>
									{p.email}
								</span>
								<Icon
									icon="lucide:check-circle-2"
									className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]"
								/>
							</div>
						</InfoField>
						<InfoField label={t("profile.phone", "Phone Number")}>
							<div className="flex items-center gap-2">
								<span
									className="text-base text-foreground dark:text-[#E1E2E6]"
									style={{ fontFamily: "var(--font-public-sans)" }}
								>
									{p.phone}
								</span>
								<Icon
									icon="lucide:check-circle-2"
									className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]"
								/>
							</div>
						</InfoField>
						<div className="col-span-2">
							<InfoField
								label={t("profile.address", "Primary Clinic Address")}
								value={p.address}
							/>
						</div>
					</div>
				</div>

				<hr
					className="border-0 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(128,128,128,0.15) 50%,rgba(255,255,255,0) 100%)",
					}}
				/>

				{/* Account */}
				<div className="p-6">
					<SectionHeading
						icon={<Icon icon="lucide:shield" className="h-3.5 w-3.5" />}
						label={t("profile.account", "Account")}
					/>
					<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
						<InfoField label={t("profile.username", "Username")}>
							<span
								className="text-sm text-foreground dark:text-[#E1E2E6]"
								style={{
									fontFamily: "var(--font-space-grotesk)",
									letterSpacing: "0.28px",
								}}
							>
								{p.username}
							</span>
						</InfoField>
						<InfoField
							label={t("profile.accountType", "Account Type")}
							value={p.accountType}
						/>
						<InfoField
							label={t("profile.lastLogin", "Last Login")}
							value={p.lastLogin}
						/>
						<InfoField
							label={t("profile.memberSince", "Member Since")}
							value={p.memberSince}
						/>
					</div>
				</div>

				<hr
					className="border-0 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(128,128,128,0.15) 50%,rgba(255,255,255,0) 100%)",
					}}
				/>

				{/* Professional */}
				<div className="p-6">
					<SectionHeading
						icon={<Icon icon="lucide:stethoscope" className="h-4 w-4" />}
						label={t("profile.professional", "Professional")}
					/>
					<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
						<InfoField
							label={t("profile.licenseNumber", "Medical License Number")}
						>
							<div className="flex items-center gap-3">
								<span
									className="text-sm text-foreground dark:text-[#E1E2E6]"
									style={{
										fontFamily: "var(--font-space-grotesk)",
										letterSpacing: "1.4px",
									}}
								>
									{p.licenseNumber}
								</span>
								<span
									className="flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] text-[#38BDF8] dark:border-[rgba(56, 189, 248,0.3)] dark:bg-[rgba(56, 189, 248,0.1)]"
									style={{ fontFamily: "var(--font-space-grotesk)" }}
								>
									<Icon icon="lucide:shield" className="h-2 w-2" /> Verified
								</span>
							</div>
						</InfoField>
						<InfoField label={t("profile.specialties", "Specialties")}>
							<div className="flex flex-wrap gap-2">
								{p.specialties?.map((s) => (
									<span
										key={s}
										className="rounded-full border px-3 py-1 text-sm text-foreground dark:border-white/10 dark:bg-[#14212E] dark:text-[#E1E2E6]"
										style={{ fontFamily: "var(--font-space-grotesk)" }}
									>
										{s}
									</span>
								))}
							</div>
						</InfoField>
					</div>
				</div>
			</div>
		</div>
	);
}
