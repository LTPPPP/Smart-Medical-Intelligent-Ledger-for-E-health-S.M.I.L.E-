'use client';

import { Icon } from '@iconify/react';
import { Appointment } from '../types/appointment.type';
import { 
  APPOINTMENT_STATUS_COLORS, 
  PAYMENT_STATUS_COLORS 
} from '../constants/appointment.constant';

interface AppointmentCardProps {
  appointment: Appointment;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export const AppointmentCard = ({
  appointment,
  onView,
  onEdit,
  onCancel,
  onConfirm,
}: AppointmentCardProps) => {
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
  const paymentColor = appointment.paymentStatus
    ? PAYMENT_STATUS_COLORS[appointment.paymentStatus]
    : '';

  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.appointmentTime}`
  );
  const formattedDate = appointmentDateTime.toLocaleDateString('en-GB');
  const formattedTime = appointment.appointmentTime;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{appointment.serviceName}</h3>
          <p className="text-sm text-gray-500 font-mono">{appointment.appointmentCode}</p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-bold ${statusColor}`}>
          {appointment.status}
        </span>
      </div>

      {/* Info Grid */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:calendar" className="text-blue-500" width={18} />
          <span className="text-gray-700">{formattedDate} at {formattedTime}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:doctor" className="text-green-500" width={18} />
          <span className="text-gray-700">{appointment.doctorName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:hospital-building" className="text-purple-500" width={18} />
          <span className="text-gray-700">{appointment.clinicName}</span>
        </div>

        {appointment.notes && (
          <div className="flex items-start gap-2 text-sm">
            <Icon icon="mdi:note-text" className="text-gray-400 mt-0.5" width={18} />
            <span className="text-gray-600 italic">{appointment.notes}</span>
          </div>
        )}
      </div>

      {/* Payment Badge */}
      {appointment.paymentStatus && (
        <div className="mb-4">
          <span className={`px-2 py-1 text-xs rounded-full ${paymentColor}`}>
            💳 {appointment.paymentStatus}
          </span>
        </div>
      )}

      {/* Price */}
      <div className="mb-4 pb-4 border-b">
        <span className="text-lg font-bold text-blue-600">
          {appointment.estimatedPrice.toLocaleString()} VND
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 font-medium text-sm"
          >
            View Details
          </button>
        )}

        {appointment.status === 'SCHEDULED' && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Icon icon="mdi:pencil" width={20} />
          </button>
        )}

        {appointment.status === 'SCHEDULED' && onConfirm && (
          <button
            onClick={onConfirm}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
          >
            <Icon icon="mdi:check-circle" width={20} />
          </button>
        )}

        {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Icon icon="mdi:close-circle" width={20} />
          </button>
        )}
      </div>
    </div>
  );
};