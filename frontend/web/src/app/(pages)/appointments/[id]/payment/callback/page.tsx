'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ROUTES } from '@/shared/constants/routes';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const transactionNo = searchParams.get('vnp_TransactionNo');
    const appointmentId = searchParams.get('appointmentId');

    // VNPay response codes:
    // 00: Success
    // Other: Failed
    
    if (responseCode === '00') {
      setStatus('success');
      setMessage('Payment successful! Your appointment is confirmed.');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        if (appointmentId) {
          router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId));
        } else {
          router.push(ROUTES.APPOINTMENTS);
        }
      }, 3000);
    } else {
      setStatus('failed');
      setMessage('Payment failed. Please try again.');
    }
  }, [searchParams, router]);

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
      </div>
    </div>
  );
}