'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AppointmentCard } from '@/features/appointment/components/AppointmentCard';
import { AppointmentFilters } from '@/features/appointment/components/AppointmentFilters';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import type { AppointmentStatus } from '@/features/appointment/constants/appointment.constant';
import { isValidDateRange } from '@/shared/lib/validation';
import { ROUTES } from '@/shared/constants/routes';

type LookupMode = 'patient' | 'doctor' | 'clinic';

export default function AppointmentsPage() {
  const router = useRouter();
  const [lookupMode, setLookupMode] = useState<LookupMode>('patient');
  const [lookupInput, setLookupInput] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<{
    status: AppointmentStatus | 'ALL';
    startDate: string;
    endDate: string;
    search: string;
  }>({ status: 'ALL', startDate: '', endDate: '', search: '' });
  const { useAppointmentsByPatient, useAppointmentsByDoctor, useAppointmentsByClinic } =
    useAppointment();
  const params = {
    page,
    size: 12,
    status: filters.status === 'ALL' ? undefined : filters.status,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };
  const patientQuery = useAppointmentsByPatient(lookupMode === 'patient' ? lookupId : null, params);
  const doctorQuery = useAppointmentsByDoctor(lookupMode === 'doctor' ? lookupId : null, params);
  const clinicQuery = useAppointmentsByClinic(lookupMode === 'clinic' ? lookupId : null, params);
  const query =
    lookupMode === 'patient' ? patientQuery : lookupMode === 'doctor' ? doctorQuery : clinicQuery;
  const pageData = query.data?.data;
  const appointments = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    if (!keyword) return pageData?.content ?? [];
    return (pageData?.content ?? []).filter((appointment) =>
      [
        appointment.appointmentCode,
        appointment.patientName,
        appointment.doctorName,
        appointment.clinicName,
        appointment.serviceName,
      ].some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [filters.search, pageData?.content]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-1 text-sm text-gray-600">
              Look up appointments by patient, doctor, or clinic.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(ROUTES.APPOINTMENT_NEW)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Icon icon="lucide:plus" width={18} />
            Book appointment
          </button>
        </div>

        <section className="mb-5 border-y border-gray-200 bg-white py-5">
          <div className="mb-4 flex w-fit overflow-hidden rounded-md border border-gray-300">
            {(['patient', 'doctor', 'clinic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setLookupMode(mode);
                  setLookupId('');
                  setPage(0);
                }}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  lookupMode === mode ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isValidDateRange(filters.startDate, filters.endDate)) return;
              setLookupId(lookupInput.trim());
              setPage(0);
            }}
          >
            <input
              required
              value={lookupInput}
              onChange={(event) => setLookupInput(event.target.value)}
              placeholder={`Enter ${lookupMode} ID`}
              className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-semibold text-white"
            >
              <Icon icon="lucide:search" width={17} />
              Load appointments
            </button>
          </form>
          {!isValidDateRange(filters.startDate, filters.endDate) && (
            <p className="mt-2 text-sm text-red-600">The end date must be on or after the start date.</p>
          )}
        </section>

        <AppointmentFilters
          filters={filters}
          onFilterChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(0);
          }}
          onReset={() =>
            setFilters({ status: 'ALL', startDate: '', endDate: '', search: '' })
          }
        />

        <div className="mt-6">
          {!lookupId ? (
            <div className="border-y border-dashed border-gray-300 py-16 text-center text-gray-500">
              Enter an ID to load appointments.
            </div>
          ) : query.isLoading ? (
            <div className="py-16 text-center text-gray-500">Loading appointments...</div>
          ) : query.error ? (
            <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              Unable to load appointments. Verify the ID and try again.
            </div>
          ) : appointments.length === 0 ? (
            <div className="border-y border-dashed border-gray-300 py-16 text-center">
              <p className="font-medium text-gray-800">No appointments found</p>
              <p className="mt-1 text-sm text-gray-500">Try another status or date range.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.appointmentId}
                    appointment={appointment}
                    onView={() => router.push(ROUTES.APPOINTMENT_DETAIL(appointment.appointmentId))}
                    onEdit={() => router.push(ROUTES.APPOINTMENT_EDIT(appointment.appointmentId))}
                  />
                ))}
              </div>
              {(pageData?.totalPages ?? 0) > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {pageData?.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageData?.last}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
