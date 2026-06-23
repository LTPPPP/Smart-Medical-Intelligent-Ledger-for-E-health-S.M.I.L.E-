'use client';

import { useRouter, useParams } from 'next/navigation';

import { Icon } from '@iconify/react';

import { 
  APPOINTMENT_STATUS_COLORS, 
  PAYMENT_STATUS_COLORS,
  CANCELLATION_POLICY
} from '@/features/appointment/constants/appointment.constant';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

function AppointmentDetailContent() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string;

  const { user } = useAuthStore();
  const { 
    useAppointmentById, 
    cancelAppointment, 
    confirmAppointment,
    sendReminder,
    isCancelling, 
    isConfirming,
    isSendingReminder
  } = useAppointment();

  const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);

  const handleCancel = async () => {
    const reason = prompt('Please provide cancellation reason:');
    if (!reason) return;

    try {
      await cancelAppointment({ appointmentId, request: { reason } });
      alert('Appointment cancelled successfully');
      refetch();
    } catch {
      alert('Failed to cancel appointment');
    }
  };

  const handleConfirm = async () => {
    if (!confirm('Confirm this appointment?')) return;

    try {
      await confirmAppointment(appointmentId);
      alert('Appointment confirmed successfully');
      refetch();
    } catch {
      alert('Failed to confirm appointment');
    }
  };

  const handleSendReminder = async () => {
    try {
      await sendReminder({
        appointmentId,
        channels: ['EMAIL', 'SMS', 'PUSH']
      });
      alert('Reminder sent successfully');
    } catch {
      alert('Failed to send reminder');
    }
  };

  const handlePayment = () => {
    router.push(ROUTES.APPOINTMENT_PAYMENT(appointmentId));
  };

  if (isLoading) return <Loading fullScreen text="Loading appointment details..." />;
  if (error) return <ErrorMessage message="Failed to load appointment" onRetry={refetch} />;

  const appointment = data;
  if (!appointment) return <ErrorMessage message="Appointment not found" />;

  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
  const paymentColor = appointment.paymentStatus 
    ? PAYMENT_STATUS_COLORS[appointment.paymentStatus]
    : '';

  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.appointmentTime}`
  );
  const formattedDate = appointmentDateTime.toLocaleDateString('en-GB');
  const formattedTime = appointment.appointmentTime;

  const canCancel = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canConfirm = appointment.status === 'SCHEDULED' && user?.roles.includes('ROLE_RECEPTIONIST');
  const canEdit = appointment.status === 'SCHEDULED';
  const canPay = appointment.paymentStatus === 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Back
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{appointment.serviceName}</h1>
              <p className="text-gray-600 mt-1 font-mono">{appointment.appointmentCode}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-bold text-sm ${statusColor}`}>
              {appointment.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon icon="mdi:calendar-clock" className="text-blue-600" width={24} />
                Appointment Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon icon="mdi:calendar" className="text-blue-500" width={24} />
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="font-semibold text-gray-800">
                      {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon icon="mdi:doctor" className="text-green-500" width={24} />
                  <div>
                    <p className="text-xs text-gray-500">Doctor</p>
                    <p className="font-semibold text-gray-800">{appointment.doctorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon icon="mdi:hospital-building" className="text-purple-500" width={24} />
                  <div>
                    <p className="text-xs text-gray-500">Clinic</p>
                    <p className="font-semibold text-gray-800">{appointment.clinicName}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Icon icon="mdi:note-text" className="text-blue-600 mt-0.5" width={24} />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Notes</p>
                      <p className="text-gray-700 mt-1">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon icon="mdi:account" className="text-green-600" width={24} />
                Patient Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient Name:</span>
                  <span className="font-semibold">{appointment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-mono text-sm">{appointment.patientId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold mb-4">Payment</h3>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {appointment.estimatedPrice.toLocaleString()} VND
                  </span>
                </div>
                
                {appointment.paymentStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentColor}`}>
                      {appointment.paymentStatus}
                    </span>
                  </div>
                )}
              </div>

              {canPay && (
                <button
                  onClick={handlePayment}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Pay Now
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold mb-4">Actions</h3>
              
              <div className="space-y-2">
                {canEdit && (
                  <button
                    onClick={() => router.push(ROUTES.APPOINTMENT_EDIT(appointmentId))}
                    className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    Edit Appointment
                  </button>
                )}

                {canConfirm && (
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                )}

                <button
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="w-full bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 font-medium disabled:opacity-50"
                >
                  {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                </button>

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                )}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                <Icon icon="mdi:information" width={18} />
                Cancellation Policy
              </h4>
              <p className="text-xs text-yellow-700">
                Free cancellation up to {CANCELLATION_POLICY.FREE_CANCELLATION_HOURS} hours before appointment. 
                Late cancellation fee: {CANCELLATION_POLICY.LATE_CANCELLATION_FEE_PERCENT}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDetailPage() {
  return (
    <ProtectedRoute requiredPermissions={['APPOINTMENT_READ']}>
      <AppointmentDetailContent />
    </ProtectedRoute>
  );
}
