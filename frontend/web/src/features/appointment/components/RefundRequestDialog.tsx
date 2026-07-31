"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";
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
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatVND } from "@/shared/lib/formatCurrency";

interface RefundDialogPayment {
	payment_id: string;
	amount: number;
}

interface RefundRequest {
	amount: number;
	reason: string;
}

interface RefundRequestDialogProps {
	open: boolean;
	payment: RefundDialogPayment | null;
	onOpenChange: (open: boolean) => void;
	onSubmit: (request: RefundRequest) => Promise<void>;
	isSubmitting?: boolean;
}

export function RefundRequestDialog({
	open,
	payment,
	onOpenChange,
	onSubmit,
	isSubmitting = false,
}: RefundRequestDialogProps) {
	const { t } = useTranslation();
	const [amountInput, setAmountInput] = useState("");
	const [reason, setReason] = useState("");
	const [validationError, setValidationError] = useState("");
	const [submissionError, setSubmissionError] = useState<unknown>();
	const [isSubmittingLocally, setIsSubmittingLocally] = useState(false);
	const pending = isSubmitting || isSubmittingLocally;
	const capturedAmount = Number(payment?.amount ?? 0);

	useEffect(() => {
		if (!open) return;
		setAmountInput(String(capturedAmount));
		setReason("");
		setValidationError("");
		setSubmissionError(undefined);
		setIsSubmittingLocally(false);
	}, [capturedAmount, open, payment?.payment_id]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending || !payment) return;

		const amount = Number(amountInput);
		if (!Number.isFinite(amount) || amount <= 0) {
			setValidationError(
				t(
					"payments.refund.amountInvalid",
					"Enter a refund amount greater than zero.",
				),
			);
			return;
		}
		if (amount > capturedAmount) {
			setValidationError(
				t(
					"payments.refund.amountExceeds",
					"The refund amount cannot exceed the amount paid.",
				),
			);
			return;
		}
		if (!reason.trim()) {
			setValidationError(
				t(
					"payments.refund.reasonRequired",
					"Enter a reason for this refund.",
				),
			);
			return;
		}

		setValidationError("");
		setSubmissionError(undefined);
		setIsSubmittingLocally(true);
		try {
			await onSubmit({ amount, reason: reason.trim() });
			onOpenChange(false);
		} catch (error) {
			setSubmissionError(error);
		} finally {
			setIsSubmittingLocally(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!pending) onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				showCloseButton={!pending}
				className="max-w-lg overflow-hidden p-5 font-inter sm:max-w-lg"
				aria-busy={pending}
			>
				<DialogHeader className="pr-8">
					<div className="flex items-start gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
							<Icon icon="lucide:rotate-ccw" width={18} aria-hidden="true" />
						</span>
						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogTitle className="text-base text-foreground">
								{t("payments.refund.title", "Refund Request")}
							</DialogTitle>
							<DialogDescription className="leading-5">
								{t(
									"payments.refund.description",
									"Review the amount and explain why this payment should be refunded.",
								)}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid gap-3 rounded-xl border border-info/20 bg-info/5 p-4 sm:grid-cols-2">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{t("payments.refund.transactionLabel", "Transaction")}
							</p>
							<p className="mt-1 break-all font-mono text-sm font-medium text-foreground">
								{payment?.payment_id ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{t("payments.refund.paidAmount", "Paid amount")}
							</p>
							<p className="mt-1 font-poppins text-lg font-semibold text-foreground">
								{formatVND(capturedAmount)}
							</p>
						</div>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="refund-amount"
							className="text-sm font-medium text-foreground"
						>
							{t("payments.refund.refundAmount", "Refund amount (VND)")}
						</label>
						<Input
							id="refund-amount"
							type="number"
							min={1}
							max={capturedAmount}
							step={1}
							value={amountInput}
							onChange={(event) => setAmountInput(event.target.value)}
							disabled={pending}
							aria-invalid={Boolean(validationError)}
						/>
						<p className="text-xs text-muted-foreground">
							{t(
								"payments.refund.amountHelp",
								"You can request a full or partial refund up to the paid amount.",
							)}
						</p>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="refund-reason"
							className="text-sm font-medium text-foreground"
						>
							{t("payments.refund.reasonLabel", "Reason for refund")}
						</label>
						<Textarea
							id="refund-reason"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							placeholder={t(
								"payments.refund.reasonPlaceholder",
								"Describe why you are requesting a refund...",
							)}
							maxLength={500}
							disabled={pending}
							aria-invalid={Boolean(validationError)}
							className="min-h-24 resize-y"
						/>
					</div>

					{validationError && (
						<p
							role="alert"
							className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{validationError}
						</p>
					)}
					{submissionError !== undefined && (
						<ErrorMessage
							message={t(
								"payments.refund.submissionFailed",
								"Could not submit the refund request.",
							)}
							error={submissionError}
							operation="Submit refund request"
						/>
					)}

					<p className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
						{t(
							"payments.refund.reviewNote",
							"Submitting creates a request for admin review; it does not refund the payment immediately.",
						)}
					</p>

					<DialogFooter className="mt-1">
						<Button
							type="button"
							variant="outline"
							disabled={pending}
							onClick={() => onOpenChange(false)}
						>
							{t("payments.refund.cancel", "Cancel")}
						</Button>
						<Button type="submit" variant="warning" disabled={pending || !payment}>
							{pending && (
								<Icon
									icon="line-md:loading-twotone-loop"
									aria-hidden="true"
								/>
							)}
							{pending
								? t("payments.refund.submitting", "Submitting…")
								: t("payments.refund.submitRefund", "Submit request")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
