'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import type { LeaveType } from '@/features/schedule/types/schedule.type';
import { isValidDateRange } from '@/shared/lib/validation';
import { ROUTES } from '@/shared/constants/routes';

export default function NewDoctorLeavePage() {
  const router = useRouter();
  const { createDoctorLeave } = useSchedule();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    doctorId: '',
    leaveType: 'ANNUAL' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if (form.startDate < today || !isValidDateRange(form.startDate, form.endDate)) {
      setError('Choose a valid current or future date range.');
      return;
    }
    if (form.reason.trim().length < 10) {
      setError('Reason must contain at least 10 characters.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await createDoctorLeave({ ...form, reason: form.reason.trim() });
      router.push(ROUTES.DOCTOR_LEAVES);
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
        <h1 className="text-2xl font-bold text-gray-900">Request doctor leave</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Submit a dated leave request for review.</p>
        <div className="space-y-4 border-y border-gray-200 bg-white py-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Doctor ID *</span>
            <input required value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Leave type *</span>
            <select value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value as LeaveType })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              {['ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'OTHER'].map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Start date *</span>
              <input required type="date" min={new Date().toISOString().split('T')[0]} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">End date *</span>
              <input required type="date" min={form.startDate || new Date().toISOString().split('T')[0]} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Reason *</span>
            <textarea required minLength={10} rows={4} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={isSubmitting} type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit request'}</button>
          </div>
        </div>
      </form>
    </main>
  );
}
