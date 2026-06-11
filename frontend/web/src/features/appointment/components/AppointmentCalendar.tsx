'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Appointment } from '../types/appointment.type';
import { APPOINTMENT_STATUS_COLORS } from '../constants/appointment.constant';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export const AppointmentCalendar = ({
  appointments,
  onAppointmentClick,
}: AppointmentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.appointmentDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-gray-50 border border-gray-200 min-h-24" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointmentsByDate[dateStr] || [];
      const isToday = 
        new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div
          key={day}
          className={`border border-gray-200 min-h-24 p-2 ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isToday ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
            {isToday && (
              <span className="ml-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1">
            {dayAppointments.slice(0, 2).map((appointment) => (
              <button
                key={appointment.appointmentId}
                onClick={() => onAppointmentClick(appointment)}
                className={`w-full text-left px-2 py-1 rounded text-xs ${
                  APPOINTMENT_STATUS_COLORS[appointment.status]
                } hover:opacity-80 transition-opacity`}
              >
                <div className="font-medium truncate">
                  {appointment.appointmentTime}
                </div>
                <div className="truncate">
                  {appointment.doctorName}
                </div>
              </button>
            ))}

            {dayAppointments.length > 2 && (
              <div className="text-xs text-gray-500 pl-2">
                +{dayAppointments.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon icon="mdi:calendar-month" width={24} />
            Calendar View
          </h2>
          <button
            onClick={goToToday}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <Icon icon="mdi:chevron-left" className="text-white" width={24} />
          </button>

          <h3 className="text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h3>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <Icon icon="mdi:chevron-right" className="text-white" width={24} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-600 mb-2 font-medium">Status Legend:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(APPOINTMENT_STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="text-xs text-gray-700">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};