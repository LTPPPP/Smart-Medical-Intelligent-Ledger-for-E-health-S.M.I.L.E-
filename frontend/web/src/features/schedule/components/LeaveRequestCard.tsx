"use client";

import { Icon } from "@iconify/react";

import { cardBase } from "@/features/reports/components/ReportPrimitives";

import type { DoctorLeave, LeaveStatus } from "../types/schedule.type";

const STATUS_CONFIG: Record<
	LeaveStatus,
	{ label: string; className: string; icon: string }
> = {
	PENDING: {
		label: "Pending",
		className:
			"border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
		icon: "mdi:clock-outline",
	},
	APPROVED: {
		label: "Approved",
		className:
			"border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
		icon: "mdi:check-circle-outline",
	},
	REJECTED: {
		label: "Rejected",
		className: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
		icon: "mdi:close-circle-outline",
	},
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0].toUpperCase())
		.join("");
}

interface LeaveRequestCardProps {
	leave: DoctorLeave;
	onApprove?: () => void;
	onReject?: () => void;
	showActions?: boolean;
}

export function LeaveRequestCard({
	leave,
	onApprove,
	onReject,
	showActions = false,
}: LeaveRequestCardProps) {
	const status = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
	const doctorName = leave.doctorName ?? `Doctor ${leave.doctorId.slice(0, 8)}`;

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	const dayCount =
		leave.startDate && leave.endDate
			? Math.max(
					1,
					Math.round(
						(new Date(leave.endDate).getTime() -
							new Date(leave.startDate).getTime()) /
							86_400_000,
					) + 1,
				)
			: null;

	return (
		<article className={`${cardBase} flex flex-col p-5`}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-poppins text-sm font-semibold text-smile-primary [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
						{getInitials(doctorName)}
					</span>
					<div className="min-w-0">
						<h2 className="truncate font-poppins text-base font-semibold text-smile-title">
							{doctorName}
						</h2>
						<p className="mt-0.5 text-sm capitalize text-smile-description">
							{leave.leaveType?.replace(/_/g, " ") || "Staff leave"}
						</p>
					</div>
				</div>

				<span
					className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
				>
					<Icon icon={status.icon} width={14} />
					{status.label}
				</span>
			</div>

			<div className="mt-5 grid gap-3 text-sm text-smile-description sm:grid-cols-2">
				<p className="flex items-start gap-2">
					<Icon
						icon="mdi:calendar-start"
						width={17}
						className="mt-0.5 shrink-0 text-smile-primary"
					/>
					<span>
						<span className="block text-xs font-semibold uppercase tracking-wide text-smile-description">
							Start
						</span>
						<span className="font-medium text-smile-title">
							{formatDate(leave.startDate)}
						</span>
					</span>
				</p>
				<p className="flex items-start gap-2">
					<Icon
						icon="mdi:calendar-end"
						width={17}
						className="mt-0.5 shrink-0 text-smile-primary"
					/>
					<span>
						<span className="block text-xs font-semibold uppercase tracking-wide text-smile-description">
							End
						</span>
						<span className="font-medium text-smile-title">
							{formatDate(leave.endDate)}
							{dayCount !== null
								? ` · ${dayCount} day${dayCount === 1 ? "" : "s"}`
								: ""}
						</span>
					</span>
				</p>
			</div>

			<div className="mt-4 rounded-xl border p-3 text-sm leading-6 text-smile-description [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
				<span className="font-semibold text-smile-title">Reason: </span>
				{leave.reason || "No reason provided."}
			</div>

			{showActions && leave.status === "PENDING" && (
				<div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4 [border-color:var(--surface-panel-border)]">
					{onReject && (
						<button
							type="button"
							onClick={onReject}
							className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-600 transition hover:border-red-500/40 dark:text-red-300"
						>
							<Icon icon="mdi:close" width={16} />
							Reject
						</button>
					)}
					{onApprove && (
						<button
							type="button"
							onClick={onApprove}
							className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-smile-primary px-4 text-sm font-semibold text-white transition hover:bg-smile-primary-dark"
						>
							<Icon icon="mdi:check" width={16} />
							Approve
						</button>
					)}
				</div>
			)}
		</article>
	);
}
