"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	ADMIN_ROLES,
	DENTAL_IMAGE_ROLES,
	EXAMINATION_ROLES,
	LEAVES_ROLES,
	MY_SCHEDULE_ROLES,
	PATIENT_DIRECTORY_ROLES,
	SCHEDULE_MANAGEMENT_ROLES,
} from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

interface AppFeature {
	label: string;
	labelKey: string;
	href: string;
	icon: string;
	color: string;
	requiredRoles?: string[];
}

const CATEGORY_STYLES: Record<string, string> = {
	blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
	emerald:
		"bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
	orange:
		"bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400",
	teal: "bg-teal-500/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400",
	purple:
		"bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400",
	cyan: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400",
	pink: "bg-pink-500/10 text-pink-600 dark:bg-pink-400/10 dark:text-pink-400",
	indigo:
		"bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400",
};

// All Users
const GENERAL_FEATURES: AppFeature[] = [
	{
		label: "Appointments",
		labelKey: "landing.appModal.features.appointments",
		href: ROUTES.APPOINTMENTS,
		icon: "lucide:calendar-clock",
		color: "emerald",
	},
	{
		label: "Clinics",
		labelKey: "landing.appModal.features.clinics",
		href: ROUTES.CLINICS,
		icon: "lucide:hospital",
		color: "orange",
	},
	{
		label: "Services",
		labelKey: "landing.appModal.features.services",
		href: ROUTES.SERVICES,
		icon: "lucide:stethoscope",
		color: "teal",
	},
	{
		label: "Specialties",
		labelKey: "landing.appModal.features.specialties",
		href: ROUTES.SPECIALTIES,
		icon: "lucide:tags",
		color: "purple",
	},
];

// Role Guarded Features
const ROLE_FEATURES: AppFeature[] = [
	{
		label: "Admin Panel",
		labelKey: "landing.appModal.features.adminPanel",
		href: ROUTES.ADMIN,
		icon: "lucide:shield",
		color: "indigo",
		requiredRoles: ADMIN_ROLES,
	},
	{
		label: "Patients",
		labelKey: "landing.appModal.features.patients",
		href: ROUTES.PATIENTS,
		icon: "lucide:users",
		color: "blue",
		requiredRoles: PATIENT_DIRECTORY_ROLES,
	},
	{
		label: "Examinations",
		labelKey: "landing.appModal.features.examinations",
		href: ROUTES.EXAMINATIONS,
		icon: "lucide:clipboard-check",
		color: "emerald",
		requiredRoles: EXAMINATION_ROLES,
	},
	{
		label: "Dental Images",
		labelKey: "landing.appModal.features.dentalImages",
		href: ROUTES.DENTAL_IMAGES,
		icon: "lucide:scan",
		color: "cyan",
		requiredRoles: DENTAL_IMAGE_ROLES,
	},
	{
		label: "My Schedule",
		labelKey: "landing.appModal.features.mySchedule",
		href: ROUTES.MY_SCHEDULE,
		icon: "lucide:calendar-days",
		color: "purple",
		requiredRoles: MY_SCHEDULE_ROLES,
	},
	{
		label: "Doctor Schedules",
		labelKey: "landing.appModal.features.doctorSchedules",
		href: ROUTES.DOCTOR_SCHEDULES,
		icon: "lucide:calendar-cog",
		color: "teal",
		requiredRoles: SCHEDULE_MANAGEMENT_ROLES,
	},
	{
		label: "Leave Requests",
		labelKey: "landing.appModal.features.leaveRequests",
		href: ROUTES.DOCTOR_LEAVES,
		icon: "lucide:calendar-off",
		color: "pink",
		requiredRoles: LEAVES_ROLES,
	},
];

interface AppModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AppModal({ open, onOpenChange }: AppModalProps) {
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const onClose = () => onOpenChange(false);

	const roleFeatures = useMemo(() => {
		if (!user) return [];
		return ROLE_FEATURES.filter(
			(feature) =>
				!feature.requiredRoles ||
				feature.requiredRoles.some((role) => user.roles.includes(role)),
		);
	}, [user]);

	const allFeatures = useMemo(
		() => [...GENERAL_FEATURES, ...roleFeatures],
		[roleFeatures],
	);

	const searchResults = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return allFeatures.filter((feature) =>
			feature.label.toLowerCase().includes(q),
		);
	}, [allFeatures, searchQuery]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (open) document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => inputRef.current?.focus(), 0);
			return () => clearTimeout(timer);
		}
		setSearchQuery("");
	}, [open]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={t("landing.appModal.ariaLabel", "Application")}
			className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-xs dark:bg-black/60"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl backdrop-blur-2xl"
				style={{
					background: "var(--surface-card-bg)",
					border: "1px solid var(--surface-card-border)",
					boxShadow: "var(--surface-card-shadow)",
				}}
			>
				{/* Search Bar */}
				<div
					className="p-4"
					style={{ borderBottom: "1px solid var(--surface-panel-border)" }}
				>
					<div
						className="relative flex items-center gap-3 rounded-xl px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-smile-primary/30"
						style={{
							background: "var(--surface-input-bg)",
							border: "1px solid var(--surface-input-border)",
							boxShadow: "var(--surface-input-shadow)",
						}}
					>
						<Icon
							icon="lucide:search"
							width={18}
							className="shrink-0 text-smile-description"
						/>
						<input
							ref={inputRef}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={t(
								"landing.appModal.searchPlaceholder",
								"Search features…",
							)}
							className="w-full border-none bg-transparent font-inter text-sm text-smile-title outline-none placeholder:text-smile-description"
						/>
						<kbd
							className="ml-auto hidden shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] text-smile-description sm:block"
							style={{ background: "var(--surface-panel-bg)" }}
						>
							{t("landing.appModal.esc", "Esc")}
						</kbd>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-4">
					{searchQuery ? (
						<div>
							<h4 className="mb-3 px-1 font-black text-[10px] uppercase tracking-[0.2em] text-smile-description">
								{t("landing.appModal.searchResults", "Search Results")}
							</h4>
							{searchResults.length > 0 ? (
								<div className="space-y-1.5">
									{searchResults.map((feature) => (
										<Link
											key={feature.href}
											href={feature.href}
											onClick={onClose}
											className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-smile-primary/20"
											style={{ background: "var(--surface-panel-bg)" }}
										>
											<div
												className={cn(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
													CATEGORY_STYLES[feature.color],
												)}
											>
												<Icon icon={feature.icon} width={18} />
											</div>
											<span className="font-inter text-sm font-medium text-smile-title transition-colors group-hover:text-smile-primary">
												{t(feature.labelKey, feature.label)}
											</span>
											<Icon
												icon="lucide:chevron-right"
												width={16}
												className="ml-auto text-smile-description opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
											/>
										</Link>
									))}
								</div>
							) : (
								<div className="py-10 text-center">
									<p className="font-black text-[10px] uppercase tracking-[0.2em] text-smile-description">
										{t("landing.appModal.noMatchingFeature", "No matching feature")}
									</p>
									<p className="mt-2 font-inter text-xs text-smile-description">
										{t("landing.appModal.tryDifferentKeyword", "Try a different keyword")}
									</p>
								</div>
							)}
						</div>
					) : (
						<>
							<div className="mb-6 px-1">
								<h4 className="mb-3 font-black text-[10px] uppercase tracking-[0.2em] text-smile-description">
									{t("landing.appModal.general", "General")}
								</h4>
								<div className="grid grid-cols-2 gap-2">
									{GENERAL_FEATURES.map((feature) => (
										<Link
											key={feature.href}
											href={feature.href}
											onClick={onClose}
											className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-smile-primary/20"
											style={{ background: "var(--surface-panel-bg)" }}
										>
											<div
												className={cn(
													"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
													CATEGORY_STYLES[feature.color],
												)}
											>
												<Icon icon={feature.icon} width={20} />
											</div>
											<span className="min-w-0 flex-1 truncate font-inter text-xs font-semibold text-smile-title">
												{t(feature.labelKey, feature.label)}
											</span>
										</Link>
									))}
								</div>
							</div>

							{roleFeatures.length > 0 && (
								<div className="px-1">
									<h4 className="mb-3 font-black text-[10px] uppercase tracking-[0.2em] text-smile-description">
										{t("landing.appModal.yourTools", "Your Tools")}
									</h4>
									<div className="grid grid-cols-2 gap-2">
										{roleFeatures.map((feature) => (
											<Link
												key={feature.href}
												href={feature.href}
												onClick={onClose}
												className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-smile-primary/20"
												style={{ background: "var(--surface-panel-bg)" }}
											>
												<div
													className={cn(
														"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
														CATEGORY_STYLES[feature.color],
													)}
												>
													<Icon icon={feature.icon} width={20} />
												</div>
												<span className="min-w-0 flex-1 truncate font-inter text-xs font-semibold text-smile-title">
													{t(feature.labelKey, feature.label)}
												</span>
											</Link>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{/* Footer */}
				<div
					className="flex items-center justify-between p-4"
					style={{
						borderTop: "1px solid var(--surface-panel-border)",
						background: "var(--surface-panel-bg)",
					}}
				>
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded bg-smile-primary text-white">
							<Icon icon="mdi:tooth" width={14} />
						</div>
						<span className="font-poppins text-[10px] font-bold tracking-wider text-smile-description">
							S.M.I.L.E
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="font-black text-[10px] uppercase tracking-widest text-smile-description transition-colors hover:text-smile-primary"
					>
						{t("landing.appModal.close", "Close")}
					</button>
				</div>
			</div>
		</div>
	);
}
