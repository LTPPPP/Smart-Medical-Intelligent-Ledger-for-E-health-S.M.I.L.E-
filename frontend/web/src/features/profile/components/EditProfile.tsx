"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/shared/hooks";

interface EditableProfile {
	fullName: string;
	dob: string;
	gender: string;
	phone: string;
	address: string;
}

const DEFAULT_VALUES: EditableProfile = {
	fullName: "Dr. Sarah Elizabeth Jenkins",
	dob: "11/14/1982",
	gender: "Female",
	phone: "+1 (555) 019-8372",
	address: "842 Horizon Way, Apt 3B, Seattle, WA 98101",
};

const READ_ONLY = {
	email: "s.jenkins@aetheris.med",
	username: "sjenkins_neuro",
	role: "Senior Diagnostician",
};

type GenderOption = "Male" | "Female" | "Non-binary" | "Prefer not to say";

function FormField({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<label
				className="pl-1 text-sm font-medium text-muted-foreground dark:text-[#94A3B8]"
				style={{ fontFamily: "var(--font-space-grotesk)" }}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

function TextInput({
	value,
	onChange,
	placeholder,
	readOnly,
}: {
	value: string;
	onChange?: (v: string) => void;
	placeholder?: string;
	readOnly?: boolean;
}) {
	return (
		<input
			type="text"
			value={value}
			readOnly={readOnly}
			onChange={(e) => onChange?.(e.target.value)}
			placeholder={placeholder}
			className="h-[50px] w-full rounded-xl border bg-transparent px-4 text-base outline-none transition-colors focus:border-ring dark:focus:border-white/25"
			style={{
				fontFamily: "var(--font-public-sans)",
				color: readOnly ? "#94A3B8" : "var(--foreground)",
				borderColor: readOnly ? "rgba(128,128,128,0.2)" : "var(--border)",
				background: readOnly ? "rgba(128,128,128,0.05)" : "transparent",
				borderStyle: readOnly ? "dashed" : "solid",
			}}
		/>
	);
}

export function EditProfile({
	onCancel,
	onSave,
}: {
	onCancel: () => void;
	onSave: () => void;
}) {
	const [form, setForm] = useState<EditableProfile>(DEFAULT_VALUES);
	const { t } = useTranslation();

	function set<K extends keyof EditableProfile>(
		key: K,
		val: EditableProfile[K],
	) {
		setForm((prev) => ({ ...prev, [key]: val }));
	}

	return (
		<div className="flex gap-6">
			{/* ── Left: Avatar card ─────────────────────────────── */}
			<div
				className="relative w-[277px] shrink-0 rounded-[20px] border bg-card text-card-foreground shadow-sm dark:border-white/[0.1] dark:bg-transparent dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:backdrop-blur-[10px]"
				style={
					typeof window !== "undefined" &&
					document.documentElement.classList.contains("dark")
						? { background: "rgba(255,255,255,0.03)" }
						: {}
				}
			>
				{/* Top corner glow */}
				<div
					className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full dark:bg-[rgba(146,205,253,0.1)]"
					style={{ filter: "blur(12px)" }}
				/>

				{/* Avatar */}
				<div className="flex flex-col items-center px-8 pt-8">
					<div className="group relative mb-4 cursor-pointer">
						{/* glow ring */}
						<div
							className="absolute -inset-1.5 rounded-full dark:bg-[rgba(146,205,253,0.2)]"
							style={{ filter: "blur(6px)" }}
						/>
						<div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 p-1 dark:border-[rgba(146,205,253,0.3)]">
							<div className="flex h-full w-full items-center justify-center rounded-full bg-muted opacity-80 dark:bg-[#1B2C3A]">
								<Icon
									icon="lucide:user"
									className="h-12 w-12 text-muted-foreground dark:text-[#C1C7CF]"
								/>
							</div>
							{/* Edit overlay */}
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
								<Icon icon="lucide:camera" className="h-5 w-5 text-white" />
								<span
									className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white"
									style={{ fontFamily: "var(--font-space-grotesk)" }}
								>
									Change
								</span>
							</div>
						</div>
					</div>

					{/* Name & handle */}
					<h3
						className="text-center text-2xl font-semibold text-foreground dark:text-white"
						style={{ fontFamily: "var(--font-public-sans)" }}
					>
						{form.fullName}
					</h3>
					<p
						className="mt-1 text-sm text-[#38BDF8]"
						style={{
							fontFamily: "var(--font-space-grotesk)",
							letterSpacing: "0.28px",
						}}
					>
						@{READ_ONLY.username}
					</p>

					{/* Online badge */}
					<div className="mt-3 flex items-center gap-2 rounded-full border px-3 py-1.5 dark:border-[rgba(56, 189, 248,0.2)] dark:bg-[rgba(56, 189, 248,0.1)]">
						<span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
						<span
							className="text-[10px] tracking-[0.5px] text-[#38BDF8]"
							style={{ fontFamily: "var(--font-space-grotesk)" }}
						>
							Currently Active
						</span>
					</div>
				</div>

				{/* Divider */}
				<div
					className="mx-8 my-6 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(128,128,128,0.15) 50%,rgba(255,255,255,0) 100%)",
					}}
				/>

				{/* Stats */}
				<div className="mx-8 mb-8 flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<span
							className="text-[10px] uppercase tracking-[1px] text-muted-foreground/60 dark:text-[#64748B]"
							style={{ fontFamily: "var(--font-space-grotesk)" }}
						>
							Department
						</span>
						<span
							className="text-sm text-foreground/80 dark:text-[#CBD5E1]"
							style={{ fontFamily: "var(--font-public-sans)" }}
						>
							Neurology Diagnostics
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span
							className="text-[10px] uppercase tracking-[1px] text-muted-foreground/60 dark:text-[#64748B]"
							style={{ fontFamily: "var(--font-space-grotesk)" }}
						>
							Last Login
						</span>
						<span
							className="text-sm text-foreground/80 dark:text-[#CBD5E1]"
							style={{ fontFamily: "var(--font-public-sans)" }}
						>
							Today, 08:42 AM PST
						</span>
					</div>
				</div>
			</div>

			{/* ── Right: Form ───────────────────────────────────── */}
			<div
				className="flex flex-1 flex-col rounded-[20px] border bg-card text-card-foreground shadow-sm p-8 dark:border-white/[0.1] dark:bg-transparent dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:backdrop-blur-[10px]"
				style={
					typeof window !== "undefined" &&
					document.documentElement.classList.contains("dark")
						? { background: "rgba(255,255,255,0.03)" }
						: {}
				}
			>
				{/* Section: Personal */}
				<div className="mb-4 flex items-center gap-2">
					<Icon
						icon="lucide:user"
						className="h-[17px] w-[17px] text-[#92CDFD]"
					/>
					<span
						className="text-xl text-foreground dark:text-white"
						style={{ fontFamily: "var(--font-public-sans)" }}
					>
						{t("profile.personalInfo", "Personal Information")}
					</span>
				</div>
				<div
					className="mb-8 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(128,128,128,0.15) 0%,rgba(255,255,255,0) 100%)",
					}}
				/>

				<div className="mb-6">
					<FormField label={t("profile.fullName", "Full Legal Name")}>
						<TextInput
							value={form.fullName}
							onChange={(v) => set("fullName", v)}
						/>
					</FormField>
				</div>

				<div className="mb-8 grid grid-cols-2 gap-6">
					<FormField label={t("profile.dob", "Date of Birth")}>
						<TextInput
							value={form.dob}
							onChange={(v) => set("dob", v)}
							placeholder="MM/DD/YYYY"
						/>
					</FormField>
					<FormField label={t("profile.gender", "Gender Identification")}>
						<select
							value={form.gender}
							onChange={(e) => set("gender", e.target.value as GenderOption)}
							className="h-[50px] w-full rounded-xl border bg-transparent px-4 text-base text-foreground outline-none focus:border-ring appearance-none dark:border-white/[0.1] dark:text-white dark:focus:border-white/25"
							style={{ fontFamily: "var(--font-public-sans)" }}
						>
							{(
								[
									"Male",
									"Female",
									"Non-binary",
									"Prefer not to say",
								] as GenderOption[]
							).map((g) => (
								<option
									key={g}
									value={g}
									className="bg-background text-foreground dark:bg-[#14212E] dark:text-white"
								>
									{g}
								</option>
							))}
						</select>
					</FormField>
				</div>

				{/* Section: Contact */}
				<div className="mb-4 flex items-center gap-2">
					<Icon icon="lucide:phone" className="h-[15px] w-5 text-[#92CDFD]" />
					<span
						className="text-xl text-foreground dark:text-white"
						style={{ fontFamily: "var(--font-public-sans)" }}
					>
						{t("profile.contactDetails", "Contact Details")}
					</span>
				</div>
				<div
					className="mb-8 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(128,128,128,0.15) 0%,rgba(255,255,255,0) 100%)",
					}}
				/>

				<div className="mb-6 grid grid-cols-2 gap-6">
					<FormField label={t("profile.phone", "Direct Phone")}>
						<TextInput value={form.phone} onChange={(v) => set("phone", v)} />
					</FormField>
				</div>

				<div className="mb-8">
					<FormField label={t("profile.address", "Residential Address")}>
						<TextInput
							value={form.address}
							onChange={(v) => set("address", v)}
						/>
					</FormField>
				</div>

				{/* Section: Account (Read-only) */}
				<div className="mb-4 flex items-center gap-2">
					<Icon
						icon="lucide:lock"
						className="h-[17.5px] w-[13px] text-muted-foreground/60 dark:text-[#475569]"
					/>
					<span
						className="text-xl text-muted-foreground/60 dark:text-[#64748B]"
						style={{ fontFamily: "var(--font-public-sans)" }}
					>
						{t("profile.accountCredentials", "Account Credentials (Read-only)")}
					</span>
				</div>
				<div
					className="mb-8 h-px"
					style={{
						background:
							"linear-gradient(90deg,rgba(128,128,128,0.05) 0%,rgba(255,255,255,0) 100%)",
					}}
				/>

				<div className="mb-8">
					<FormField label={t("profile.email", "Primary Email")}>
						<div className="relative">
							<TextInput value={READ_ONLY.email} readOnly />
							<Icon
								icon="lucide:lock"
								className="absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 dark:text-[#64748B]"
							/>
						</div>
					</FormField>
				</div>

				<div className="mb-8 grid grid-cols-2 gap-6">
					<FormField label={t("profile.username", "System Username")}>
						<TextInput value={READ_ONLY.username} readOnly />
					</FormField>
					<FormField label={t("profile.role", "Access Role")}>
						<TextInput value={READ_ONLY.role} readOnly />
					</FormField>
				</div>

				{/* Footer */}
				<div className="mt-auto flex justify-end gap-4 border-t pt-6 dark:border-white/[0.1]">
					<button
						onClick={onCancel}
						className="rounded-full border px-6 py-2.5 text-sm font-medium text-foreground transition-colors dark:border-white/[0.2] dark:text-[#E1E2E6] dark:hover:bg-white/[0.05]"
						style={{
							fontFamily: "var(--font-space-grotesk)",
							letterSpacing: "0.35px",
						}}
					>
						{t("common.cancel", "Cancel")}
					</button>
					<button
						onClick={onSave}
						className="rounded-full px-8 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{
							background: "#92CDFD",
							boxShadow:
								"0 0 15px rgba(146,205,253,0.2), inset 0 0 10px rgba(255,255,255,0.5)",
							fontFamily: "var(--font-space-grotesk)",
							letterSpacing: "0.35px",
						}}
					>
						{t("profile.saveChanges", "Save Changes")}
					</button>
				</div>
			</div>
		</div>
	);
}
