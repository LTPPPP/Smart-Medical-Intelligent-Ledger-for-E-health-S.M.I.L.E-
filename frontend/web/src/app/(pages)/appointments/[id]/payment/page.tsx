'use client';

import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@iconify/react';

import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

function PaymentContent() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string;

  const { 
    useAppointmentById, 
    createPayment, 
    isCreatingPayment 
  } = useAppointment();

  const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);

  const handlePayment = async () => {
    if (!appointment) return;

    try {
      const result = await createPayment({
        appointmentId: appointment.appointmentId,
        amount: appointment.estimatedPrice,
        orderInfo: `Payment for ${appointment.appointmentCode}`,
      });

      if (result.data.paymentUrl) {
        // Redirect to VNPay
        window.location.href = result.data.paymentUrl;
      }
    } catch {
      alert('Failed to create payment');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading payment details..." />;
  if (error) return <ErrorMessage message="Failed to load appointment" onRetry={refetch} />;

  const appointment = data?.data;
  if (!appointment) return <ErrorMessage message="Appointment not found" />;

  if (appointment.paymentStatus !== 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <Icon 
            icon="mdi:check-circle" 
            className="mx-auto text-green-500 mb-4" 
            width={80} 
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Already Paid
          </h2>
          <p className="text-gray-600 mb-4">
            This appointment has already been paid.
          </p>
          <button
            onClick={() => router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId))}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            View Appointment
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
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800">Payment</h1>
          <p className="text-gray-600 mt-1">Complete your appointment payment</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icon icon="mdi:receipt" className="text-blue-600" width={24} />
            Payment Summary
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Appointment Code:</span>
                <span className="font-mono font-semibold">{appointment.appointmentCode}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Service:</span>
                <span className="font-semibold">{appointment.serviceName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-semibold">{appointment.doctorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clinic:</span>
                <span className="font-semibold">{appointment.clinicName}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-800">Total Amount:</span>
                <span className="font-bold text-2xl text-blue-600">
                  {appointment.estimatedPrice.toLocaleString()} VND
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icon icon="mdi:credit-card" className="text-green-600" width={24} />
            Payment Method
          </h2>

          <div className="space-y-3">
            <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <Icon icon="simple-icons:vnpay" className="text-blue-600" width={32} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">VNPay</p>
                  <p className="text-sm text-gray-600">
                    Pay with ATM card, Visa, MasterCard, QR Code
                  </p>
                </div>
                <Icon icon="mdi:check-circle" className="text-blue-600" width={24} />
              </div>
            </div>

            <div className="p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon icon="simple-icons:momo" className="text-pink-600" width={32} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">MoMo</p>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon icon="simple-icons:zalopay" className="text-blue-600" width={32} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">ZaloPay</p>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:shield-check" className="text-green-600 flex-shrink-0 mt-0.5" width={24} />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>
                Your payment is processed securely through VNPay&apos;s encrypted gateway. 
                We do not store your card information.
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
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isCreatingPayment}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {isCreatingPayment && <Icon icon="line-md:loading-twotone-loop" />}
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute requiredPermissions={['APPOINTMENT_READ']}>
      <PaymentContent />
    </ProtectedRoute>
  );
}