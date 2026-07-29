"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";

import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type {
	AdminPayment,
	RefundStatus,
} from "@/features/admin/types/admin.type";
import { formatDateTime } from "@/features/admin/utils/date.utils";
import { formatVND } from "@/shared/lib/formatCurrency";

const STATUS_FILTERS: { label: string; value: RefundStatus | "" }[] = [
	{ label: "All", value: "" },
	{ label: "Pending", value: "REQUESTED" },
	{ label: "Under Review", value: "UNDER_REVIEW" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Refunding", value: "REFUNDING" },
	{ label: "Refunded", value: "REFUNDED" },
	{ label: "Rejected", value: "REJECTED" },
];

const statusClass: Record<RefundStatus, string> = {
	REQUESTED: "bg-amber-100 text-amber-700",
	UNDER_REVIEW: "bg-blue-100 text-blue-700",
	APPROVED: "bg-indigo-100 text-indigo-700",
	REFUNDING: "bg-violet-100 text-violet-700",
	REFUNDED: "bg-emerald-100 text-emerald-700",
	REJECTED: "bg-red-100 text-red-700",
};

const statusLabel: Record<RefundStatus, string> = {
	REQUESTED: "Pending",
	UNDER_REVIEW: "Under Review",
	APPROVED: "Approved",
	REFUNDING: "Refunding",
	REFUNDED: "Refunded",
	REJECTED: "Rejected",
};

const isReviewable = (status: RefundStatus | null) =>
	status === "REQUESTED" || status === "UNDER_REVIEW";

export function RefundManagement() {
	const { useRefundQueue, approveRefund, rejectRefund, isReviewingRefund } =
		useAdmin();
	const [statusFilter, setStatusFilter] = useState<RefundStatus | "">("");
	const [rejectTarget, setRejectTarget] = useState<AdminPayment | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [actionError, setActionError] = useState<string>();

	const params = useMemo(
		() => (statusFilter ? { status: statusFilter } : undefined),
		[statusFilter],
	);
	const { data: payments, isLoading, isError } = useRefundQueue(params);

	const pendingCount = useMemo(
		() => (payments ?? []).filter((p) => isReviewable(p.refund_status)).length,
		[payments],
	);

	const handleApprove = async (payment: AdminPayment) => {
		setActionError(undefined);
		try {
			await approveRefund({ id: payment.payment_id });
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Approval failed",
			);
		}
	};

	const handleReject = async () => {
		if (!rejectTarget || !rejectReason.trim()) return;
		setActionError(undefined);
		try {
			await rejectRefund({
				id: rejectTarget.payment_id,
				request: { reason: rejectReason.trim() },
			});
			setRejectTarget(null);
			setRejectReason("");
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Rejection failed",
			);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-inter text-xl font-bold text-smile-title">
						Refund Approvals
					</h1>
					<p className="font-inter text-sm text-smile-description">
						{pendingCount} request{pendingCount === 1 ? "" : "s"} pending review
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{STATUS_FILTERS.map((filter) => (
						<button
							key={filter.value || "all"}
							onClick={() => setStatusFilter(filter.value)}
							className={`rounded-full px-3 py-1.5 font-inter text-xs font-semibold transition ${
								statusFilter === filter.value
									? "bg-smile-title text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							{filter.label}
						</button>
					))}
				</div>
			</div>

			{actionError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-inter text-sm text-red-700">
					{actionError}
				</div>
			)}

			<div className="overflow-hidden rounded-xl border border-slate-200">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] text-left font-inter text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
							<tr>
								<th className="px-4 py-3">Payment ID</th>
								<th className="px-4 py-3">Amount</th>
								<th className="px-4 py-3">Reason</th>
								<th className="px-4 py-3">Requested At</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-center text-slate-400"
									>
										Loading...
									</td>
								</tr>
							)}
							{isError && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-center text-red-500"
									>
										Failed to load refund requests.
									</td>
								</tr>
							)}
							{!isLoading && !isError && (payments ?? []).length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-center text-slate-400"
									>
										No refund requests.
									</td>
								</tr>
							)}
							{(payments ?? []).map((payment) => (
								<tr key={payment.payment_id} className="hover:bg-slate-50">
									<td className="px-4 py-3 font-mono text-xs text-slate-600">
										{payment.payment_id.slice(0, 8)}…
									</td>
									<td className="px-4 py-3 font-semibold text-slate-800">
										{formatVND(Number(payment.refund_amount ?? payment.amount))}
									</td>
									<td
										className="max-w-[220px] truncate px-4 py-3 text-slate-600"
										title={payment.refund_reason ?? ""}
									>
										{payment.refund_reason || "—"}
									</td>
									<td className="px-4 py-3 text-slate-500">
										{payment.refund_requested_at
											? formatDateTime(payment.refund_requested_at)
											: "—"}
									</td>
									<td className="px-4 py-3">
										{payment.refund_status && (
											<span
												className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[payment.refund_status]}`}
											>
												{statusLabel[payment.refund_status]}
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											{isReviewable(payment.refund_status) && (
												<>
													<button
														onClick={() => handleApprove(payment)}
														disabled={isReviewingRefund}
														className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
													>
														<Icon icon="lucide:check" width={12} />
														Approve
													</button>
													<button
														onClick={() => setRejectTarget(payment)}
														disabled={isReviewingRefund}
														className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
													>
														<Icon icon="lucide:x" width={12} />
														Reject
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{rejectTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h2 className="font-inter text-lg font-bold text-slate-800">
							Reject Refund Request
						</h2>
						<p className="mt-1 font-inter text-sm text-slate-500">
							Please enter a rejection reason for payment{" "}
							{rejectTarget.payment_id.slice(0, 8)}…
						</p>
						<textarea
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
							className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-inter text-sm focus:border-slate-400 focus:outline-none"
							placeholder="Rejection reason..."
						/>
						<div className="mt-4 flex justify-end gap-2">
							<button
								onClick={() => {
									setRejectTarget(null);
									setRejectReason("");
								}}
								className="rounded-lg px-4 py-2 font-inter text-sm font-semibold text-slate-600 hover:bg-slate-100"
							>
								Cancel
							</button>
							<button
								onClick={handleReject}
								disabled={!rejectReason.trim() || isReviewingRefund}
								className="rounded-lg bg-red-600 px-4 py-2 font-inter text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
							>
								Confirm Rejection
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
