'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { useAuthStore } from '@/features/auth/store/authStore';

import { AppointmentStatus } from '@/features/appointment/constants/appointment.constant';

import { AppointmentCard } from '@/features/appointment/components/AppointmentCard';
import { AppointmentCalendar } from '@/features/appointment/components/AppointmentCalendar';
import { AppointmentFilters } from '@/features/appointment/components/AppointmentFilters';

import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

import { ROUTES } from '@/shared/constants/routes';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useAppointmentsByPatient, cancelAppointment, isCancelling } = useAppointment();

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<{
    status: AppointmentStatus | 'ALL';
    startDate: string;
    endDate: string;
    search: string;
  }>({
    status: 'ALL',
    startDate: '',
    endDate: '',
    search: '',
  });

  const { data, isLoading, error, refetch } = useAppointmentsByPatient(user?.userId || null, {
    page,
    size,
    status: filters.status === 'ALL' ? undefined : filters.status,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const handleCancel = async (appointmentId: string) => {
    const reason = prompt('Please provide cancellation reason:');
    if (!reason) return;

    try {
      await cancelAppointment({ appointmentId, request: { reason } });
      alert('Appointment cancelled successfully');
    } catch {
      alert('Failed to cancel appointment');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPage(0);
  };

  if (isLoading) return <Loading fullScreen text="Loading appointments..." />;
  if (error) return <ErrorMessage message="Failed to load appointments" onRetry={refetch} />;

  console.log();
  
  const appointments = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  // Filter
  const filteredAppointments = appointments.filter((appointment) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      appointment.appointmentCode.toLowerCase().includes(searchLower) ||
      appointment.patientName.toLowerCase().includes(searchLower) ||
      appointment.doctorName.toLowerCase().includes(searchLower) ||
      appointment.clinicName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
              <p className="text-gray-600 mt-1">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </p>
            </div>
            <button
              onClick={() => router.push(ROUTES.APPOINTMENT_NEW)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Icon icon="mdi:plus" width={20} />
              New Appointment
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <Icon icon="mdi:view-list" width={20} />
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <Icon icon="mdi:calendar" width={20} />
            Calendar View
          </button>
        </div>

        {/* Filters */}
        {viewMode === 'list' && (
          <div className="mb-6">
            <AppointmentFilters
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>
        )}

        {/* Content */}
        {viewMode === 'calendar' ? (
          <AppointmentCalendar
            appointments={appointments}
            onAppointmentClick={(appointment) =>
              router.push(ROUTES.APPOINTMENT_DETAIL(appointment.appointmentId))
            }
          />
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Icon icon="mdi:calendar-blank" className="mx-auto text-gray-300 mb-4" width={64} />
            <p className="text-gray-500 mb-4">No appointments found</p>
            <button
              onClick={() => router.push(ROUTES.APPOINTMENT_NEW)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                onView={() => router.push(ROUTES.APPOINTMENT_DETAIL(appointment.appointmentId))}
                onCancel={() => handleCancel(appointment.appointmentId)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}