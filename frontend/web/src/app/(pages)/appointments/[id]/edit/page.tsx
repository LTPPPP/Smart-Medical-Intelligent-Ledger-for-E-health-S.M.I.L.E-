'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';
import { unwrapOne } from '@/features/schedule/scheduleConstants';

const BLUE = '#92CDFD';
const TEAL = '#38BDF8';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';
const inputCls =
  'h-11 w-full rounded-xl border border-white/10 bg-[rgba(36, 56, 74,0.5)] px-4 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(146,205,253,0.5)]';

const STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

interface Appointment {
  appointment_id: string;
  appointment_code: string;
  appointment_date: string;
  appointment_time: string;
  chief_complaint?: string;
  notes?: string;
  status: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">{label}</span>
      {children}
    </label>
  );
}

export default function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: aptRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.DETAIL(id)),
    enabled: !!id,
  });
  const apt = useMemo(() => unwrapOne<Appointment>(aptRes), [aptRes]);

  const [form, setForm] = useState({
    appointment_date: '',
    appointment_time: '',
    chief_complaint: '',
    notes: '',
    status: 'scheduled',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (apt) {
      setForm({
        appointment_date: apt.appointment_date ?? '',
        appointment_time: apt.appointment_time?.slice(0, 5) ?? '',
        chief_complaint: apt.chief_complaint ?? '',
        notes: apt.notes ?? '',
        status: apt.status ?? 'scheduled',
      });
    }
  }, [apt]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const updateMut = useMutation({
    mutationFn: () => apiClient.patch(API_ENDPOINTS.APPOINTMENT.UPDATE(id), form),
    onSuccess: () => {
      toast.success('Appointment updated');
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      router.push(ROUTES.APPOINTMENT_DETAIL(id));
    },
    onError: (e) => toast.apiError(e, 'Failed to update appointment'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.appointment_date) return setError('Please pick a date.');
    if (!form.appointment_time) return setError('Please pick a time.');
    setError('');
    updateMut.mutate();
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
        <div className="flex items-center justify-between">
          <Link
            href={apt ? ROUTES.APPOINTMENT_DETAIL(id) : ROUTES.APPOINTMENTS}
            className="flex items-center gap-2 text-sm text-[#C1C7CF] transition hover:text-white"
          >
            <Icon icon="lucide:arrow-left" width={16} /> Back
          </Link>
        </div>

        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Edit Appointment
          </h1>
          {apt && (
            <p className="text-sm" style={{ color: TEAL }}>
              <span className="font-mono">{apt.appointment_code}</span>
            </p>
          )}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load appointment.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && apt && (
          <form onSubmit={submit} className={`${cardBase} flex flex-col gap-4 p-6`}>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
                <Icon icon="lucide:alert-circle" width={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input type="date" className={inputCls} value={form.appointment_date} onChange={(e) => set('appointment_date', e.target.value)} />
              </Field>
              <Field label="Time">
                <input type="time" className={inputCls} value={form.appointment_time} onChange={(e) => set('appointment_time', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#101922]">{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Chief complaint">
                <input className={inputCls} value={form.chief_complaint} placeholder="Reason for visit" onChange={(e) => set('chief_complaint', e.target.value)} />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                className="min-h-[96px] w-full rounded-xl border border-white/10 bg-[rgba(36, 56, 74,0.5)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(146,205,253,0.5)]"
                value={form.notes}
                placeholder="Additional notes"
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-3 pt-1">
              <Link
                href={ROUTES.APPOINTMENT_DETAIL(id)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
                style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
              >
                {updateMut.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
