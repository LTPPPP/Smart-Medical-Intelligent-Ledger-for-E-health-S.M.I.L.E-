'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/shared/components/common/Input';
import { TIME_SLOTS, EMERGENCY_TIME_SLOTS, BookingType } from '../constants/appointment.constant';
import {
  CreateAppointmentByClinicRequest,
  CreateAppointmentBySpecialtyRequest,
  CreateAppointmentByDoctorRequest,
  CreateAppointmentOutsideHoursRequest,
} from '../types/appointment.type';
import { useClinic } from '@/features/clinic/hooks/useClinic';

interface CreateAppointmentFormProps {
  bookingType: BookingType;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CreateAppointmentForm = ({
  bookingType,
  onSubmit,
  onCancel,
  isSubmitting,
}: CreateAppointmentFormProps) => {
  const { useClinics } = useClinic();

  const [formData, setFormData] = useState({
    clinicId: '',
    specialtyId: '',
    doctorId: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    reason: '',
    preferredClinicId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (bookingType === 'clinic' && !formData.clinicId) {
      newErrors.clinicId = 'Please select a clinic';
    }
    if (bookingType === 'specialty' && !formData.specialtyId) {
      newErrors.specialtyId = 'Please select a specialty';
    }
    if (bookingType === 'doctor' && !formData.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }
    if (bookingType === 'outside-hours' && !formData.reason) {
      newErrors.reason = 'Please provide a reason for emergency appointment';
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Please select a date';
    }
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { data } = useClinics();

  const handleSubmit = async () => {
    if (!validate()) return;

    let requestData: any = {};

    switch (bookingType) {
      case 'clinic':
        requestData = {
          clinicId: formData.clinicId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          serviceId: formData.serviceId,
          notes: formData.notes,
        } as CreateAppointmentByClinicRequest;
        break;

      case 'specialty':
        requestData = {
          specialtyId: formData.specialtyId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          preferredClinicId: formData.preferredClinicId || undefined,
          notes: formData.notes,
        } as CreateAppointmentBySpecialtyRequest;
        break;

      case 'doctor':
        requestData = {
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          serviceId: formData.serviceId,
          notes: formData.notes,
        } as CreateAppointmentByDoctorRequest;
        break;

      case 'outside-hours':
        requestData = {
          clinicId: formData.clinicId,
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          serviceId: formData.serviceId,
          reason: formData.reason,
        } as CreateAppointmentOutsideHoursRequest;
        break;
    }

    await onSubmit(requestData);
  };

  const availableSlots = bookingType === 'outside-hours' 
    ? EMERGENCY_TIME_SLOTS 
    : TIME_SLOTS;

  const clinics = data?.data || [];
  return (
    <div className="space-y-6">
      {/* Clinic Selection (for clinic/outside-hours) */}
      {['clinic', 'outside-hours'].includes(bookingType) && (
        <div>
          <label className="block text-sm font-medium mb-2">Clinic *</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.clinicId}
            onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
          >
            <option value="">Select a clinic</option>
            {clinics.map((clinic: Clinic) => (
              <option value="clinic-001" key={clinic.clinicId}>{clinic.clinicName}</option>
            ))}
          </select>
          {errors.clinicId && <p className="text-red-500 text-xs mt-1">{errors.clinicId}</p>}
        </div>
      )}

      {/* Specialty Selection */}
      {bookingType === 'specialty' && (
        <div>
          <label className="block text-sm font-medium mb-2">Specialty *</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.specialtyId}
            onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
          >
            <option value="">Select a specialty</option>
            <option value="spec-001">Orthodontics</option>
            <option value="spec-002">Endodontics</option>
            <option value="spec-003">Periodontics</option>
          </select>
          {errors.specialtyId && <p className="text-red-500 text-xs mt-1">{errors.specialtyId}</p>}
        </div>
      )}

      {/* Doctor Selection */}
      {['doctor', 'outside-hours'].includes(bookingType) && (
        <div>
          <label className="block text-sm font-medium mb-2">Doctor *</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
          >
            <option value="">Select a doctor</option>
            <option value="doc-001">Dr. John Smith</option>
            <option value="doc-002">Dr. Jane Doe</option>
          </select>
          {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
        </div>
      )}

      {/* Date & Time */}
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
            {availableSlots.map((slot) => (
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

      {/* Service Selection */}
      {['clinic', 'doctor', 'outside-hours'].includes(bookingType) && (
        <div>
          <label className="block text-sm font-medium mb-2">Service</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
          >
            <option value="">Select a service</option>
            <option value="svc-001">General Checkup</option>
            <option value="svc-002">Dental Filling</option>
            <option value="svc-003">Root Canal</option>
          </select>
        </div>
      )}

      {/* Emergency Reason */}
      {bookingType === 'outside-hours' && (
        <div>
          <label className="block text-sm font-medium mb-2">Reason for Emergency *</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="Please describe your emergency..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
          {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
        </div>
      )}

      {/* Notes */}
      {bookingType !== 'outside-hours' && (
        <div>
          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
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
};