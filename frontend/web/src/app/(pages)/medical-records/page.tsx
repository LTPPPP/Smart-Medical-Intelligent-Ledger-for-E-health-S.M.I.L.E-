"use client";

import { useMemo } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface MedicalRecordRow {
	record_id: string;
	visit_date: string;
	chief_complaint?: string | null;
	diagnosis?: string | null;
}

function unwrapArr<T>(res: unknown): T[] {
	const payload = (res as { data?: unknown })?.data;
	if (Array.isArray(payload)) return payload as T[];
	const inner = (payload as { data?: unknown })?.data;
	return Array.isArray(inner) ? (inner as T[]) : [];
}

export default function MyMedicalRecordsPage() {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["medical-records", "me"],
		queryFn: () => apiClient.get(API_ENDPOINTS.MEDICAL_RECORD.ME_LIST),
	});
	const records = useMemo(() => unwrapArr<MedicalRecordRow>(data), [data]);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<div>
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
						{t("medicalRecords.list.title", "My Medical Records")}
					</h1>
					<p className="font-inter text-sm text-smile-description">
						{t(
							"medicalRecords.list.subtitle",
							"Your finalized visit summaries, diagnoses, and prescriptions.",
						)}
					</p>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("medicalRecords.list.loading", "Loading medical records…")}
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-500 dark:text-red-300`}
					>
						{t("medicalRecords.list.failedToLoad", "Failed to load medical records.")}{" "}
						<button onClick={() => refetch()} className="font-semibold underline">
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}

				{!isLoading && !isError && records.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t(
							"medicalRecords.list.empty",
							"You have no finalized medical records yet.",
						)}
					</div>
				)}

				{!isLoading && !isError && records.length > 0 && (
					<div className="flex flex-col gap-4">
						{records.map((r) => (
							<Link
								key={r.record_id}
								href={ROUTES.MY_MEDICAL_RECORD_DETAIL(r.record_id)}
								className={`${cardBase} flex items-center justify-between gap-4 p-6 transition hover:border-smile-primary/40`}
							>
								<div className="flex items-center gap-4">
									<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-smile-primary-light [border-color:var(--surface-panel-border)]">
										<Icon
											icon="lucide:clipboard-list"
											width={19}
											className="text-smile-primary"
										/>
									</span>
									<div className="flex flex-col gap-0.5">
										<p className="font-poppins text-sm font-semibold text-smile-title">
											{new Date(r.visit_date).toLocaleDateString()}
										</p>
										<p className="font-inter text-xs text-smile-description">
											{r.diagnosis || r.chief_complaint || "—"}
										</p>
									</div>
								</div>
								<Icon
									icon="lucide:chevron-right"
									width={18}
									className="shrink-0 text-smile-description"
								/>
							</Link>
						))}
					</div>
				)}
			</div>
		</AppShell>
	);
}
