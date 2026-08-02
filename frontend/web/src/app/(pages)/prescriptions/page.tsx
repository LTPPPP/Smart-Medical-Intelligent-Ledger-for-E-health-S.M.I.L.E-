"use client";

import { useMemo } from "react";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface PrescriptionItem {
	item_id: string;
	medication_name: string;
	dosage: string;
	frequency: string;
	duration_days?: number | null;
	instructions?: string | null;
}
interface Prescription {
	prescription_id: string;
	prescription_date: string;
	status: string;
	notes?: string | null;
	items: PrescriptionItem[];
}

const STATUS_STYLE: Record<string, string> = {
	issued: "bg-smile-primary/10 text-smile-primary border-smile-primary/30",
	draft:
		"bg-smile-primary-light text-smile-description border-smile-primary/15",
	cancelled: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-300",
};

function unwrapArr<T>(res: unknown): T[] {
	const payload = (res as { data?: unknown })?.data;
	if (Array.isArray(payload)) return payload as T[];
	const inner = (payload as { data?: unknown })?.data;
	return Array.isArray(inner) ? (inner as T[]) : [];
}

export default function PrescriptionsPage() {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["prescriptions", "me"],
		queryFn: () => apiClient.get(API_ENDPOINTS.PRESCRIPTION.ME),
	});
	const prescriptions = useMemo(() => unwrapArr<Prescription>(data), [data]);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<div>
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
						My Prescriptions
					</h1>
					<p className="font-inter text-sm text-smile-description">
						Medications prescribed to you after an examination.
					</p>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} /> Loading
						prescriptions…
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						Failed to load prescriptions.{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							Retry
						</button>
					</div>
				)}

				{!isLoading && !isError && prescriptions.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						No prescriptions yet.
					</div>
				)}

				{!isLoading && !isError && prescriptions.length > 0 && (
					<div className="flex flex-col gap-4">
						{prescriptions.map((p) => (
							<div
								key={p.prescription_id}
								className={`${cardBase} flex flex-col gap-4 p-6`}
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-poppins text-sm font-semibold text-smile-title">
										{new Date(p.prescription_date).toLocaleDateString()}
									</p>
									<span
										className={`rounded-full border px-2.5 py-0.5 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[p.status] ?? "text-smile-description"}`}
									>
										{p.status}
									</span>
								</div>
								{p.items?.length > 0 ? (
									<div className="flex flex-col divide-y [border-color:var(--surface-panel-border)]">
										{p.items.map((item) => (
											<div
												key={item.item_id}
												className="flex flex-col gap-1 py-3"
											>
												<p className="font-inter text-sm font-semibold text-smile-title">
													{item.medication_name}
												</p>
												<p className="font-inter text-xs text-smile-description">
													{item.dosage} · {item.frequency}
													{item.duration_days
														? ` · ${item.duration_days} days`
														: ""}
												</p>
												{item.instructions && (
													<p className="font-inter text-xs text-smile-description">
														{item.instructions}
													</p>
												)}
											</div>
										))}
									</div>
								) : (
									<p className="font-inter text-sm text-smile-description">
										No medications listed.
									</p>
								)}
								{p.notes && (
									<p className="font-inter text-xs text-smile-description">
										Note: {p.notes}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</AppShell>
	);
}
