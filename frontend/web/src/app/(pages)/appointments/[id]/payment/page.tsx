"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAppointment } from "@/features/appointment/hooks/useAppointment";
import { useTranslation } from "@/features/i18n";
import { PageHeader } from "@/shared/components/common/PageHeader";
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
const panelBase =
	"rounded-xl border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]";

function PaymentContent() {
	const router = useRouter();
	const params = useParams();
	const appointmentId = params?.id as string;
	const { t } = useTranslation();
	const { useAppointmentById, createPayment, isCreatingPayment } =
		useAppointment();
	const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);

	// The GET /appointments/:id response is the flat entity (unlike list endpoints, which
	// wrap in {data: [...]}), and it has no doctorName/serviceName/estimatedPrice fields —
	// price comes from the linked service's base_price (null until a service is chosen,
	// e.g. for a by-specialty booking), and there's no doctor relation on this endpoint at all.
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

			if (paymentUrl) {
				window.location.href = paymentUrl;
			} else {
				toast.error(t("payments.checkout.createFailed", "Failed to create payment"));
			}
		} catch {
			toast.error(t("payments.checkout.createFailed", "Failed to create payment"));
		}
	};

	if (isLoading) {
		return (
			<AppShell>
				<Loading
					fullScreen
					text={t("payments.checkout.loadingDetails", "Loading payment details...")}
				/>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell>
				<div className="mx-auto w-full max-w-2xl px-8 py-10">
					<ErrorMessage
						message={t("payments.checkout.failedToLoad", "Failed to load appointment")}
						onRetry={refetch}
					/>
				</div>
			</AppShell>
		);
	}

	if (!appointment) {
		return (
			<AppShell>
				<div className="mx-auto w-full max-w-2xl px-8 py-10">
					<ErrorMessage message={t("payments.checkout.notFound", "Appointment not found")} />
				</div>
			</AppShell>
		);
	}

	const paymentStatus = appointment.paymentStatus ?? appointment.payment_status;
	if (paymentStatus !== "unpaid") {
		return (
			<AppShell>
				<div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-8 py-10 text-center">
					<Icon icon="mdi:check-circle" className="text-emerald-400" width={72} />
					<h2 className="font-poppins text-2xl font-bold text-smile-title">
						{t("payments.checkout.alreadyPaidTitle", "Already Paid")}
					</h2>
					<p className="text-sm text-smile-description">
						{t("payments.checkout.alreadyPaidDesc", "This appointment has already been paid.")}
					</p>
					<button
						onClick={() => router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId))}
						className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95"
						style={{ background: BLUE, boxShadow: "0 0 15px rgba(146,205,253,0.3)" }}
					>
						{t("payments.checkout.viewAppointment", "View Appointment")}
					</Button>
				</div>
			</AppShell>
		);
	}

	const appointmentCode = appointment.appointmentCode ?? appointment.appointment_code;

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
				{/* Header */}
				<div>
					<button
						onClick={() => router.back()}
						className="mb-4 flex items-center gap-2 text-sm font-medium text-smile-description transition hover:text-smile-title"
					>
						<Icon icon="mdi:arrow-left" width={18} />
						{t("payments.checkout.back", "Back")}
					</button>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							{appointmentCode && (
								<p className="font-mono text-sm font-semibold" style={{ color: TEAL }}>
									{appointmentCode}
								</p>
							)}
							<h1 className="mt-1 font-poppins text-[26px] font-bold tracking-[-0.5px] text-smile-title">
								{t("payments.checkout.title", "Payment")}
							</h1>
							<p className="mt-1 text-sm text-smile-description">
								{t("payments.checkout.subtitle", "Complete your appointment payment")}
							</p>
						</div>
					</div>
				</div>

				{/* Two-column layout: summary + method on the left, sticky total/CTA on the right */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="flex flex-col gap-6 lg:col-span-2">
						{/* Payment Summary */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[1px] text-smile-description">
								<Icon icon="mdi:receipt" width={18} style={{ color: TEAL }} />
								{t("payments.checkout.summaryTitle", "Payment Summary")}
							</h2>

							<div className={`${panelBase} flex flex-col divide-y [&>div]:[border-color:var(--surface-panel-border)]`}>
								<div className="flex items-center justify-between gap-3 px-4 py-3">
									<span className="text-sm text-smile-description">
										{t("payments.checkout.appointmentCode", "Appointment Code:")}
									</span>
									<span className="font-mono text-sm font-semibold text-smile-title">
										{appointmentCode}
									</span>
								</div>
								{(appointment.appointment_date || appointment.appointment_time) && (
									<div className="flex items-center justify-between gap-3 px-4 py-3">
										<span className="text-sm text-smile-description">
											{t("appointments.date", "Date")} / {t("appointments.time", "Time")}
										</span>
										<span className="text-sm font-semibold text-smile-title">
											{appointment.appointment_date}{" "}
											{appointment.appointment_time?.slice(0, 5)}
										</span>
									</div>
								)}
								<div className="flex items-center justify-between gap-3 px-4 py-3">
									<span className="text-sm text-smile-description">
										{t("payments.checkout.service", "Service:")}
									</span>
									<span className="text-sm font-semibold text-smile-title">
										{appointment.service?.service_name ??
											t("payments.checkout.notYetSpecified", "Not yet specified")}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 px-4 py-3">
									<span className="text-sm text-smile-description">
										{t("payments.checkout.doctor", "Doctor:")}
									</span>
									<span className="text-sm font-semibold text-smile-title">
										{appointment.doctor_id
											? `${t("appointments.detail.doctorPrefix", "Doctor")} ${appointment.doctor_id.slice(0, 8)}`
											: t("payments.checkout.notYetAssigned", "Not yet assigned")}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 px-4 py-3">
									<span className="text-sm text-smile-description">
										{t("payments.checkout.clinic", "Clinic:")}
									</span>
									<span className="text-sm font-semibold text-smile-title">
										{appointment.clinic?.clinic_name ?? "—"}
									</span>
								</div>
							</div>
						</div>
					</div>

						{/* Payment Method */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[1px] text-smile-description">
								<Icon icon="mdi:credit-card" width={18} className="text-emerald-400" />
								{t("payments.checkout.methodTitle", "Payment Method")}
							</h2>

							<div className="flex flex-col gap-3">
								<div
									className="flex items-center gap-3 rounded-xl border-2 p-4"
									style={{ borderColor: BLUE, background: "rgba(146,205,253,0.08)" }}
								>
									<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white">
										<Icon icon="simple-icons:vnpay" className="text-blue-600" width={28} />
									</div>
									<div className="flex-1">
										<p className="font-semibold text-smile-title">VNPay</p>
										<p className="text-xs text-smile-description">
											{t(
												"payments.checkout.vnpayDesc",
												"Pay with ATM card, Visa, MasterCard, QR Code",
											)}
										</p>
									</div>
									<Icon icon="mdi:check-circle" width={22} style={{ color: BLUE }} />
								</div>

								{[
									{ icon: "simple-icons:momo", name: "MoMo", tint: "text-pink-500" },
									{ icon: "simple-icons:zalopay", name: "ZaloPay", tint: "text-blue-500" },
								].map((m) => (
									<div
										key={m.name}
										className={`${panelBase} flex cursor-not-allowed items-center gap-3 p-4 opacity-50`}
									>
										<div className="flex h-11 w-11 items-center justify-center rounded-lg [background:var(--surface-card-bg)]">
											<Icon icon={m.icon} className={m.tint} width={28} />
										</div>
										<div className="flex-1">
											<p className="font-semibold text-smile-title">{m.name}</p>
											<p className="text-xs text-smile-description">
												{t("payments.checkout.comingSoon", "Coming soon")}
											</p>
										</div>
									</div>
								))}
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

					{/* Sticky total + actions */}
					<div className="flex flex-col gap-6">
						<div className={`${cardBase} sticky top-6 flex flex-col gap-5 p-6`}>
							<div>
								<p className="text-sm text-smile-description">
									{t("payments.checkout.totalAmount", "Total Amount:")}
								</p>
								<p className="mt-1 font-poppins text-3xl font-bold" style={{ color: TEAL }}>
									{formatVND(amount)}
								</p>
							</div>

							<div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
								<Icon
									icon="mdi:shield-check"
									className="mt-0.5 flex-shrink-0 text-emerald-400"
									width={20}
								/>
								<div className="text-xs text-smile-description">
									<p className="font-semibold text-smile-title">
										{t("payments.checkout.secureTitle", "Secure Payment")}
									</p>
									<p className="mt-0.5">
										{t(
											"payments.checkout.secureDesc",
											"Your payment is processed securely through VNPay's encrypted gateway. We do not store your card information.",
										)}
									</p>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<button
									onClick={handlePayment}
									disabled={isCreatingPayment}
									className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
									style={{ background: BLUE, boxShadow: "0 0 15px rgba(146,205,253,0.3)" }}
								>
									{isCreatingPayment && (
										<Icon icon="line-md:loading-twotone-loop" width={16} />
									)}
									{t("payments.checkout.proceedToPayment", "Proceed to Payment")}
								</button>
								<button
									onClick={() => router.back()}
									disabled={isCreatingPayment}
									className="rounded-full border px-6 py-3 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-60 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
								>
									{t("payments.checkout.cancel", "Cancel")}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

export default function PaymentPage() {
	// requiredPermissions dropped: user.permissions is never populated anywhere in the auth
	// store (the granular permission system is decorative — see backend RolesGuard), so any
	// requiredPermissions check is permanently unsatisfiable and blocks every role. Real
	// authorization is already enforced server-side by the backend's role guards, and route-level
	// access is gated by this route's layout.tsx (PAYMENT_ROLES).
	return (
		<ProtectedRoute>
			<PaymentContent />
		</ProtectedRoute>
	);
}
