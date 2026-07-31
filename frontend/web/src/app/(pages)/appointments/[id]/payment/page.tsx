"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAppointment } from "@/features/appointment/hooks/useAppointment";
import { useTranslation } from "@/features/i18n";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Loading } from "@/shared/components/common/Loading";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Button } from "@/shared/components/ui/button";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/formatCurrency";
import { toast } from "@/shared/lib/toast";

interface PaymentAppointment {
	appointmentId?: string;
	appointment_id?: string;
	appointmentCode?: string;
	appointment_code?: string;
	paymentStatus?: string;
	payment_status?: string;
	doctor_id?: string;
	clinic?: { clinic_name?: string } | null;
	service?: {
		service_name?: string;
		base_price?: number | string;
	} | null;
}

const cardClass =
	"rounded-2xl border p-5 [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)] sm:p-6";

function PageFrame({ children }: { children: React.ReactNode }) {
	return (
		<AppShell>
			<main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-4 py-6 font-inter sm:px-6 sm:py-8">
				{children}
			</main>
		</AppShell>
	);
}

function PaymentContent() {
	const router = useRouter();
	const params = useParams();
	const appointmentId = params?.id as string;
	const { t } = useTranslation();
	const { useAppointmentById, createPayment, isCreatingPayment } =
		useAppointment();
	const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);

	const appointment = data?.data as PaymentAppointment | undefined;
	const amount = Number(appointment?.service?.base_price ?? 0);
	const hasPayableAmount = Number.isFinite(amount) && amount > 0;
	const code =
		appointment?.appointmentCode ?? appointment?.appointment_code ?? "—";

	const handlePayment = async () => {
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
			const paymentUrl = result.data.data.paymentUrl;
			if (paymentUrl) window.location.href = paymentUrl;
		} catch (paymentError) {
			toast.apiError(
				paymentError,
				t("payments.checkout.createFailed", "Failed to create payment"),
			);
		}
	};

	if (isLoading) {
		return (
			<PageFrame>
				<Loading
					text={t(
						"payments.checkout.loadingDetails",
						"Loading payment details...",
					)}
				/>
			</PageFrame>
		);
	}

	if (error) {
		return (
			<PageFrame>
				<ErrorMessage
					message={t(
						"payments.checkout.failedToLoad",
						"Failed to load appointment",
					)}
					error={error}
					operation="Load payment appointment"
					onRetry={refetch}
				/>
			</PageFrame>
		);
	}

	if (!appointment) {
		return (
			<PageFrame>
				<ErrorMessage
					message={t("payments.checkout.notFound", "Appointment not found")}
				/>
			</PageFrame>
		);
	}

	const paymentStatus = appointment.paymentStatus ?? appointment.payment_status;
	if (paymentStatus !== "unpaid") {
		return (
			<PageFrame>
				<div className={`${cardClass} mx-auto max-w-xl text-center`}>
					<span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success">
						<Icon icon="lucide:badge-check" width={32} />
					</span>
					<h1 className="font-poppins text-2xl font-semibold text-smile-title">
						{t("payments.checkout.alreadyPaidTitle", "Already Paid")}
					</h1>
					<p className="mt-2 text-sm text-smile-description">
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
					>
						{t("payments.checkout.viewAppointment", "View Appointment")}
					</Button>
				</div>
			</PageFrame>
		);
	}

	const summaryRows = [
		{
			label: t("payments.checkout.appointmentCode", "Appointment Code"),
			value: code,
			mono: true,
		},
		{
			label: t("payments.checkout.service", "Service"),
			value:
				appointment.service?.service_name ??
				t("payments.checkout.notYetSpecified", "Not yet specified"),
		},
		{
			label: t("payments.checkout.doctor", "Doctor"),
			value: appointment.doctor_id
				? `${t("appointments.detail.doctorPrefix", "Doctor")} ${appointment.doctor_id.slice(0, 8)}`
				: t("payments.checkout.notYetAssigned", "Not yet assigned"),
		},
		{
			label: t("payments.checkout.clinic", "Clinic"),
			value: appointment.clinic?.clinic_name ?? "—",
		},
	];

	return (
		<PageFrame>
			<div className="flex items-start justify-between gap-4">
				<PageHeader
					title={t("payments.checkout.title", "Payment")}
					description={t(
						"payments.checkout.subtitle",
						"Verify your appointment and continue through the secure VNPay gateway.",
					)}
				/>
				<Button variant="outline" onClick={() => router.back()}>
					<Icon icon="lucide:arrow-left" />
					{t("payments.checkout.back", "Back")}
				</Button>
			</div>

			<div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
				<section className={cardClass} aria-labelledby="payment-summary-title">
					<div className="mb-5 flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info">
							<Icon icon="lucide:receipt-text" width={19} />
						</span>
						<div>
							<h2
								id="payment-summary-title"
								className="font-poppins text-lg font-semibold text-smile-title"
							>
								{t("payments.checkout.summaryTitle", "Payment Summary")}
							</h2>
							<p className="text-xs text-smile-description">
								{t(
									"payments.checkout.summaryHint",
									"Review these details before leaving S.M.I.L.E.",
								)}
							</p>
						</div>
					</div>

					<dl className="divide-y [border-color:var(--surface-panel-border)]">
						{summaryRows.map((row) => (
							<div
								key={row.label}
								className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:items-center"
							>
								<dt className="text-sm text-smile-description">{row.label}</dt>
								<dd
									className={`text-sm font-semibold text-smile-title sm:text-right ${row.mono ? "font-mono" : ""}`}
								>
									{row.value}
								</dd>
							</div>
						))}
					</dl>

					<div className="mt-4 flex items-end justify-between gap-4 rounded-xl border border-smile-primary/20 bg-smile-primary-light/35 p-4">
						<span className="text-sm font-semibold text-smile-title">
							{t("payments.checkout.totalAmount", "Total Amount")}
						</span>
						<span className="font-poppins text-2xl font-bold text-smile-primary">
							{hasPayableAmount ? formatVND(amount) : "—"}
						</span>
					</div>

					{!hasPayableAmount && (
						<ErrorMessage
							className="mt-4"
							message={t(
								"payments.checkout.invalidAmount",
								"This appointment does not have a payable service amount yet.",
							)}
						/>
					)}
				</section>

				<section
					className={`${cardClass} flex flex-col`}
					aria-labelledby="payment-method-title"
				>
					<h2
						id="payment-method-title"
						className="font-poppins text-lg font-semibold text-smile-title"
					>
						{t("payments.checkout.methodTitle", "Payment Method")}
					</h2>
					<p className="mt-1 text-sm text-smile-description">
						{t(
							"payments.checkout.gatewayHint",
							"VNPay is the verified payment gateway for this appointment.",
						)}
					</p>

					<div className="mt-5 rounded-2xl border-2 border-smile-primary/45 bg-smile-primary-light/25 p-4">
						<div className="flex items-center gap-4">
							<span className="flex h-14 w-32 shrink-0 items-center justify-center rounded-xl bg-white px-3 shadow-sm">
								<Image
									src="/images/payment/vnpay-logo.svg"
									alt="VNPay payment gateway"
									width={138}
									height={42}
									className="h-auto w-full"
								/>
							</span>
							<div className="min-w-0 flex-1">
								<p className="font-poppins font-semibold text-smile-title">
									VNPay
								</p>
								<p className="text-xs leading-5 text-smile-description">
									{t(
										"payments.checkout.vnpayDesc",
										"Pay by domestic card, international card, or VNPay QR.",
									)}
								</p>
							</div>
							<Icon
								icon="lucide:circle-check-big"
								width={22}
								className="shrink-0 text-smile-primary"
							/>
						</div>
					</div>

					<div className="mt-4 flex gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-foreground">
						<Icon
							icon="lucide:shield-check"
							width={19}
							className="mt-0.5 shrink-0 text-success"
						/>
						<div>
							<p className="font-semibold">
								{t("payments.checkout.secureTitle", "Secure Payment")}
							</p>
							<p className="mt-0.5 text-xs leading-5 text-muted-foreground">
								{t(
									"payments.checkout.secureDesc",
									"VNPay processes the encrypted transaction. S.M.I.L.E does not store your card information.",
								)}
							</p>
						</div>
					</div>

					<div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
						<Button
							variant="outline"
							size="lg"
							disabled={isCreatingPayment}
							onClick={() => router.back()}
						>
							{t("payments.checkout.cancel", "Cancel")}
						</Button>
						<Button
							size="lg"
							disabled={isCreatingPayment || !hasPayableAmount}
							onClick={() => void handlePayment()}
						>
							{isCreatingPayment ? (
								<Icon icon="line-md:loading-twotone-loop" />
							) : (
								<Icon icon="lucide:external-link" />
							)}
							{isCreatingPayment
								? t("payments.checkout.redirecting", "Opening VNPay…")
								: t("payments.checkout.proceedToPayment", "Continue to VNPay")}
						</Button>
					</div>
				</section>
			</div>
		</PageFrame>
	);
}

export default function PaymentPage() {
	return <PaymentContent />;
}
