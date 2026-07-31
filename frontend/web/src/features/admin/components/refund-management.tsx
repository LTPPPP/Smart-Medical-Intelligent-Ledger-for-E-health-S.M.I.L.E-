"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";

import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type {
	AdminPayment,
	RefundStatus,
} from "@/features/admin/types/admin.type";
import { formatDateTime } from "@/features/admin/utils/date.utils";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Textarea } from "@/shared/components/ui/textarea";
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
	REQUESTED: "border-warning/30 bg-warning/10 text-foreground",
	UNDER_REVIEW: "border-info/30 bg-info/10 text-info",
	APPROVED:
		"border-smile-primary/30 bg-smile-primary-light/40 text-smile-primary",
	REFUNDING: "border-info/30 bg-info/10 text-info",
	REFUNDED: "border-success/30 bg-success/10 text-success",
	REJECTED: "border-destructive/30 bg-destructive/10 text-destructive",
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

	const closeRejectDialog = () => {
		if (isReviewingRefund) return;
		setRejectTarget(null);
		setRejectReason("");
	};

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
		<div className="flex flex-col gap-6 font-inter">
			<PageHeader
				title="Refund approvals"
				description={`${pendingCount} request${pendingCount === 1 ? "" : "s"} pending review`}
			/>

			<div
				className="flex flex-wrap gap-2 rounded-2xl border p-3 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]"
				aria-label="Refund status filters"
			>
				{STATUS_FILTERS.map((filter) => (
					<Button
						key={filter.value || "all"}
						size="sm"
						variant={statusFilter === filter.value ? "default" : "ghost"}
						aria-pressed={statusFilter === filter.value}
						onClick={() => setStatusFilter(filter.value)}
					>
						{filter.label}
					</Button>
				))}
			</div>

			{actionError && <ErrorMessage message={actionError} />}

			<div className="overflow-hidden rounded-2xl border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)]">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] text-left text-sm">
						<thead className="border-b bg-muted/45 text-xs font-semibold uppercase tracking-wide text-muted-foreground [border-color:var(--surface-panel-border)]">
							<tr>
								<th className="px-4 py-3">Payment ID</th>
								<th className="px-4 py-3">Amount</th>
								<th className="px-4 py-3">Reason</th>
								<th className="px-4 py-3">Requested at</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y [--tw-divide-opacity:1] [border-color:var(--surface-panel-border)]">
							{isLoading && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-smile-description"
									>
										<Icon
											icon="line-md:loading-twotone-loop"
											width={22}
											className="mx-auto mb-2 text-smile-primary"
										/>
										Loading refund requests…
									</td>
								</tr>
							)}
							{isError && (
								<tr>
									<td colSpan={6} className="px-4 py-8">
										<ErrorMessage message="Failed to load refund requests." />
									</td>
								</tr>
							)}
							{!isLoading && !isError && (payments ?? []).length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-smile-description"
									>
										No refund requests match this filter.
									</td>
								</tr>
							)}
							{(payments ?? []).map((payment) => (
								<tr
									key={payment.payment_id}
									className="transition hover:bg-muted/25"
								>
									<td className="px-4 py-3 font-mono text-xs text-smile-description">
										{payment.payment_id.slice(0, 8)}…
									</td>
									<td className="px-4 py-3 font-semibold text-smile-title">
										{formatVND(Number(payment.refund_amount ?? payment.amount))}
									</td>
									<td
										className="max-w-[240px] truncate px-4 py-3 text-smile-description"
										title={payment.refund_reason ?? ""}
									>
										{payment.refund_reason || "—"}
									</td>
									<td className="px-4 py-3 text-smile-description">
										{payment.refund_requested_at
											? formatDateTime(payment.refund_requested_at)
											: "—"}
									</td>
									<td className="px-4 py-3">
										{payment.refund_status && (
											<span
												className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[payment.refund_status]}`}
											>
												{statusLabel[payment.refund_status]}
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										{isReviewable(payment.refund_status) && (
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="success"
													disabled={isReviewingRefund}
													onClick={() => void handleApprove(payment)}
												>
													<Icon icon="lucide:check" /> Approve
												</Button>
												<Button
													size="sm"
													variant="destructive"
													disabled={isReviewingRefund}
													onClick={() => setRejectTarget(payment)}
												>
													<Icon icon="lucide:x" /> Reject
												</Button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<Dialog
				open={rejectTarget !== null}
				onOpenChange={(open) => {
					if (!open) closeRejectDialog();
				}}
			>
				<DialogContent
					showCloseButton={!isReviewingRefund}
					className="max-w-md font-inter"
				>
					<DialogHeader>
						<DialogTitle>Reject refund request</DialogTitle>
						<DialogDescription>
							Enter a clear reason for payment{" "}
							{rejectTarget ? `${rejectTarget.payment_id.slice(0, 8)}…` : ""}.
							The patient will see this decision.
						</DialogDescription>
					</DialogHeader>
					<label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
						Rejection reason
						<Textarea
							value={rejectReason}
							onChange={(event) => setRejectReason(event.target.value)}
							rows={4}
							placeholder="Explain why this refund cannot be approved…"
							disabled={isReviewingRefund}
						/>
					</label>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={isReviewingRefund}
							onClick={closeRejectDialog}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={!rejectReason.trim() || isReviewingRefund}
							onClick={() => void handleReject()}
						>
							{isReviewingRefund && (
								<Icon icon="line-md:loading-twotone-loop" />
							)}
							Confirm rejection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
