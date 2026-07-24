'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'emergency', label: 'Emergency' },
];

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createLeave, isCreatingLeave } = useSchedule();

  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.userId) {
      setError('You must be signed in to request leave.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    try {
      await createLeave({
        doctorId: user.userId,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      toast.success('Leave request submitted');
      router.push(ROUTES.DOCTOR_LEAVES);
    } catch (err) {
      toast.apiError(err, 'Failed to submit leave request');
    }
  };

  return (
    <div className="min-h-screen bg-[#E7ECEF]">
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Icon icon="mdi:calendar-plus" width={30} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Request Leave</h1>
              <p className="text-teal-100 text-sm mt-0.5">Submit a leave request for approval</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-6 space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Leave type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-800 outline-none focus:border-teal-500"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-800 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-800 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Brief reason for the leave request"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={ROUTES.DOCTOR_LEAVES}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isCreatingLeave}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-teal-600 text-white font-semibold rounded-xl shadow-md hover:bg-teal-700 transition-all text-sm disabled:opacity-50"
            >
              {isCreatingLeave && <Icon icon="line-md:loading-twotone-loop" width={16} />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
