'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, doctorName, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { toast } from '@/shared/lib/toast';

const modalWrap = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm';
const modalCard = 'w-full max-w-lg rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl';
const inputCls = 'h-11 w-full rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>{title}</h3>
      <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
    </div>
  );
}

// ── Notify Shift Transfer ────────────────────────────────────────────────────
export function TransferModal({
  scheduleId, fromDoctorId, onClose, onDone,
}: {
  scheduleId: string; fromDoctorId?: string; onClose: () => void; onDone: () => void;
}) {
  const { user } = useAuthStore();
  const [toDoctor, setToDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const targets = DOCTORS.filter((d) => d.id !== fromDoctorId);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post(API_ENDPOINTS.SCHEDULE.TRANSFER(scheduleId), {
        to_doctor_id: toDoctor,
        transferred_by: user?.userId,
        reason,
        notes: notes || undefined,
      }),
    onSuccess: () => { toast.success('Shift transferred — doctor notified'); onDone(); },
    onError: (e) => toast.apiError(e, 'Failed to transfer shift'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toDoctor) { setError('Select a doctor to transfer to.'); return; }
    if (!reason.trim()) { setError('Reason is required.'); return; }
    setError('');
    mutation.mutate();
  };

  return (
    <div className={modalWrap} onClick={onClose}>
      <div className={modalCard} onClick={(e) => e.stopPropagation()}>
        <Header title="Transfer shift" onClose={onClose} />
        <p className="mb-4 text-sm text-smile-description">
          Transfer this shift from <span className="font-semibold text-smile-primary">{doctorName(fromDoctorId)}</span> to another doctor.
          Both doctors will receive a notification.
        </p>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">Transfer to <span className="text-smile-primary">*</span></span>
            <select className={inputCls} value={toDoctor} onChange={(e) => setToDoctor(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select doctor…</option>
              {targets.map((d) => <option key={d.id} value={d.id} className="[background:var(--surface-input-bg)] text-smile-title">{d.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">Reason <span className="text-smile-primary">*</span></span>
            <input className={inputCls} value={reason} placeholder="e.g. Annual leave" onChange={(e) => setReason(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">Notes</span>
            <input className={inputCls} value={notes} placeholder="Optional" onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-white/25">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60">
              {mutation.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Notify Schedule Change (history) ─────────────────────────────────────────
interface ChangeRow {
  change_id?: string;
  change_type?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  changed_by?: string;
  created_at?: string;
}

export function ChangesModal({ scheduleId, onClose }: { scheduleId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['schedule', scheduleId, 'changes'],
    queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.CHANGES(scheduleId)),
  });
  const changes = useMemo(() => unwrapArr<ChangeRow>(data), [data]);

  return (
    <div className={modalWrap} onClick={onClose}>
      <div className={`${modalCard} max-w-xl`} onClick={(e) => e.stopPropagation()}>
        <Header title="Schedule change history" onClose={onClose} />
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-smile-description"><Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…</div>
        ) : changes.length === 0 ? (
          <p className="py-8 text-center text-sm text-smile-description">No changes recorded for this schedule yet.</p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            {changes.map((c, i) => (
              <div key={c.change_id ?? i} className="rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize text-smile-primary">{c.change_type ?? 'change'}</span>
                  <span className="text-xs text-smile-description">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
                </div>
                {c.reason && <p className="mt-1 text-sm text-smile-description">{c.reason}</p>}
                {c.changed_by && <p className="mt-1 text-xs text-smile-description">By: {doctorName(c.changed_by)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
