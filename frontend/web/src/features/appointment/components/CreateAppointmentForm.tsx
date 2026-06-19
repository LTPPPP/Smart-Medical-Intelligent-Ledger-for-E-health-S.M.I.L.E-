'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/shared/components/common/Input';
import { TIME_SLOTS, BookingType, BOOKING_TYPE } from '../constants/appointment.constant';

interface CreateAppointmentFormProps {
  bookingType: BookingType;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CreateAppointmentForm({
  bookingType,
  onSubmit,
  onCancel,
  isSubmitting,
}: CreateAppointmentFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    clinicId: '',
    doctorId: '',
    specialtyId: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointmentDate) newErrors.appointmentDate = 'Please select a date';
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Please select a time';

    if (bookingType === BOOKING_TYPE.CLINIC && !formData.clinicId) {
      newErrors.clinicId = 'Please enter clinic ID';
    }
    if (bookingType === BOOKING_TYPE.DOCTOR && !formData.doctorId) {
      newErrors.doctorId = 'Please enter doctor ID';
    }
    if (bookingType === BOOKING_TYPE.SPECIALTY && !formData.specialtyId) {
      newErrors.specialtyId = 'Please enter specialty ID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      {bookingType === BOOKING_TYPE.CLINIC && (
        <div>
          <Input
            label="Clinic ID *"
            value={formData.clinicId}
            onChange={set('clinicId')}
            placeholder="Enter clinic ID"
          />
          {errors.clinicId && <p className="text-red-500 text-xs mt-1">{errors.clinicId}</p>}
        </div>
      )}

      {bookingType === BOOKING_TYPE.DOCTOR && (
        <div>
          <Input
            label="Doctor ID *"
            value={formData.doctorId}
            onChange={set('doctorId')}
            placeholder="Enter doctor ID"
          />
          {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
        </div>
      )}

      {bookingType === BOOKING_TYPE.SPECIALTY && (
        <div>
          <Input
            label="Specialty ID *"
            value={formData.specialtyId}
            onChange={set('specialtyId')}
            placeholder="Enter specialty ID"
          />
          {errors.specialtyId && <p className="text-red-500 text-xs mt-1">{errors.specialtyId}</p>}
        </div>
      )}

      {bookingType === BOOKING_TYPE.OUTSIDE_HOURS && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:alert" className="text-orange-600 mt-0.5" width={20} />
            <p className="text-sm text-orange-800">
              Emergency booking outside regular working hours. Additional charges may apply.
            </p>
          </div>
        </div>
      )}

      <div>
        <Input
          label="Service ID (Optional)"
          value={formData.serviceId}
          onChange={set('serviceId')}
          placeholder="Enter service ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Date *"
            type="date"
            value={formData.appointmentDate}
            onChange={set('appointmentDate')}
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
            onChange={set('appointmentTime')}
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
        <label className="block text-sm font-medium mb-2">Reason for Visit</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          placeholder="Describe your reason for visit..."
          value={formData.reason}
          onChange={set('reason')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          rows={2}
          placeholder="Any additional notes..."
          value={formData.notes}
          onChange={set('notes')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Icon icon="line-md:loading-twotone-loop" />}
          Book Appointment
        </button>
      </div>
    </div>
  );
}
