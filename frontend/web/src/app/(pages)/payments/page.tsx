'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { ROUTES } from '@/shared/constants/routes';

export default function PaymentsPage() {
  const router = useRouter();
  const [appointmentInput, setAppointmentInput] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const { useAppointmentById } = useAppointment();
  const { data, isLoading, error } = useAppointmentById(appointmentId || null);
  const appointment = data?.data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Check an appointment invoice and continue to secure payment.
          </p>
        </div>

        <form
          className="flex flex-col gap-3 border-y border-gray-200 bg-white py-5 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setAppointmentId(appointmentInput.trim());
          }}
        >
          <input
            required
            value={appointmentInput}
            onChange={(event) => setAppointmentInput(event.target.value)}
            placeholder="Appointment ID"
            className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-semibold text-white"
          >
            <Icon icon="lucide:search" width={17} />
            Find invoice
          </button>
        </form>

        <section className="mt-6">
          {!appointmentId ? (
            <div className="border-y border-dashed border-gray-300 py-16 text-center text-gray-500">
              Enter an appointment ID to view payment details.
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-gray-500">Loading payment details...</div>
          ) : error || !appointment ? (
            <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              Appointment not found or payment details are unavailable.
            </div>
          ) : (
            <div className="border border-gray-200 bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Appointment</p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    {appointment.appointmentCode}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">{appointment.serviceName}</p>
                </div>
                <span className="h-fit w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {appointment.paymentStatus ?? 'PENDING'}
                </span>
              </div>
              <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Patient</dt><dd className="mt-1 font-medium text-gray-900">{appointment.patientName}</dd></div>
                <div><dt className="text-gray-500">Clinic</dt><dd className="mt-1 font-medium text-gray-900">{appointment.clinicName}</dd></div>
                <div><dt className="text-gray-500">Date</dt><dd className="mt-1 font-medium text-gray-900">{appointment.appointmentDate} at {appointment.appointmentTime}</dd></div>
                <div><dt className="text-gray-500">Amount</dt><dd className="mt-1 text-lg font-bold text-gray-900">{appointment.estimatedPrice.toLocaleString()} VND</dd></div>
              </dl>
              <div className="flex flex-col gap-2 border-t border-gray-200 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.APPOINTMENT_DETAIL(appointment.appointmentId))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold"
                >
                  View appointment
                </button>
                {appointment.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.APPOINTMENT_PAYMENT(appointment.appointmentId))}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Pay now
                    <Icon icon="lucide:arrow-right" width={17} />
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
