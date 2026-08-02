"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { genderLabel } from "@/shared/constants/common";
import { PATIENT_REGISTRATION_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface Patient {
	patient_id: string;
	patient_code: string;
	full_name: string;
	gender?: number;
	date_of_birth?: string;
	phone?: string;
	email?: string;
}

function unwrapArr<T>(res: unknown): T[] {
	const payload = (res as { data?: unknown })?.data;
	if (Array.isArray(payload)) return payload as T[];
	const inner = (payload as { data?: unknown })?.data;
	return Array.isArray(inner) ? (inner as T[]) : [];
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

export default function PatientsPage() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const { user } = useAuthStore();
	const canRegisterPatients = (user?.roles ?? []).some((role) =>
		(PATIENT_REGISTRATION_ROLES as string[]).includes(role),
	);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["patients", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.PATIENT.LIST),
	});

	const patients = useMemo(() => unwrapArr<Patient>(data), [data]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return patients;
		return patients.filter(
			(p) =>
				(p.full_name ?? "").toLowerCase().includes(q) ||
				(p.patient_code ?? "").toLowerCase().includes(q),
		);
	}, [patients, search]);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
							{t("patients.list.heading", "Patients")}
						</h1>
						<p className="font-inter text-sm text-smile-description">
							{patients.length}{" "}
							{patients.length === 1
								? t("patients.list.patientSingular", "patient")
								: t("patients.list.patientPlural", "patients")}
						</p>
					</div>
					{canRegisterPatients && (
						<Link
							href={ROUTES.PATIENT_NEW}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} />{" "}
							{t("patients.addPatient", "Add Patient")}
						</Link>
					)}
				</div>

				{/* Search */}
				<div className="relative max-w-md">
					<Icon
						icon="lucide:search"
						width={15}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t(
							"patients.list.searchPlaceholder",
							"Search by name or code…",
						)}
						className="h-11 w-full rounded-xl border pl-10 pr-4 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
					/>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("patients.list.loadingPatients", "Loading patients…")}
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						{t("patients.list.loadError", "Failed to load patients.")}{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}

				{!isLoading && !isError && filtered.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{patients.length === 0
							? t("patients.list.emptyNoPatients", "No patients found.")
							: t(
									"patients.list.emptyNoMatch",
									"No patients match your search.",
								)}
					</div>
				)}

				{/* Table */}
				{!isLoading && !isError && filtered.length > 0 && (
					<div className={`${cardBase} overflow-hidden`}>
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b text-xs uppercase tracking-[1px] text-smile-description [border-color:var(--surface-panel-border)]">
									<th className="px-5 py-3 font-semibold">
										{t("patients.list.colCode", "Code")}
									</th>
									<th className="px-5 py-3 font-semibold">
										{t("patients.list.colName", "Name")}
									</th>
									<th className="px-5 py-3 font-semibold">
										{t("patients.list.colGender", "Gender")}
									</th>
									<th className="px-5 py-3 font-semibold">
										{t("patients.list.colDob", "Date of birth")}
									</th>
									<th className="px-5 py-3 font-semibold">
										{t("patients.list.colPhone", "Phone")}
									</th>
									<th className="px-5 py-3 text-right font-semibold">
										{t("patients.list.colAction", "Action")}
									</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((p) => (
									<tr
										key={p.patient_id}
										className="border-b transition hover:bg-smile-primary-light/30 [border-color:var(--surface-panel-border)]"
									>
										<td className="px-5 py-3">
											<span className="rounded-full border border-smile-primary/15 bg-smile-primary-light px-2.5 py-0.5 font-mono text-xs font-semibold text-smile-primary">
												{p.patient_code}
											</span>
										</td>
										<td className="px-5 py-3 font-medium text-smile-title">
											{p.full_name}
										</td>
										<td className="px-5 py-3 text-smile-description">
											{genderLabel(p.gender)}
										</td>
										<td className="px-5 py-3 text-smile-description">
											{fmtDate(p.date_of_birth)}
										</td>
										<td className="px-5 py-3 text-smile-description">
											{p.phone || "—"}
										</td>
										<td className="px-5 py-3 text-right">
											<Link
												href={ROUTES.PATIENT_DETAIL(p.patient_id)}
												className="rounded-lg border px-3 py-1 font-inter text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
											>
												{t("patients.list.view", "View")}
											</Link>
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
