'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { AppointmentCard } from '@/features/appointment/components/AppointmentCard';
import { AppointmentFilters } from '@/features/appointment/components/AppointmentFilters';
import type { AppointmentStatus } from '@/features/appointment/constants/appointment.constant';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { DEMO_IDS, demoAppointments } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';
import { isValidDateRange } from '@/shared/lib/validation';

type LookupMode = 'patient' | 'doctor' | 'clinic';

export default function AppointmentsPage() {
  const router = useRouter();
  const [lookupMode, setLookupMode] = useState<LookupMode>('patient');
  const [lookupInput, setLookupInput] = useState(DEMO_IDS.patient);
  const [lookupId, setLookupId] = useState(DEMO_IDS.patient);
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
  const pageData = toPage(query.data?.data, demoAppointments, page, 12);
  const appointments = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    if (!keyword) return pageData.content;
    return pageData.content.filter((appointment) =>
      [
        appointment.appointmentCode,
        appointment.patientName,
        appointment.doctorName,
        appointment.clinicName,
        appointment.serviceName,
      ].some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [filters.search, pageData?.content]);

  const confirmed = appointments.filter((item) => item.status === 'CONFIRMED').length;
  const scheduled = appointments.filter((item) => item.status === 'SCHEDULED').length;
  const unpaid = appointments.filter((item) => item.paymentStatus !== 'PAID').length;

  return (
    <OperationsLayout
      title="Appointments"
      description="Coordinate bookings, patient check-in, clinical handoff, and payment status from one operational queue."
      icon="lucide:calendar-clock"
      actions={[
        { label: 'Book appointment', href: ROUTES.APPOINTMENT_NEW, icon: 'lucide:plus', variant: 'primary' },
        { label: 'Payments', href: ROUTES.PAYMENTS, icon: 'lucide:credit-card' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Loaded" value={appointments.length} detail="Appointments in view" tone="brand" />
        <MetricCard label="Confirmed" value={confirmed} detail="Ready for visit" tone="green" />
        <MetricCard label="Scheduled" value={scheduled} detail="Awaiting confirmation" tone="blue" />
        <MetricCard label="Payment" value={unpaid} detail="Open balances" tone="orange" />
      </div>

      <section className="mt-5 border border-smile-border/50 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-fit">
            <p className="mb-2 text-xs font-semibold uppercase text-smile-description">Lookup by</p>
            <div className="flex w-fit overflow-hidden rounded-md border border-smile-border/50">
            {(['patient', 'doctor', 'clinic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setLookupMode(mode);
                  setLookupId('');
                  setPage(0);
                }}
                className={`px-4 py-2 text-sm font-semibold capitalize ${
                  lookupMode === mode ? 'bg-smile-primary text-white' : 'bg-white text-smile-title hover:bg-smile-footer-bg'
                }`}
              >
                {mode}
              </button>
            ))}
            </div>
          </div>
          <form
            className="flex flex-1 flex-col gap-3 sm:flex-row"
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
              className="h-10 flex-1 rounded-md border border-smile-border px-3 text-sm outline-none focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-smile-primary-dark px-5 text-sm font-semibold text-white"
            >
              <Icon icon="lucide:search" width={17} />
              Load appointments
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              const nextId =
                lookupMode === 'doctor'
                  ? DEMO_IDS.doctor
                  : lookupMode === 'clinic'
                    ? DEMO_IDS.clinic
                    : DEMO_IDS.patient;
              setLookupInput(nextId);
              setLookupId(nextId);
              setPage(0);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-smile-border/50 bg-white px-3 text-sm font-semibold text-smile-title hover:bg-smile-footer-bg"
          >
            <Icon icon="lucide:sparkles" width={16} />
            Use demo ID
          </button>
        </div>
          {!isValidDateRange(filters.startDate, filters.endDate) && (
          <p className="mt-2 text-sm text-red-600">The end date must be on or after the start date.</p>
          )}
      </section>

      <div className="mt-5">
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
      </div>

      <div className="mt-5">
          {!lookupId ? (
          <div className="border-y border-dashed border-smile-border py-16 text-center text-smile-description">
              Enter an ID to load appointments.
            </div>
          ) : query.isLoading ? (
          <div className="py-16 text-center text-smile-description">Loading appointments...</div>
          ) : appointments.length === 0 ? (
          <div className="border-y border-dashed border-smile-border py-16 text-center">
            <p className="font-medium text-smile-title">No appointments found</p>
            <p className="mt-1 text-sm text-smile-description">Try another status or date range.</p>
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
                    className="rounded-md border border-smile-border px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-smile-title">
                    Page {page + 1} of {pageData?.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageData?.last}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-md border border-smile-border px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </OperationsLayout>
  );
}
