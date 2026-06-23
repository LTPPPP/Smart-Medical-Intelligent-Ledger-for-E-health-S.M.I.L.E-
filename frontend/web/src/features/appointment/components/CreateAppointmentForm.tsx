'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { Input } from '@/shared/components/common/Input';

import { BookingType, BOOKING_TYPE } from '../constants/appointment.constant';

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
    clinic_id: '',
    doctor_id: '',
    specialty_id: '',
    service_id: '',
    room_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    chief_complaint: '',
    outside_hours_reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clinic_id) newErrors.clinic_id = 'Please enter clinic ID';
    if (!formData.appointment_date) newErrors.appointment_date = 'Please select a date';
    if (!formData.appointment_time) newErrors.appointment_time = 'Please select a time';

    if ((bookingType === BOOKING_TYPE.CLINIC || bookingType === BOOKING_TYPE.DOCTOR || bookingType === BOOKING_TYPE.OUTSIDE_HOURS) && !formData.doctor_id) {
      newErrors.doctor_id = 'Please enter doctor ID';
    }
    if (bookingType === BOOKING_TYPE.SPECIALTY && !formData.specialty_id) {
      newErrors.specialty_id = 'Please enter specialty ID';
    }
    if (bookingType === BOOKING_TYPE.OUTSIDE_HOURS && !formData.outside_hours_reason) {
      newErrors.outside_hours_reason = 'Please describe why outside-hours booking is needed';
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
      <div>
        <Input
          label="Clinic ID *"
          value={formData.clinic_id}
          onChange={set('clinic_id')}
          placeholder="Enter clinic ID"
        />
        {errors.clinic_id && <p className="text-red-500 text-xs mt-1">{errors.clinic_id}</p>}
      </div>

      {(bookingType === BOOKING_TYPE.CLINIC || bookingType === BOOKING_TYPE.DOCTOR || bookingType === BOOKING_TYPE.OUTSIDE_HOURS) && (
        <div>
          <Input
            label="Doctor ID *"
            value={formData.doctor_id}
            onChange={set('doctor_id')}
            placeholder="Enter doctor ID"
          />
          {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id}</p>}
        </div>
      )}

      {bookingType === BOOKING_TYPE.SPECIALTY && (
        <div>
          <Input
            label="Specialty ID *"
            value={formData.specialty_id}
            onChange={set('specialty_id')}
            placeholder="Enter specialty ID"
          />
          {errors.specialty_id && <p className="text-red-500 text-xs mt-1">{errors.specialty_id}</p>}
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
          value={formData.service_id}
          onChange={set('service_id')}
          placeholder="Enter service ID"
        />
      </div>

      <div>
        <Input
          label="Room ID (Optional)"
          value={formData.room_id}
          onChange={set('room_id')}
          placeholder="Enter treatment room ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Date *"
            type="date"
            value={formData.appointment_date}
            onChange={set('appointment_date')}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.appointment_date && (
            <p className="text-red-500 text-xs mt-1">{errors.appointment_date}</p>
          )}
        </div>

        <div>
          <Input
            label="Time *"
            type="time"
            value={formData.appointment_time}
            onChange={set('appointment_time')}
            step={900}
          />
          {errors.appointment_time && (
            <p className="text-red-500 text-xs mt-1">{errors.appointment_time}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Availability is validated against the clinic schedule when submitted.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Reason for Visit</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          placeholder="Describe your reason for visit..."
          value={formData.chief_complaint}
          onChange={set('chief_complaint')}
        />
      </div>

      {bookingType === BOOKING_TYPE.OUTSIDE_HOURS && (
        <div>
          <label className="block text-sm font-medium mb-2">Outside-hours reason *</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
            placeholder="Why does this appointment need to be outside working hours?"
            value={formData.outside_hours_reason}
            onChange={set('outside_hours_reason')}
          />
          {errors.outside_hours_reason && (
            <p className="text-red-500 text-xs mt-1">{errors.outside_hours_reason}</p>
          )}
        </div>
      )}

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
