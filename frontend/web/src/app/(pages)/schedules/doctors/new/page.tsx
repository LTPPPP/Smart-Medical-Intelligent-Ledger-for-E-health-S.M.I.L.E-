'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { isFutureDateTime, normalizeOptionalText } from '@/shared/lib/validation';
import { ROUTES } from '@/shared/constants/routes';

export default function NewDoctorSchedulePage() {
  const router = useRouter();
  const { createDoctorSchedule } = useSchedule();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    doctorId: '',
    clinicId: '',
    workShiftId: '',
    workDate: '',
    maxAppointments: 8,
    notes: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFutureDateTime(form.workDate, '23:59')) {
      setError('Work date cannot be in the past.');
      return;
    }
    if (form.maxAppointments < 1 || form.maxAppointments > 100) {
      setError('Maximum appointments must be between 1 and 100.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await createDoctorSchedule({
        ...form,
        notes: normalizeOptionalText(form.notes),
      });
      router.push(ROUTES.DOCTOR_SCHEDULES);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Icon icon="lucide:arrow-left" width={17} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New doctor schedule</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Assign a doctor to a clinic work shift.</p>
        <div className="space-y-4 border-y border-gray-200 bg-white py-6">
          {(
            [
              ['doctorId', 'Doctor ID'],
              ['clinicId', 'Clinic ID'],
              ['workShiftId', 'Work shift ID'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">{label} *</span>
              <input required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none" />
            </label>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Work date *</span>
              <input required type="date" min={new Date().toISOString().split('T')[0]} value={form.workDate} onChange={(event) => setForm({ ...form, workDate: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Maximum appointments *</span>
              <input required type="number" min={1} max={100} value={form.maxAppointments} onChange={(event) => setForm({ ...form, maxAppointments: Number(event.target.value) })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Notes</span>
            <textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={isSubmitting} type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create schedule'}</button>
          </div>
        </div>
      </form>
    </main>
  );
}
