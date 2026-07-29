"use client";

import { Icon } from "@iconify/react";

import type { DoctorLeave, LeaveStatus } from "../types/schedule.type";

const STATUS_CONFIG: Record<
	LeaveStatus,
	{ label: string; chipClass: string; icon: string }
> = {
	PENDING: {
		label: "Pending",
		chipClass: "bg-amber-100 text-amber-700",
		icon: "mdi:clock-outline",
	},
	APPROVED: {
		label: "Approved",
		chipClass: "bg-emerald-100 text-emerald-700",
		icon: "mdi:check-circle",
	},
	REJECTED: {
		label: "Rejected",
		chipClass: "bg-red-100 text-red-700",
		icon: "mdi:close-circle",
	},
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join("");
}

interface LeaveRequestCardProps {
	leave: DoctorLeave;
	onClick?: () => void;
	onApprove?: () => void;
	onReject?: () => void;
	showActions?: boolean;
}

export function LeaveRequestCard({
	leave,
	onClick,
	onApprove,
	onReject,
	showActions = false,
}: LeaveRequestCardProps) {
	const status = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString("en-US", {
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

	const doctorName = leave.doctorName ?? `Doctor ${leave.doctorId.slice(0, 8)}`;
	const initials = getInitials(doctorName);

	return (
		<div
			className="bg-white rounded-2xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
			onClick={onClick}
		>
			{/* Header row */}
			<div className="flex items-center justify-between gap-3 mb-3">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md flex-none">
						{initials}
					</div>
					<div className="min-w-0">
						<p className="font-bold text-slate-900 text-sm truncate">
							{doctorName}
						</p>
						{leave.leaveType && (
							<p className="text-xs text-slate-400 capitalize">
								{leave.leaveType.replace(/_/g, " ")}
							</p>
						)}
					</div>
				</div>
				<span
					className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold flex-none ${status.chipClass}`}
				>
					<Icon icon={status.icon} width={12} />
					{status.label}
				</span>
			</div>

			{/* Date range */}
			<div className="space-y-1.5">
				<p className="text-xs text-slate-500 flex items-center gap-1.5">
					<Icon
						icon="mdi:calendar-range"
						width={14}
						className="text-slate-400 flex-none"
					/>
					{formatDate(leave.startDate)} → {formatDate(leave.endDate)}
					{dayCount !== null && (
						<span className="text-slate-400">({dayCount}d)</span>
					)}
				</p>
				{leave.reason && (
					<p className="text-xs text-slate-400 flex items-start gap-1.5">
						<Icon icon="mdi:text" width={14} className="flex-none mt-0.5" />
						<span className="line-clamp-2">{leave.reason}</span>
					</p>
				)}
			</div>

			{/* Actions */}
			{showActions && leave.status === "PENDING" && (
				<div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
					{onApprove && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onApprove();
							}}
							className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[2.25rem] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_4px_10px_-4px_rgba(14,140,128,0.55)] hover:brightness-105 transition-all text-xs"
						>
							<Icon icon="mdi:check" width={14} />
							Approve
						</button>
					)}
					{onReject && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onReject();
							}}
							className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[2.25rem] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-xs"
						>
							Deny
						</button>
					)}
				</div>
			)}
		</div>
	);
}
