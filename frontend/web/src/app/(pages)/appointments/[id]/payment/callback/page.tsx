"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Icon } from "@iconify/react";

import { RefundRequestDialog } from "@/features/appointment/components/RefundRequestDialog";
import { useAppointment } from "@/features/appointment/hooks/useAppointment";
import type {
	Payment,
	RefundPaymentRequest,
} from "@/features/appointment/types/appointment.type";
import { useTranslation } from "@/features/i18n";
import { unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Button } from "@/shared/components/ui/button";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/formatCurrency";

type CallbackStatus = "processing" | "success" | "failed";

const cardClass =
	"rounded-2xl border p-5 [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)] sm:p-6";

const paymentStatusClass: Record<string, string> = {
	paid: "border-success/30 bg-success/10 text-success",
	refunded: "border-warning/30 bg-warning/10 text-foreground",
	failed: "border-destructive/30 bg-destructive/10 text-destructive",
	pending: "border-info/30 bg-info/10 text-info",
};
const OPEN_REFUND_STATUSES = new Set([
	"REQUESTED",
	"UNDER_REVIEW",
	"APPROVED",
	"REFUNDING",
]);

export default function PaymentCallbackPage() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const { t } = useTranslation();
	const routeAppointmentId = (params?.id as string) || "";
	const responseCode = searchParams.get("vnp_ResponseCode");
	const txnRef = searchParams.get("vnp_TxnRef");
	const callbackQuery = searchParams.toString();
	const callbackAppointmentId =
		searchParams.get("appointmentId") || routeAppointmentId;

	const [status, setStatus] = useState<CallbackStatus>("processing");
	const [message, setMessage] = useState(
		t("payments.callback.processingMessage", "Processing payment..."),
	);
	const [verificationError, setVerificationError] = useState<unknown>();
	const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
	const { usePaymentsByAppointment, refundPayment, isRefunding } =
		useAppointment();
	const { data: paymentsData, refetch: refetchPayments } =
		usePaymentsByAppointment(routeAppointmentId || null);
	const payments = paymentsData?.data?.data ?? [];

	useEffect(() => {
		let active = true;
		let redirectTimer: ReturnType<typeof setTimeout> | undefined;

		const verifyPayment = async () => {
			if (!responseCode || !txnRef) {
				if (!active) return;
				setStatus("failed");
				setMessage(
					t(
						"payments.callback.invalidResponse",
						"The VNPay response is incomplete. Please return to your appointment and try again.",
					),
				);
				return;
			}

			try {
				setVerificationError(undefined);
				const verificationResponse = await apiClient.get(
					API_ENDPOINTS.PAYMENT.VNPAY_RETURN,
					{
						params: Object.fromEntries(
							new URLSearchParams(callbackQuery).entries(),
						),
					},
				);
				const verifiedPayment = unwrapOne<Payment>(verificationResponse);
				if (!verifiedPayment) {
					throw new Error("VNPay verification returned no payment record");
				}

				const verifiedSuccessful =
					verifiedPayment.status.toLowerCase() === "paid";
				if (!active) return;
				setStatus(verifiedSuccessful ? "success" : "failed");
				setMessage(
					verifiedSuccessful
						? t(
								"payments.callback.successMessage",
								"Payment successful! Your appointment is confirmed.",
							)
						: t(
								"payments.callback.failedMessage",
								"Payment failed. Please try again.",
							),
				);
				setVerificationError(undefined);

				if (verifiedSuccessful) {
					redirectTimer = setTimeout(() => {
						router.push(
							callbackAppointmentId
								? ROUTES.APPOINTMENT_DETAIL(callbackAppointmentId)
								: ROUTES.APPOINTMENTS,
						);
					}, 6000);
				}
			} catch (error) {
				if (active) {
					setVerificationError(error);
					setStatus("failed");
					setMessage(
						t(
							"payments.callback.verificationFailed",
							"The gateway response could not be verified. Please return to your appointment and try again.",
						),
					);
				}
			} finally {
				if (active) void refetchPayments();
			}
		};

		void verifyPayment();
		return () => {
			active = false;
			if (redirectTimer) clearTimeout(redirectTimer);
		};
	}, [
		callbackAppointmentId,
		callbackQuery,
		refetchPayments,
		responseCode,
		router,
		t,
		txnRef,
	]);

	const handleRefundSubmit = async (request: RefundPaymentRequest) => {
		if (!refundTarget) return;
		await refundPayment({
			paymentId: refundTarget.payment_id,
			request,
		});
		await refetchPayments();
	};

	const statusView = {
		processing: {
			icon: "line-md:loading-twotone-loop",
			iconClass: "bg-info/10 text-info",
			title: t("payments.callback.processingTitle", "Processing Payment"),
			description: t(
				"payments.callback.processingDesc",
				"Please wait while we verify your payment...",
			),
		},
		success: {
			icon: "lucide:badge-check",
			iconClass: "bg-success/10 text-success",
			title: t("payments.callback.successTitle", "Payment Successful!"),
			description: message,
		},
		failed: {
			icon: "lucide:circle-x",
			iconClass: "bg-destructive/10 text-destructive",
			title: t("payments.callback.failedTitle", "Payment Failed"),
			description: message,
		},
	}[status];

	return (
		<AppShell>
			<main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-4 py-6 font-inter sm:px-6 sm:py-8">
				<PageHeader
					title={t("payments.callback.pageTitle", "Payment result")}
					description={t(
						"payments.callback.pageDescription",
						"VNPay transaction status and payment history for this appointment.",
					)}
				/>

				<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
					<section className={`${cardClass} text-center`} aria-live="polite">
						<Image
							src="/images/payment/vnpay-logo.svg"
							alt="VNPay payment gateway"
							width={138}
							height={42}
							className="mx-auto mb-6 h-10 w-auto"
						/>
						<span
							className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl ${statusView.iconClass}`}
						>
							<Icon icon={statusView.icon} width={32} />
						</span>
						<h1 className="font-poppins text-2xl font-semibold text-smile-title">
							{statusView.title}
						</h1>
						<p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-smile-description">
							{statusView.description}
						</p>

						{status === "success" && (
							<p className="mt-5 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-foreground">
								{t(
									"payments.callback.redirecting",
									"Redirecting to your appointment...",
								)}
							</p>
						)}

						{verificationError !== undefined && (
							<ErrorMessage
								className="mt-5 text-left"
								message={t(
									"payments.callback.verificationFailed",
									"The gateway response could not be verified. Please return to your appointment and try again.",
								)}
								error={verificationError}
								operation="Verify VNPay callback"
							/>
						)}

						{status === "failed" && (
							<div className="mt-6 grid gap-2 sm:grid-cols-2">
								<Button
									variant="outline"
									onClick={() => router.push(ROUTES.APPOINTMENTS)}
								>
									{t("payments.callback.myAppointments", "My Appointments")}
								</Button>
								<Button onClick={() => router.back()}>
									{t("payments.callback.tryAgain", "Try Again")}
								</Button>
							</div>
						)}
					</section>

					<section
						className={cardClass}
						aria-labelledby="payment-history-title"
					>
						<div className="flex items-center gap-3">
							<span className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info">
								<Icon icon="lucide:history" width={19} />
							</span>
							<div>
								<h2
									id="payment-history-title"
									className="font-poppins text-lg font-semibold text-smile-title"
								>
									{t("payments.callback.paymentHistory", "Payment History")}
								</h2>
								<p className="text-xs text-smile-description">
									{t(
										"payments.callback.historyDescription",
										"Transactions recorded for this appointment.",
									)}
								</p>
							</div>
						</div>

						{payments.length === 0 ? (
							<div className="mt-5 rounded-xl border border-dashed p-5 text-center text-sm text-smile-description [border-color:var(--surface-panel-border)]">
								{t(
									"payments.callback.noHistory",
									"No payment record is available yet.",
								)}
							</div>
						) : (
							<div className="mt-5 space-y-3">
								{payments.map((payment) => {
									const normalizedStatus = payment.status.toLowerCase();
									const normalizedRefundStatus =
										payment.refund_status?.toUpperCase() ?? "";
									const refundOpen = OPEN_REFUND_STATUSES.has(
										normalizedRefundStatus,
									);
									const canRefund = normalizedStatus === "paid" && !refundOpen;
									return (
										<article
											key={payment.payment_id}
											className="rounded-xl border p-4 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<span className="font-mono text-xs text-smile-description">
													{payment.payment_id.slice(0, 12)}…
												</span>
												<div className="flex flex-wrap justify-end gap-2">
													<span
														className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatusClass[normalizedStatus] ?? "border-border bg-muted text-muted-foreground"}`}
													>
														{payment.status}
													</span>
													{normalizedRefundStatus && (
														<span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-foreground">
															{t("payments.callback.refundStatus", "Refund")}:{" "}
															{normalizedRefundStatus.replace(/_/g, " ")}
														</span>
													)}
												</div>
											</div>
											<div className="mt-3 flex items-end justify-between gap-3">
												<div>
													<p className="text-xs text-smile-description">
														{t("payments.callback.amount", "Amount")}
													</p>
													<p className="font-poppins text-lg font-semibold text-smile-title">
														{formatVND(Number(payment.amount))}
													</p>
												</div>
												{refundOpen ? (
													<Button variant="outline" disabled>
														{t(
															"payments.callback.refundPending",
															"Refund request pending",
														)}
													</Button>
												) : canRefund ? (
											<Button
												variant="warning"
												disabled={isRefunding}
												onClick={() => setRefundTarget(payment)}
											>
														{isRefunding && (
															<Icon icon="line-md:loading-twotone-loop" />
														)}
														{t("payments.callback.refund", "Request refund")}
													</Button>
												) : null}
											</div>
										</article>
									);
								})}
							</div>
						)}
					</section>
				</div>
			</main>
			<RefundRequestDialog
				open={Boolean(refundTarget)}
				payment={refundTarget}
				onOpenChange={(open) => {
					if (!open) setRefundTarget(null);
				}}
				onSubmit={handleRefundSubmit}
				isSubmitting={isRefunding}
			/>
		</AppShell>
	);
}
