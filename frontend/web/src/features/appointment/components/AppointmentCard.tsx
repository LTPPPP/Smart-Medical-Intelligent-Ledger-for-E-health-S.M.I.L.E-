'use client';

import { Icon } from '@iconify/react';

import { APPOINTMENT_STATUS_COLORS } from '../constants/appointment.constant';
import type { Appointment } from '../types/appointment.type';

interface AppointmentCardProps {
  appointment: Appointment;
  onView: () => void;
  onCancel: () => void;
}

export function AppointmentCard({ appointment, onView, onCancel }: AppointmentCardProps) {
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status] ?? 'bg-gray-100 text-gray-800';
  const canCancel = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);

  return (
    <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{appointment.serviceName}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{appointment.appointmentCode}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {appointment.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Icon icon="mdi:calendar" width={16} className="shrink-0" />
          <span>{appointment.appointmentDate} · {appointment.appointmentTime}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Icon icon="mdi:doctor" width={16} className="shrink-0" />
          <span className="truncate">{appointment.doctorName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Icon icon="mdi:hospital-building" width={16} className="shrink-0" />
          <span className="truncate">{appointment.clinicName}</span>
        </div>
        <div className="flex items-center gap-2 font-semibold text-blue-600">
          <Icon icon="mdi:cash" width={16} className="shrink-0" />
          <span>{appointment.estimatedPrice.toLocaleString()} VND</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={onView}
          className="flex-1 bg-blue-50 text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
          View Details
        </button>
        {canCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
