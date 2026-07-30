"use client";

import { useRouter, useParams } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAppointment } from "@/features/appointment/hooks/useAppointment";
import { useTranslation } from "@/features/i18n";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { Loading } from "@/shared/components/common/Loading";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

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
		if (!appointment) return;

		try {
			const result = await createPayment({
				appointmentId: (appointment.appointmentId ??
					appointment.appointment_id) as string,
				amount,
				orderInfo: `Payment for ${appointment.appointmentCode ?? appointment.appointment_code}`,
			});
			const paymentUrl = result.data.data.paymentUrl;

			if (paymentUrl) {
				// Redirect to VNPay
				window.location.href = paymentUrl;
			}
		} catch {
			toast.error(t("payments.checkout.createFailed", "Failed to create payment"));
		}
	};

	if (isLoading)
		return (
			<Loading
				fullScreen
				text={t("payments.checkout.loadingDetails", "Loading payment details...")}
			/>
		);
	if (error)
		return (
			<ErrorMessage
				message={t("payments.checkout.failedToLoad", "Failed to load appointment")}
				onRetry={refetch}
			/>
		);
	if (!appointment)
		return (
			<ErrorMessage message={t("payments.checkout.notFound", "Appointment not found")} />
		);

	const paymentStatus = appointment.paymentStatus ?? appointment.payment_status;
	if (paymentStatus !== "unpaid") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
				<div className="text-center max-w-md">
					<Icon
						icon="mdi:check-circle"
						className="mx-auto text-green-500 mb-4"
						width={80}
					/>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">
						{t("payments.checkout.alreadyPaidTitle", "Already Paid")}
					</h2>
					<p className="text-gray-600 mb-4">
						{t("payments.checkout.alreadyPaidDesc", "This appointment has already been paid.")}
					</p>
					<button
						onClick={() =>
							router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId))
						}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
					>
						{t("payments.checkout.viewAppointment", "View Appointment")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
					>
						<Icon icon="mdi:arrow-left" width={20} />
						{t("payments.checkout.back", "Back")}
					</button>

					<h1 className="text-3xl font-bold text-gray-800">
						{t("payments.checkout.title", "Payment")}
					</h1>
					<p className="text-gray-600 mt-1">
						{t("payments.checkout.subtitle", "Complete your appointment payment")}
					</p>
				</div>

				{/* Payment Summary */}
				<div className="bg-white rounded-xl shadow-md p-6 mb-6">
					<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
						<Icon icon="mdi:receipt" className="text-blue-600" width={24} />
						{t("payments.checkout.summaryTitle", "Payment Summary")}
					</h2>

					<div className="space-y-4">
						<div className="p-4 bg-gray-50 rounded-lg">
							<div className="flex justify-between items-center mb-2">
								<span className="text-gray-600">
									{t("payments.checkout.appointmentCode", "Appointment Code:")}
								</span>
								<span className="font-mono font-semibold">
									{appointment.appointmentCode ?? appointment.appointment_code}
								</span>
							</div>
							<div className="flex justify-between items-center mb-2">
								<span className="text-gray-600">
									{t("payments.checkout.service", "Service:")}
								</span>
								<span className="font-semibold">
									{appointment.service?.service_name ??
										t("payments.checkout.notYetSpecified", "Not yet specified")}
								</span>
							</div>
							<div className="flex justify-between items-center mb-2">
								<span className="text-gray-600">
									{t("payments.checkout.doctor", "Doctor:")}
								</span>
								<span className="font-semibold">
									{appointment.doctor_id
										? `${t("appointments.detail.doctorPrefix", "Doctor")} ${appointment.doctor_id.slice(0, 8)}`
										: t("payments.checkout.notYetAssigned", "Not yet assigned")}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">
									{t("payments.checkout.clinic", "Clinic:")}
								</span>
								<span className="font-semibold">
									{appointment.clinic?.clinic_name}
								</span>
							</div>
						</div>

						<div className="border-t pt-4">
							<div className="flex justify-between items-center text-lg">
								<span className="font-bold text-gray-800">
									{t("payments.checkout.totalAmount", "Total Amount:")}
								</span>
								<span className="font-bold text-2xl text-blue-600">
									{amount.toLocaleString()} VND
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Payment Method */}
				<div className="bg-white rounded-xl shadow-md p-6 mb-6">
					<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
						<Icon
							icon="mdi:credit-card"
							className="text-green-600"
							width={24}
						/>
						{t("payments.checkout.methodTitle", "Payment Method")}
					</h2>

					<div className="space-y-3">
						<div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
									<Icon
										icon="simple-icons:vnpay"
										className="text-blue-600"
										width={32}
									/>
								</div>
								<div className="flex-1">
									<p className="font-bold text-gray-800">VNPay</p>
									<p className="text-sm text-gray-600">
										{t(
											"payments.checkout.vnpayDesc",
											"Pay with ATM card, Visa, MasterCard, QR Code",
										)}
									</p>
								</div>
								<Icon
									icon="mdi:check-circle"
									className="text-blue-600"
									width={24}
								/>
							</div>
						</div>

						<div className="p-4 border rounded-lg opacity-50 cursor-not-allowed">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
									<Icon
										icon="simple-icons:momo"
										className="text-pink-600"
										width={32}
									/>
								</div>
								<div className="flex-1">
									<p className="font-bold text-gray-800">MoMo</p>
									<p className="text-sm text-gray-600">{t("payments.checkout.comingSoon", "Coming soon")}</p>
								</div>
							</div>
						</div>

						<div className="p-4 border rounded-lg opacity-50 cursor-not-allowed">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
									<Icon
										icon="simple-icons:zalopay"
										className="text-blue-600"
										width={32}
									/>
								</div>
								<div className="flex-1">
									<p className="font-bold text-gray-800">ZaloPay</p>
									<p className="text-sm text-gray-600">{t("payments.checkout.comingSoon", "Coming soon")}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Security Notice */}
				<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
					<div className="flex items-start gap-2">
						<Icon
							icon="mdi:shield-check"
							className="text-green-600 flex-shrink-0 mt-0.5"
							width={24}
						/>
						<div className="text-sm text-green-800">
							<p className="font-medium mb-1">
								{t("payments.checkout.secureTitle", "Secure Payment")}
							</p>
							<p>
								{t(
									"payments.checkout.secureDesc",
									"Your payment is processed securely through VNPay's encrypted gateway. We do not store your card information.",
								)}
							</p>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={() => router.back()}
						disabled={isCreatingPayment}
						className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
					>
						{t("payments.checkout.cancel", "Cancel")}
					</button>
					<button
						onClick={handlePayment}
						disabled={isCreatingPayment}
						className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
					>
						{isCreatingPayment && <Icon icon="line-md:loading-twotone-loop" />}
						{t("payments.checkout.proceedToPayment", "Proceed to Payment")}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function PaymentPage() {
	// requiredPermissions dropped: user.permissions is never populated anywhere in the auth
	// store (the granular permission system is decorative — see backend RolesGuard), so any
	// requiredPermissions check is permanently unsatisfiable and blocks every role. Real
	// authorization is already enforced server-side by the backend's role guards.
	return (
		<ProtectedRoute>
			<PaymentContent />
		</ProtectedRoute>
	);
}
