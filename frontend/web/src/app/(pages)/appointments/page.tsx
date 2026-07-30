"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import type { AppointmentRow } from "@/features/appointment/types/appointment.type";
import { useAuthStore } from "@/features/auth/store/authStore";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { resolveDashboardKind } from "@/shared/constants/nav";
import { BOOKING_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

const STATUS_STYLES: Record<string, string> = {
	scheduled: "bg-smile-primary/10 text-smile-primary border-smile-primary/30",
	confirmed:
		"bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-300",
	completed:
		"bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-300",
	cancelled: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-300",
	no_show:
		"bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-300",
};

const PAY_STYLES: Record<string, string> = {
	paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-300",
	unpaid:
		"bg-smile-primary-light text-smile-description border-smile-primary/15",
	partially_paid:
		"bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-300",
	refunded:
		"bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-300",
};

const FILTERS = [
	"all",
	"scheduled",
	"confirmed",
	"completed",
	"cancelled",
	"no_show",
] as const;

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
	return (
		<span
			className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[value] ?? "bg-smile-primary-light text-smile-description border-smile-primary/15"}`}
		>
			{value?.replace("_", " ")}
		</span>
	);
}

export default function AppointmentsPage() {
	const { user } = useAuthStore();
	const dashboardKind = resolveDashboardKind(user?.roles);
	const isDoctor = dashboardKind === "doctor";
	const currentDoctorId = user?.userId ?? "";
	const isPatient = dashboardKind === "patient";
	const canBookAppointment = (user?.roles ?? []).some((role) =>
		(BOOKING_ROLES as string[]).includes(role),
	);
	const { data, isLoading, isError, error, refetch } = useQuery({
		queryKey: [
			"appointments",
			"list",
			{ limit: 50, scope: isDoctor ? currentDoctorId : "all" },
		],
		queryFn: () =>
			apiClient.get(
				isDoctor && currentDoctorId
					? API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(currentDoctorId)
					: API_ENDPOINTS.APPOINTMENT.LIST,
				{ params: { limit: 50 } },
			),
		enabled: !isDoctor || !!currentDoctorId,
	});
	// A brand-new patient account (just registered / signed up via Google) has
	// no patient directory row yet, so the backend can't scope the query and
	// returns 403 — that's really just "you have no appointments yet", not a
	// real failure, so don't scare a first-time patient with an error banner.
	const isUnprovisionedPatient =
		isPatient &&
		(error as { response?: { status?: number } } | null)?.response
			?.status === 403;
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

	const rows = useMemo<AppointmentRow[]>(() => {
		const payload = data?.data as unknown;
		if (Array.isArray(payload)) return payload as AppointmentRow[];
		const inner = (payload as { data?: unknown })?.data;
		return Array.isArray(inner) ? (inner as AppointmentRow[]) : [];
	}, [data]);

	const filtered =
		filter === "all" ? rows : rows.filter((r) => r.status === filter);
	const paidCount = rows.filter((r) => r.payment_status === "paid").length;

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
							Appointments
						</h1>
						<p className="font-inter text-sm text-smile-description">
							{rows.length} total ·{" "}
							<span className="font-semibold text-smile-primary">
								{paidCount} paid
							</span>
						</p>
					</div>
					{canBookAppointment && (
						<Link
							href={ROUTES.APPOINTMENT_NEW}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} /> New Appointment
						</Link>
					)}
				</div>

				{/* Filters */}
				<div className="max-w-[220px]">
					<select
						value={filter}
						onChange={(e) =>
							setFilter(e.target.value as (typeof FILTERS)[number])
						}
						className="h-10 w-full rounded-full border px-4 font-inter text-xs font-semibold capitalize text-smile-title outline-none transition [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] focus:border-smile-primary/50"
					>
						{FILTERS.map((f) => (
							<option key={f} value={f} className="capitalize">
								{f.replace("_", " ")}
							</option>
						))}
					</select>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} /> Loading
						appointments…
					</div>
				)}

				{isError && !isLoading && !isUnprovisionedPatient && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-500 dark:text-red-300`}
					>
						Failed to load appointments.{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							Retry
						</button>
					</div>
				)}

				{!isLoading &&
					(isUnprovisionedPatient ||
						(!isError && filtered.length === 0)) && (
						<div
							className={`${cardBase} p-10 text-center text-sm text-smile-description`}
						>
							{isUnprovisionedPatient
								? "You have no appointments yet."
								: "No appointments found for this filter."}
						</div>
					)}

				{!isLoading && !isError && !isUnprovisionedPatient && filtered.length > 0 && (
					<div className={`${cardBase} overflow-x-auto`}>
						<table className="w-full text-left text-sm">
							<thead className="border-b text-xs uppercase tracking-wide text-smile-description [border-color:var(--surface-panel-border)]">
								<tr>
									<th className="px-5 py-4">Code</th>
									<th className="px-5 py-4">Date</th>
									<th className="px-5 py-4">Time</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4">Payment</th>
									<th className="px-5 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((r) => (
									<tr
										key={r.appointment_id}
										className="border-b transition last:border-0 hover:bg-smile-primary-light/30 [border-color:var(--surface-panel-border)]"
									>
										<td className="px-5 py-4 font-mono text-xs font-semibold text-smile-primary">
											{r.appointment_code}
										</td>
										<td className="px-5 py-4 text-smile-title">
											{r.appointment_date}
										</td>
										<td className="px-5 py-4 text-smile-title">
											{r.appointment_time?.slice(0, 5)}
										</td>
										<td className="px-5 py-4">
											<Badge value={r.status} map={STATUS_STYLES} />
										</td>
										<td className="px-5 py-4">
											<Badge value={r.payment_status} map={PAY_STYLES} />
										</td>
										<td className="px-5 py-4">
											<div className="flex justify-end gap-2">
												<Link
													href={ROUTES.APPOINTMENT_DETAIL(r.appointment_id)}
													title="View"
													className="flex h-8 w-8 items-center justify-center rounded-lg border text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
												>
													<Icon icon="lucide:eye" width={15} />
												</Link>
												{r.payment_status === "unpaid" && (
													<Link
														href={ROUTES.APPOINTMENT_PAYMENT(r.appointment_id)}
														title="Pay"
														className="flex h-8 w-8 items-center justify-center rounded-lg bg-smile-primary text-white transition hover:bg-smile-primary-dark"
													>
														<Icon icon="lucide:credit-card" width={15} />
													</Link>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</AppShell>
	);
}
