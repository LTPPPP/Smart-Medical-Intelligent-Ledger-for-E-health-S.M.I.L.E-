"use client";

import { useMemo } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { CLINIC_MANAGEMENT_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface OpenClose {
	open: string;
	close: string;
}
interface Clinic {
	clinic_id: string;
	clinic_name: string;
	clinic_code: string;
	address?: string;
	ward?: string;
	district?: string;
	city?: string;
	phone?: string;
	email?: string;
	status?: string;
	license_number?: string;
	operating_hours?: Record<string, OpenClose | null>;
}

const DAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

function todayHours(oh?: Record<string, OpenClose | null>): string {
	if (!oh) return "—";
	const day = DAYS[(new Date().getDay() + 6) % 7]; // JS Sun=0 → our Mon=0
	const t = oh[day];
	return t ? `${t.open} – ${t.close}` : "Closed today";
}

export default function ClinicsPage() {
	const { user } = useAuthStore();
	const canManageClinics = (user?.roles ?? []).some((role) =>
		(CLINIC_MANAGEMENT_ROLES as string[]).includes(role),
	);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () =>
			apiClient.get<{ data?: Clinic[] } | Clinic[]>(API_ENDPOINTS.CLINIC.LIST),
	});

	const clinics = useMemo<Clinic[]>(() => {
		const payload = (data as { data?: unknown } | undefined)?.data;
		if (Array.isArray(payload)) return payload as Clinic[];
		const inner = (payload as { data?: unknown })?.data;
		return Array.isArray(inner) ? (inner as Clinic[]) : [];
	}, [data]);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							Clinics
						</h1>
						<p className="text-sm text-smile-description">
							{clinics.length} location{clinics.length === 1 ? "" : "s"}
						</p>
					</div>
					{canManageClinics && (
						<Link
							href={ROUTES.CLINIC_NEW}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} /> Add Clinic
						</Link>
					)}
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} /> Loading
						clinics…
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}
					>
						Failed to load clinics.{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							Retry
						</button>
					</div>
				)}

				{!isLoading && !isError && clinics.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						No clinics found.
					</div>
				)}

				{/* Grid */}
				{!isLoading && !isError && clinics.length > 0 && (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{clinics.map((c) => {
							const active = (c.status ?? "").toUpperCase() === "ACTIVE";
							const fullAddress = [c.address, c.district, c.city]
								.filter(Boolean)
								.join(", ");
							return (
								<div
									key={c.clinic_id}
									className={`${cardBase} flex flex-col gap-4 p-6`}
								>
									{/* Top */}
									<div className="flex items-start gap-4">
										<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
											<Icon
												icon="lucide:building-2"
												width={22}
												className="text-smile-primary"
											/>
										</span>
										<div className="flex flex-1 flex-col gap-1">
											<h3 className="text-[18px] font-semibold text-smile-title font-poppins">
												{c.clinic_name}
											</h3>
											<div className="flex flex-wrap items-center gap-2">
												<span className="rounded-full border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-2.5 py-0.5 font-mono text-xs font-semibold text-smile-primary">
													{c.clinic_code}
												</span>
												<span
													className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${active ? "border-smile-primary/30 bg-smile-primary/15 text-smile-primary" : "border-smile-primary/15 bg-smile-primary-light/40 text-smile-description"}`}
												>
													{(c.status ?? "unknown").toLowerCase()}
												</span>
											</div>
										</div>
									</div>

									{/* Details */}
									<div className="flex flex-col gap-2.5 text-sm text-smile-description">
										<div className="flex items-start gap-2.5">
											<Icon
												icon="lucide:map-pin"
												width={16}
												className="mt-0.5 shrink-0 text-smile-primary"
											/>
											<span>{fullAddress || "—"}</span>
										</div>
										<div className="flex items-center gap-2.5">
											<Icon
												icon="lucide:phone"
												width={16}
												className="shrink-0 text-smile-primary"
											/>
											<span>{c.phone || "—"}</span>
										</div>
										<div className="flex items-center gap-2.5">
											<Icon
												icon="lucide:mail"
												width={16}
												className="shrink-0 text-smile-primary"
											/>
											<span>{c.email || "—"}</span>
										</div>
										<div className="flex items-center gap-2.5">
											<Icon
												icon="lucide:clock"
												width={16}
												className="shrink-0 text-smile-primary"
											/>
											<span>Today: {todayHours(c.operating_hours)}</span>
										</div>
									</div>

									{/* Footer */}
									<div className="flex items-center justify-between border-t [border-color:var(--surface-panel-border)] pt-4">
										<span className="text-xs text-smile-description">
											License: {c.license_number || "—"}
										</span>
										<Link
											href={ROUTES.CLINIC_DETAIL(c.clinic_id)}
											className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
										>
											View details
										</Link>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</AppShell>
	);
}
