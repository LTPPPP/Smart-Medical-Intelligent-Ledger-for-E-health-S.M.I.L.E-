'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams, useParams } from 'next/navigation';

import { Icon } from '@iconify/react';

import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import type { Payment } from '@/features/appointment/types/appointment.type';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { ROUTES } from '@/shared/constants/routes';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const routeAppointmentId = (params?.id as string) || '';

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Processing payment...');

  const { usePaymentsByAppointment, refundPayment, isRefunding } = useAppointment();
  const { data: paymentsData, refetch: refetchPayments } =
    usePaymentsByAppointment(routeAppointmentId || null);
  const payments = paymentsData?.data?.data ?? [];

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    const transactionNo = searchParams.get('vnp_TransactionNo');
    const appointmentId = searchParams.get('appointmentId') || routeAppointmentId;

    // VNPay response codes: 00 = Success, anything else = Failed.
    // Notify the payment-service so it marks the payment paid and updates the
    // appointment. The BE reads vnp_TxnRef (= payment_id), vnp_ResponseCode and
    // vnp_TransactionNo. Errors are swallowed so the UI still reflects the result.
    const notifyBackend = async () => {
      try {
        await apiClient.get(API_ENDPOINTS.PAYMENT.VNPAY_RETURN, {
          params: {
            vnp_ResponseCode: responseCode,
            vnp_TxnRef: txnRef,
            vnp_TransactionNo: transactionNo,
          },
        });
      } catch {
        // ignore — the mock flow already encodes the outcome in the URL
      } finally {
        refetchPayments();
      }
    };

    if (responseCode === '00') {
      setStatus('success');
      setMessage('Payment successful! Your appointment is confirmed.');
      void notifyBackend();

      // Redirect after a short delay so the user can see the payment history.
      const t = setTimeout(() => {
        if (appointmentId) {
          router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId));
        } else {
          router.push(ROUTES.APPOINTMENTS);
        }
      }, 6000);
      return () => clearTimeout(t);
    }

    setStatus('failed');
    setMessage('Payment failed. Please try again.');
    void notifyBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const handleRefund = async (payment: Payment) => {
    await refundPayment({
      paymentId: payment.payment_id,
      request: { reason: 'Refund requested from callback (demo)' },
    });
    await refetchPayments();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Icon
              icon="line-md:loading-twotone-loop"
              className="mx-auto text-blue-600 mb-4"
              width={80}
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Icon
                  icon="mdi:check-circle"
                  className="text-green-600"
                  width={60}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              Redirecting to your appointment...
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Icon
                  icon="mdi:close-circle"
                  className="text-red-600"
                  width={60}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2">
                <strong>Common reasons:</strong>
              </p>
              <ul className="text-xs text-red-700 text-left list-disc list-inside space-y-1">
                <li>Insufficient balance</li>
                <li>Transaction cancelled by user</li>
                <li>Card/account limit exceeded</li>
                <li>Network connection issue</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(ROUTES.APPOINTMENTS)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                My Appointments
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {/* Payment history (with a demo refund button) */}
        {payments.length > 0 && (
          <div className="mt-8 text-left border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:history" width={18} />
              Payment History
            </h3>
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.payment_id}
                  className="border rounded-lg p-3 text-sm bg-gray-50"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">
                      {Number(p.amount).toLocaleString()} {p.currency}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`font-semibold ${
                        p.status === 'paid'
                          ? 'text-green-600'
                          : p.status === 'refunded'
                            ? 'text-orange-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {/* Refund button always visible for demo */}
                  <button
                    onClick={() => handleRefund(p)}
                    disabled={isRefunding || p.status === 'refunded'}
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isRefunding && <Icon icon="line-md:loading-twotone-loop" />}
                    {p.status === 'refunded' ? 'Refunded' : 'Refund'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
