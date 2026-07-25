"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	TransferModal,
	ChangesModal,
} from "@/features/schedule/components/ScheduleModals";
import {
	doctorName,
	SCHEDULE_STATUS_STYLE,
	unwrapArr,
} from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface Schedule {
	schedule_id: string;
	doctor_id: string;
	clinic_id: string;
	shift_id?: string | null;
	work_date: string;
	max_patients?: number;
	status?: string;
	clinic?: { clinic_name?: string };
}

export default function WorkSchedulesPage() {
	const qc = useQueryClient();
	const [transferFor, setTransferFor] = useState<Schedule | null>(null);
	const [changesFor, setChangesFor] = useState<Schedule | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["doctor-schedules", "list"],
		queryFn: () =>
			apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, { params: { limit: 50 } }),
	});
	const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);

	const cancel = useMutation({
		mutationFn: (id: string) =>
			apiClient.post(API_ENDPOINTS.SCHEDULE.CANCEL(id)),
		onSuccess: () => {
			toast.success("Schedule cancelled");
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
		},
		onError: (e) => toast.apiError(e, "Failed to cancel"),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							Work &amp; On-Call Schedules
						</h1>
						<p className="text-sm text-smile-description">
							{schedules.length} shifts
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href={ROUTES.MY_SCHEDULE}
							className="flex items-center gap-2 rounded-full border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-4 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
						>
							<Icon icon="lucide:user-round" width={15} /> My Schedule
						</Link>
						<Link
							href={ROUTES.DOCTOR_SCHEDULE_NEW}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} /> New Schedule
						</Link>
					</div>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
					</div>
				)}
				{isError && !isLoading && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}
					>
						Failed to load.{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							Retry
						</button>
					</div>
				)}
				{!isLoading && !isError && schedules.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						No schedules yet.
					</div>
				)}

				{!isLoading && !isError && schedules.length > 0 && (
					<div className={`${cardBase} overflow-x-auto`}>
						<table className="w-full text-left text-sm">
							<thead className="border-b [border-color:var(--surface-panel-border)] text-xs uppercase tracking-wide text-smile-description font-poppins">
								<tr>
									<th className="px-5 py-4">Doctor</th>
									<th className="px-5 py-4">Clinic</th>
									<th className="px-5 py-4">Date</th>
									<th className="px-5 py-4">Max</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{schedules.map((s) => (
									<tr
										key={s.schedule_id}
										className="border-b [border-color:var(--surface-panel-border)] last:border-0 transition hover:bg-smile-primary-light/30"
									>
										<td className="px-5 py-4 font-medium text-smile-title">
											{doctorName(s.doctor_id)}
										</td>
										<td className="px-5 py-4 text-smile-description">
											{s.clinic?.clinic_name ?? "—"}
										</td>
										<td className="px-5 py-4 text-smile-title">
											{s.work_date}
										</td>
										<td className="px-5 py-4 text-smile-description">
											{s.max_patients ?? "—"}
										</td>
										<td className="px-5 py-4">
											<span
												className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? "").toLowerCase()] ?? "text-smile-description"}`}
											>
												{s.status ?? "—"}
											</span>
										</td>
										<td className="px-5 py-4">
											<div className="flex justify-end gap-1.5">
												<Link
													href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)}
													title="Edit"
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
												>
													<Icon icon="lucide:pencil" width={14} />
												</Link>
												<button
													onClick={() => setTransferFor(s)}
													title="Transfer shift"
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-primary transition hover:border-smile-primary/40"
												>
													<Icon icon="lucide:arrow-left-right" width={14} />
												</button>
												<button
													onClick={() => setChangesFor(s)}
													title="Change history"
													className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] p-1.5 text-smile-description transition hover:border-smile-primary/40 hover:text-smile-primary"
												>
													<Icon icon="lucide:history" width={14} />
												</button>
												{s.status !== "cancelled" && (
													<button
														onClick={() => {
															if (confirm("Cancel this schedule?"))
																cancel.mutate(s.schedule_id);
														}}
														title="Cancel"
														className="rounded-lg border border-red-400/30 bg-red-400/10 p-1.5 text-red-600 dark:text-red-300 transition hover:bg-red-400/20"
													>
														<Icon icon="lucide:x" width={14} />
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<p className="text-xs text-smile-description">
					<Icon
						icon="lucide:bell"
						width={12}
						className="mr-1 inline text-smile-primary"
					/>
					Creating, updating or transferring a schedule notifies the affected
					doctor (see the bell in the top bar).
				</p>
			</div>

			{transferFor && (
				<TransferModal
					scheduleId={transferFor.schedule_id}
					fromDoctorId={transferFor.doctor_id}
					onClose={() => setTransferFor(null)}
					onDone={() => {
						setTransferFor(null);
						qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
					}}
				/>
			)}
			{changesFor && (
				<ChangesModal
					scheduleId={changesFor.schedule_id}
					onClose={() => setChangesFor(null)}
				/>
			)}
		</AppShell>
	);
}
