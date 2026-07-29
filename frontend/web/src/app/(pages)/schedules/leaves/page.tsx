"use client";

import { useState } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
	cardBase,
	EmptyBlock,
	ErrorBlock,
	LoadingBlock,
	PageHeader,
} from "@/features/reports/components/ReportPrimitives";
import { LeaveRequestCard } from "@/features/schedule/components/LeaveRequestCard";
import { useSchedule } from "@/features/schedule/hooks/useSchedule";
import type { LeaveStatus } from "@/features/schedule/types/schedule.type";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const STATUS_TABS: { value: LeaveStatus | "ALL"; label: string }[] = [
	{ value: "ALL", label: "All" },
	{ value: "PENDING", label: "Pending" },
	{ value: "APPROVED", label: "Approved" },
	{ value: "REJECTED", label: "Rejected" },
];

export default function DoctorLeavesPage() {
	const { useDoctorLeaves, approveLeave, rejectLeave, isRejectingLeave } =
		useSchedule();
	const { user } = useAuthStore();

	const [filterStatus, setFilterStatus] = useState<LeaveStatus | "ALL">("ALL");
	const [page, setPage] = useState(0);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");

	const { data, isLoading, error, refetch } = useDoctorLeaves({
		status: filterStatus === "ALL" ? undefined : filterStatus,
		page,
		size: 12,
	});

	const leaves = data?.data?.content ?? [];
	const totalPages = data?.data?.totalPages ?? 0;

	const closeRejectDialog = () => {
		setShowRejectDialog(false);
		setSelectedLeaveId(null);
		setRejectionReason("");
	};

	const handleApproveLeave = async (leaveId: string) => {
		if (!user?.userId) {
			toast.error("Your account could not be identified.");
			return;
		}
		if (!window.confirm("Approve this leave request?")) return;

		try {
			await approveLeave({ leaveId, request: { approvedBy: user.userId } });
			toast.success("Leave request approved");
			await refetch();
		} catch (requestError) {
			toast.apiError(requestError, "Failed to approve leave request");
		}
	};

	const handleRejectLeave = async () => {
		if (!selectedLeaveId || !rejectionReason.trim()) return;

		try {
			await rejectLeave({
				leaveId: selectedLeaveId,
				request: { rejectionReason: rejectionReason.trim() },
			});
			closeRejectDialog();
			toast.success("Leave request rejected");
			await refetch();
		} catch (requestError) {
			toast.apiError(requestError, "Failed to reject leave request");
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<PageHeader
					eyebrow="Schedule Management"
					title="Leave Management"
					subtitle="Request, review, and manage staff leave."
					icon="mdi:calendar-remove"
					right={
						<>
							<button
								type="button"
								onClick={() => refetch()}
								className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
							>
								<Icon icon="mdi:refresh" width={18} />
								Refresh
							</button>
							<Link
								href={ROUTES.DOCTOR_LEAVE_NEW}
								className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-smile-primary px-5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark"
							>
								<Icon icon="mdi:plus" width={18} />
								Request Leave
							</Link>
						</>
					}
				/>

				<div
					className={`${cardBase} flex w-fit max-w-full flex-wrap items-center gap-1 p-1.5`}
					role="tablist"
					aria-label="Leave status"
				>
					{STATUS_TABS.map((tab) => (
						<button
							type="button"
							role="tab"
							aria-selected={filterStatus === tab.value}
							key={tab.value}
							onClick={() => {
								setFilterStatus(tab.value);
								setPage(0);
							}}
							className={
								filterStatus === tab.value
									? "min-h-10 rounded-xl bg-smile-primary px-4 text-sm font-semibold text-white transition"
									: "min-h-10 rounded-xl px-4 text-sm font-semibold text-smile-description transition hover:bg-smile-primary-light hover:text-smile-primary-dark"
							}
						>
							{tab.label}
						</button>
					))}
				</div>

				{isLoading ? (
					<div className={cardBase}>
						<LoadingBlock label="Loading leave requests…" />
					</div>
				) : error ? (
					<ErrorBlock
						label="Failed to load leave requests."
						onRetry={() => refetch()}
					/>
				) : leaves.length === 0 ? (
					<div className={cardBase}>
						<EmptyBlock label="No leave requests match this status." />
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						{leaves.map((leave) => (
							<LeaveRequestCard
								key={leave.doctorLeaveId}
								leave={leave}
								onApprove={() => handleApproveLeave(leave.doctorLeaveId)}
								onReject={() => {
									setSelectedLeaveId(leave.doctorLeaveId);
									setShowRejectDialog(true);
								}}
								showActions={leave.status === "PENDING"}
							/>
						))}
					</div>
				)}

				{!isLoading && !error && totalPages > 1 && (
					<nav
						aria-label="Leave request pages"
						className="flex items-center justify-center gap-3"
					>
						<button
							type="button"
							onClick={() => setPage((current) => Math.max(0, current - 1))}
							disabled={page === 0}
							className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						>
							<Icon icon="mdi:chevron-left" width={18} />
							Previous
						</button>
						<span className="text-sm text-smile-description">
							Page {page + 1} of {totalPages}
						</span>
						<button
							type="button"
							onClick={() =>
								setPage((current) => Math.min(totalPages - 1, current + 1))
							}
							disabled={page >= totalPages - 1}
							className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						>
							Next
							<Icon icon="mdi:chevron-right" width={18} />
						</button>
					</nav>
				)}
			</div>

			{showRejectDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="reject-leave-title"
						className={`${cardBase} w-full max-w-md p-6`}
					>
						<div className="flex items-start gap-3">
							<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300">
								<Icon icon="mdi:close-circle-outline" width={23} />
							</span>
							<div>
								<h2
									id="reject-leave-title"
									className="font-poppins text-lg font-semibold text-smile-title"
								>
									Reject leave request
								</h2>
								<p className="mt-1 text-sm text-smile-description">
									Provide a clear reason for the staff member.
								</p>
							</div>
						</div>

						<label
							htmlFor="leave-rejection-reason"
							className="mb-1.5 mt-5 block text-sm font-semibold text-smile-title"
						>
							Rejection reason
						</label>
						<textarea
							id="leave-rejection-reason"
							autoFocus
							className="min-h-28 w-full resize-y rounded-xl border px-3.5 py-3 text-sm text-smile-title outline-none transition focus:border-red-400 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
							placeholder="Explain why this request cannot be approved."
							value={rejectionReason}
							onChange={(event) => setRejectionReason(event.target.value)}
						/>

						<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={closeRejectDialog}
								disabled={isRejectingLeave}
								className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-50 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleRejectLeave}
								disabled={!rejectionReason.trim() || isRejectingLeave}
								className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isRejectingLeave && (
									<Icon icon="line-md:loading-twotone-loop" width={17} />
								)}
								Confirm rejection
							</button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}
