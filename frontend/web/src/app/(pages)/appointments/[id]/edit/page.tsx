'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@iconify/react';

import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { Input } from '@/shared/components/common/Input';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

import { TIME_SLOTS } from '@/features/appointment/constants/appointment.constant';
import { ROUTES } from '@/shared/constants/routes';

function EditAppointmentContent() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string;

  const { 
    useAppointmentById, 
    updateAppointment, 
    isUpdating 
  } = useAppointment();

  const { data, isLoading, error, refetch } = useAppointmentById(appointmentId);

  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.data) {
      const appointment = data.data;
      setFormData({
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        notes: appointment.notes || '',
      });
    }
  }, [data]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Please select a date';
    }
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await updateAppointment({
        appointmentId,
        request: {
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          notes: formData.notes,
        },
      });
      alert('Appointment updated successfully!');
      router.push(ROUTES.APPOINTMENT_DETAIL(appointmentId));
    } catch {
      alert('Failed to update appointment');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading appointment..." />;
  if (error) return <ErrorMessage message="Failed to load appointment" onRetry={refetch} />;

  const appointment = data?.data;
  if (!appointment) return <ErrorMessage message="Appointment not found" />;

  if (appointment.status !== 'SCHEDULED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" className="mx-auto text-orange-500 mb-4" width={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cannot Edit</h2>
          <p className="text-gray-600 mb-4">
            Only SCHEDULED appointments can be edited.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800">Edit Appointment</h1>
          <p className="text-gray-600 mt-1">Update appointment details</p>
        </div>

        {/* Current Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="font-bold mb-4">Current Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Service</p>
              <p className="font-semibold">{appointment.serviceName}</p>
            </div>
            <div>
              <p className="text-gray-500">Doctor</p>
              <p className="font-semibold">{appointment.doctorName}</p>
            </div>
            <div>
              <p className="text-gray-500">Clinic</p>
              <p className="font-semibold">{appointment.clinicName}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-semibold text-blue-600">
                {appointment.estimatedPrice.toLocaleString()} VND
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold mb-4">Update Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Date *"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.appointmentDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.appointmentDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.appointmentTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.appointmentTime}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon icon="mdi:alert" className="text-yellow-600 flex-shrink-0 mt-0.5" width={20} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Doctor and clinic cannot be changed</li>
                    <li>New time slot must be available</li>
                    <li>Notifications will be sent to all parties</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t mt-6">
            <button
              onClick={() => router.back()}
              disabled={isUpdating}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating && <Icon icon="line-md:loading-twotone-loop" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditAppointmentPage() {
  return (
    <ProtectedRoute requiredPermissions={['APPOINTMENT_UPDATE']}>
      <EditAppointmentContent />
    </ProtectedRoute>
  );
}