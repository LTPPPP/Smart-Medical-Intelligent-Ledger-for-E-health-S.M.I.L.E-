"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAppointment } from "@/features/appointment/hooks/useAppointment";
import { useTranslation } from "@/features/i18n";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { Loading } from "@/shared/components/common/Loading";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/formatCurrency";
import { toast } from "@/shared/lib/toast";

const TEAL = "#38BDF8";
const BLUE = "#92CDFD";
const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";
const rowBase =
	"flex items-center justify-between gap-3 border-b py-2.5 last:border-0 [border-color:var(--surface-panel-border)]";

function PaymentContent() {
	const router = useRouter();
	const params = useParams();
	const appointmentId = params?.id as string;
	const { t } = useTranslation();
	const {
		useAppointmentById,
		createPayment,
		isCreatingPayment,
		usePaymentById,
		confirmMockPayment,
		isConfirmingMockPayment,
	} = useAppointment();
	const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);
	const [paymentId, setPaymentId] = useState<string | null>(null);
	const [qrCode, setQrCode] = useState<string | null>(null);

	const { data: paymentRes, refetch: refetchPayment } =
		usePaymentById(paymentId);
	const paymentStatus = paymentRes?.data?.data?.status?.toLowerCase();
	const isPaid = paymentStatus === "paid";
	const isFailed = paymentStatus === "failed";

	useEffect(() => {
		if (!isPaid) return;
		const timer = setTimeout(() => {
			router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId));
		}, 4000);
		return () => clearTimeout(timer);
	}, [isPaid, appointmentId, router]);

	// Demo-Only — There's No Real Bank To Scan This QR, So The User Explicitly
	// Tells Us They "Paid" Instead Of It Happening On Its Own.
	const handleConfirmMockPayment = async () => {
		if (!paymentId) return;
		try {
			await confirmMockPayment(paymentId);
			await refetchPayment();
		} catch {
			toast.error(
				t("payments.checkout.createFailed", "Failed to create payment"),
			);
		}
	};

	// Flat Response Shape
	const appointment = data?.data as unknown as
		| {
				appointmentId?: string;
				appointment_id?: string;
				appointmentCode?: string;
				appointment_code?: string;
				appointment_date?: string;
				appointment_time?: string;
				paymentStatus?: string;
				payment_status?: string;
				doctor_id?: string;
				clinic?: { clinic_name?: string } | null;
				service?: {
					service_name?: string;
					base_price?: number | string;
				} | null;
		  }
		| undefined;

	const amount = appointment?.service?.base_price
		? Number(appointment.service.base_price)
		: 0;
	const hasPayableAmount = amount > 0;

	const handleGenerateQr = async () => {
		if (!appointment || !hasPayableAmount) {
			toast.error(
				t(
					"payments.checkout.invalidAmount",
					"This appointment does not have a payable service amount yet.",
				),
			);
			return;
		}

		try {
			const result = await createPayment({
				appointmentId: (appointment.appointmentId ??
					appointment.appointment_id) as string,
				amount,
				orderInfo: `Payment for ${code}`,
			});
			const body = result.data.data;
			if (body.qrCode) {
				setQrCode(body.qrCode);
				setPaymentId(body.paymentId);
			} else if (body.paymentUrl) {
				window.location.href = body.paymentUrl;
			} else {
				toast.error(
					t("payments.checkout.createFailed", "Failed to create payment"),
				);
			}
		} catch {
			toast.error(
				t("payments.checkout.createFailed", "Failed to create payment"),
			);
		}
	};

	if (isLoading) {
		return (
			<AppShell>
				<Loading
					fullScreen
					text={t(
						"payments.checkout.loadingDetails",
						"Loading payment details...",
					)}
				/>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell>
				<div className="mx-auto w-full max-w-lg px-6 py-10">
					<ErrorMessage
						message={t(
							"payments.checkout.failedToLoad",
							"Failed to load appointment",
						)}
						onRetry={refetch}
					/>
				</div>
			</AppShell>
		);
	}

	if (!appointment) {
		return (
			<AppShell>
				<div className="mx-auto w-full max-w-lg px-6 py-10">
					<ErrorMessage
						message={t("payments.checkout.notFound", "Appointment not found")}
					/>
				</div>
			</AppShell>
		);
	}

	const existingPaymentStatus =
		appointment.paymentStatus ?? appointment.payment_status;

	if (isPaid) {
		return (
			<AppShell>
				<div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-10 text-center">
					<Icon
						icon="lucide:badge-check"
						className="text-emerald-400"
						width={72}
					/>
					<h2 className="font-poppins text-2xl font-bold text-smile-title">
						{t("payments.checkout.successTitle", "Payment Successful!")}
					</h2>
					<p className="text-sm text-smile-description">
						{t(
							"payments.checkout.successDesc",
							"Your appointment is confirmed. Redirecting...",
						)}
					</p>
				</div>
			</AppShell>
		);
	}

	if (existingPaymentStatus !== "unpaid") {
		return (
			<AppShell>
				<div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-10 text-center">
					<Icon
						icon="mdi:check-circle"
						className="text-emerald-400"
						width={72}
					/>
					<h2 className="font-poppins text-2xl font-bold text-smile-title">
						{t("payments.checkout.alreadyPaidTitle", "Already Paid")}
					</h2>
					<p className="text-sm text-smile-description">
						{t(
							"payments.checkout.alreadyPaidDesc",
							"This appointment has already been paid.",
						)}
					</p>
					<Button
						className="mt-5"
						onClick={() =>
							router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId))
						}
						className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95"
						style={{
							background: BLUE,
							boxShadow: "0 0 15px rgba(146,205,253,0.3)",
						}}
					>
						{t("payments.checkout.viewAppointment", "View Appointment")}
					</button>
				</div>
			</AppShell>
		);
	}

	const appointmentCode =
		appointment.appointmentCode ?? appointment.appointment_code;

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm font-medium text-smile-description transition hover:text-smile-title"
				>
					<Icon icon="mdi:arrow-left" width={18} />
					{t("payments.checkout.back", "Back")}
				</button>

				<div
					className={`${cardBase} grid grid-cols-1 gap-6 p-6 md:grid-cols-2`}
				>
					{/* Left — Summary */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Image
								src="/images/payment/vnpay-logo.svg"
								alt="VNPay"
								width={110}
								height={34}
								className="h-8 w-auto"
							/>
							<div>
								<p className="font-poppins text-lg font-semibold text-smile-title">
									{t("payments.checkout.title", "Payment")}
								</p>
								{appointmentCode && (
									<p className="font-mono text-xs" style={{ color: TEAL }}>
										{appointmentCode}
									</p>
								)}
							</div>
						</div>

						<div className="flex flex-col">
							{(appointment.appointment_date ||
								appointment.appointment_time) && (
								<div className={rowBase}>
									<span className="text-sm text-smile-description">
										{t("appointments.date", "Date")}
									</span>
									<span className="text-sm font-medium text-smile-title">
										{appointment.appointment_date}{" "}
										{appointment.appointment_time?.slice(0, 5)}
									</span>
								</div>
							)}
							<div className={rowBase}>
								<span className="text-sm text-smile-description">
									{t("payments.checkout.service", "Service")}
								</span>
								<span className="text-sm font-medium text-smile-title">
									{appointment.service?.service_name ??
										t("payments.checkout.notYetSpecified", "Not yet specified")}
								</span>
							</div>
							<div className={rowBase}>
								<span className="text-sm text-smile-description">
									{t("payments.checkout.clinic", "Clinic")}
								</span>
								<span className="text-sm font-medium text-smile-title">
									{appointment.clinic?.clinic_name ?? "—"}
								</span>
							</div>
							<div className={`${rowBase} pt-3`}>
								<span className="text-sm font-semibold text-smile-title">
									{t("payments.checkout.totalAmount", "Total Amount")}
								</span>
								<span className="font-poppins text-xl font-bold text-smile-primary">
									{hasPayableAmount ? formatVND(amount) : "—"}
								</span>
							</div>
						</div>

						<div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
							<Icon
								icon="mdi:shield-check"
								className="mt-0.5 flex-shrink-0 text-emerald-400"
								width={18}
							/>
							<p className="text-xs text-smile-description">
								{t(
									"payments.checkout.secureDesc",
									"Your payment is processed securely through VNPay's encrypted gateway. We do not store your card information.",
								)}
							</p>
						</div>
					</div>

					{/* Right — QR / Action */}
					<div className="flex flex-col items-center justify-center gap-3 rounded-xl border p-6 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
						{!qrCode ? (
							<button
								onClick={handleGenerateQr}
								disabled={isCreatingPayment || !hasPayableAmount}
								className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
								style={{
									background: BLUE,
									boxShadow: "0 0 15px rgba(146,205,253,0.3)",
								}}
							>
								{isCreatingPayment && (
									<Icon icon="line-md:loading-twotone-loop" width={16} />
								)}
								{t("payments.checkout.showQr", "Show VNPay QR")}
							</button>
						) : isFailed ? (
							<div className="flex flex-col items-center gap-3 text-center">
								<Icon
									icon="lucide:circle-x"
									width={32}
									className="text-destructive"
								/>
								<p className="text-sm text-destructive">
									{t(
										"payments.checkout.qrFailed",
										"Payment failed. Please try again.",
									)}
								</p>
								<button
									onClick={() => {
										setQrCode(null);
										setPaymentId(null);
									}}
									className="rounded-full border px-5 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-card-bg)] [border-color:var(--surface-panel-border)]"
								>
									{t("payments.checkout.tryAgain", "Try Again")}
								</button>
							</div>
						) : (
							<>
								<Image
									src={qrCode}
									alt="VNPay QR code"
									width={200}
									height={200}
									className="h-[200px] w-[200px] rounded-lg bg-white p-2"
									unoptimized
								/>
								<div className="flex items-center gap-2 text-sm text-smile-description">
									<Icon
										icon="lucide:qr-code"
										width={16}
										className="text-smile-primary"
									/>
									{t(
										"payments.checkout.waitingForScan",
										"Scan with your banking app to pay",
									)}
								</div>
								<button
									onClick={handleConfirmMockPayment}
									disabled={isConfirmingMockPayment}
									className="flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
									style={{
										background: "#10B981",
										boxShadow: "0 0 15px rgba(16,185,129,0.3)",
									}}
								>
									{isConfirmingMockPayment && (
										<Icon icon="line-md:loading-twotone-loop" width={16} />
									)}
									{t(
										"payments.checkout.simulatePaid",
										"I've completed the payment",
									)}
								</button>
								<p className="text-center text-xs text-smile-description">
									{t(
										"payments.checkout.demoAutoConfirmHint",
										"Demo mode — no real bank connected, so click above once you'd have finished paying in the banking app",
									)}
								</p>
							</>
						)}
					</div>
				</div>
			</div>
		</AppShell>
	);
}

export default function PaymentPage() {
	// Skip Permission Check
	return (
		<ProtectedRoute>
			<PaymentContent />
		</ProtectedRoute>
	);
}
