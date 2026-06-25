'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

const RED = '#f87171';

const inputCls =
  'rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(248,113,113,0.5)]';

export function CancelAppointmentModal({
  submitting,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A cancellation reason is required.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[20px] border border-white/[0.12] bg-[#16191c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Cancel Appointment
          </h3>
          <button onClick={onClose} className="text-[#C1C7CF] transition hover:text-white">
            <Icon icon="lucide:x" width={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#C1C7CF]">
          This will mark the appointment as cancelled. Please provide a reason.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">Reason</span>
            <textarea
              className={inputCls}
              rows={3}
              value={reason}
              placeholder="e.g. Patient requested reschedule"
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
            >
              Keep it
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/15 px-6 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/25 disabled:opacity-60"
              style={{ boxShadow: '0 0 15px rgba(248,113,113,0.2)' }}
            >
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} style={{ color: RED }} />}
              Cancel Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;
