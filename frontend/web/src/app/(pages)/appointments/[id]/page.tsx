'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CancelAppointmentModal } from '@/features/appointment/components/CancelAppointmentModal';
import { useAuthStore } from '@/features/auth/store/authStore';
import { unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#38BDF8';
const BLUE = '#92CDFD';
const cardBase =
  'rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

const DEFAULT_AMOUNT = 200000;

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-[#92CDFD]/15 text-[#92CDFD] border-[#92CDFD]/30',
  confirmed: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
  completed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  cancelled: 'bg-red-400/15 text-red-300 border-red-400/30',
  no_show: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
};
const PAY_STYLES: Record<string, string> = {
  paid: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  unpaid: 'bg-smile-primary-light text-smile-description border-smile-primary/15',
  refunded: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
};

interface Appointment {
  appointment_id: string;
  appointment_code: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  service_id?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  appointment_type?: string;
  status: string;
  chief_complaint?: string;
  payment_status: string;
  payment_id?: string;
  notes?: string;
}
interface Clinic {
  clinic_id: string;
  clinic_name: string;
}
interface ServiceRow {
  service_id: string;
  service_name: string;
  base_price?: number;
}
interface Payment {
  payment_id: string;
  amount?: number;
  status?: string;
  created_at?: string;
  payment_date?: string;
}

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        map[value] ?? 'bg-smile-primary-light text-smile-description border-smile-primary/15'
      }`}
    >
      {value?.replace('_', ' ')}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{label}</span>
      <span className="text-sm text-smile-title">{children}</span>
    </div>
  );
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: aptRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.DETAIL(id)),
    enabled: !!id,
  });
  const apt = useMemo(() => unwrapOne<Appointment>(aptRes), [aptRes]);

  const { data: clinicsRes } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
  });
  const { data: servicesRes } = useQuery({
    queryKey: ['services', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.SERVICE.LIST),
  });
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
  const services = useMemo(() => unwrapArr<ServiceRow>(servicesRes), [servicesRes]);

  const { data: paymentsRes, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', 'appointment', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.PAYMENT.BY_APPOINTMENT(id)),
    enabled: !!id,
  });
  const payments = useMemo(() => {
    const arr = unwrapArr<Payment>(paymentsRes);
    if (arr.length) return arr;
    const one = unwrapOne<Payment>(paymentsRes);
    return one && one.payment_id ? [one] : [];
  }, [paymentsRes]);

  const clinicName = clinics.find((c) => c.clinic_id === apt?.clinic_id)?.clinic_name ?? apt?.clinic_id ?? '—';
  const service = services.find((s) => s.service_id === apt?.service_id);
  const amount = service?.base_price ?? DEFAULT_AMOUNT;
  const doctorLabel = (doctorId?: string) => {
    if (!doctorId) return '—';
    if (doctorId === user?.userId) return user?.fullName ?? user?.email ?? 'Me';
    return `Doctor ${doctorId.slice(0, 8)}`;
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['appointment', id] });

  const confirmMut = useMutation({
    mutationFn: () => apiClient.patch(API_ENDPOINTS.APPOINTMENT.CONFIRM(id), { changed_by: user?.userId }),
    onSuccess: () => { toast.success('Appointment confirmed'); invalidate(); },
    onError: (e) => toast.apiError(e, 'Failed to confirm'),
  });
  const cancelMut = useMutation({
    mutationFn: (reason: string) =>
      apiClient.patch(API_ENDPOINTS.APPOINTMENT.CANCEL(id), {
        cancelled_by: user?.userId,
        cancellation_reason: reason,
      }),
    onSuccess: () => { toast.success('Appointment cancelled'); invalidate(); setCancelOpen(false); },
    onError: (e) => toast.apiError(e, 'Failed to cancel'),
  });
  const sendConfirmMut = useMutation({
    mutationFn: () => apiClient.post(API_ENDPOINTS.APPOINTMENT.SEND_CONFIRMATION(id), {}),
    onSuccess: () => toast.success('Confirmation sent'),
    onError: (e) => toast.apiError(e, 'Failed to send confirmation'),
  });
  const sendReminderMut = useMutation({
    mutationFn: () => apiClient.post(API_ENDPOINTS.APPOINTMENT.SEND_REMINDER(id), {}),
    onSuccess: () => toast.success('Reminder sent'),
    onError: (e) => toast.apiError(e, 'Failed to send reminder'),
  });
  const payMut = useMutation({
    mutationFn: () =>
      apiClient.post(API_ENDPOINTS.PAYMENT.INITIATE, {
        appointmentId: id,
        amount,
        orderInfo: `Payment for ${apt?.appointment_code ?? id}`,
      }),
    onSuccess: (res) => {
      const url = (res?.data as { data?: { paymentUrl?: string } })?.data?.paymentUrl;
      if (url) window.location.href = url;
      else toast.error('No payment URL returned');
    },
    onError: (e) => toast.apiError(e, 'Failed to start payment'),
  });
  const refundMut = useMutation({
    mutationFn: (paymentId: string) => apiClient.post(API_ENDPOINTS.PAYMENT.REFUND(paymentId), { reason: 'requested' }),
    onSuccess: () => { toast.success('Refund requested'); refetchPayments(); invalidate(); },
    onError: (e) => toast.apiError(e, 'Failed to refund'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-8 py-10">
        <div className="flex items-center justify-between">
          <Link href={ROUTES.APPOINTMENTS} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-title">
            <Icon icon="lucide:arrow-left" width={16} /> Back to appointments
          </Link>
          {apt && (
            <Link
              href={ROUTES.APPOINTMENT_EDIT(apt.appointment_id)}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
            >
              <Icon icon="lucide:pencil" width={15} /> Edit
            </Link>
          )}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading appointment…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load appointment.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && !apt && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>Appointment not found.</div>
        )}

        {apt && (
          <>
            {/* Header card */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold" style={{ color: TEAL }}>{apt.appointment_code}</p>
                  <h1 className="mt-1 font-poppins text-[26px] font-bold tracking-[-0.5px] text-smile-title">
                    {apt.appointment_date} · {apt.appointment_time?.slice(0, 5)}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={apt.status} map={STATUS_STYLES} />
                  <Badge value={apt.payment_status} map={PAY_STYLES} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-2 [border-color:var(--surface-panel-border)]">
                <Row label="Doctor">{doctorLabel(apt.doctor_id)}</Row>
                <Row label="Clinic">{clinicName}</Row>
                <Row label="Service">{service?.service_name ?? apt.service_id ?? '—'}</Row>
                <Row label="Type">{apt.appointment_type ?? '—'}</Row>
                <Row label="Chief complaint">{apt.chief_complaint || '—'}</Row>
                <Row label="Notes">{apt.notes || '—'}</Row>
              </div>
            </div>

            {/* Actions */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
                <h2 className="text-sm font-semibold uppercase tracking-[1px] text-smile-description">Actions</h2>
              <div className="flex flex-wrap gap-3">
                {apt.status === 'scheduled' && (
                  <button
                    onClick={() => confirmMut.mutate()}
                    disabled={confirmMut.isPending}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
                    style={{ background: TEAL, boxShadow: '0 0 15px rgba(56, 189, 248,0.3)' }}
                  >
                    {confirmMut.isPending ? <Icon icon="line-md:loading-twotone-loop" width={16} /> : <Icon icon="lucide:check" width={16} />}
                    Confirm
                  </button>
                )}
                <button
                  onClick={() => sendConfirmMut.mutate()}
                  disabled={sendConfirmMut.isPending}
                  className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-60 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
                >
                  <Icon icon="lucide:mail-check" width={15} /> Send Confirmation
                </button>
                <button
                  onClick={() => sendReminderMut.mutate()}
                  disabled={sendReminderMut.isPending}
                  className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-60 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
                >
                  <Icon icon="lucide:bell" width={15} /> Send Reminder
                </button>
                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                  >
                    <Icon icon="lucide:x-circle" width={15} /> Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[1px] text-smile-description">Payment</h2>
                <Badge value={apt.payment_status} map={PAY_STYLES} />
              </div>

              {apt.payment_status === 'unpaid' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
                  <div>
                    <p className="text-sm text-smile-description">Amount due</p>
                    <p className="text-lg font-bold text-smile-title">{amount.toLocaleString()} VND</p>
                  </div>
                  <button
                    onClick={() => payMut.mutate()}
                    disabled={payMut.isPending}
                    className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
                    style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
                  >
                    {payMut.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Pay now
                  </button>
                </div>
              )}

              {payments.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border [border-color:var(--surface-panel-border)]">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase tracking-wide text-smile-description [border-color:var(--surface-panel-border)]">
                      <tr>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.payment_id} className="border-b last:border-0 [border-color:var(--surface-panel-border)]">
                          <td className="px-4 py-3 text-smile-title">{(p.amount ?? 0).toLocaleString()} VND</td>
                          <td className="px-4 py-3"><Badge value={p.status ?? 'unpaid'} map={PAY_STYLES} /></td>
                          <td className="px-4 py-3 text-smile-description">{p.payment_date ?? p.created_at ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {p.status === 'paid' && (
                              <button
                                onClick={() => refundMut.mutate(p.payment_id)}
                                disabled={refundMut.isPending}
                                className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-60"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                apt.payment_status !== 'unpaid' && (
                  <p className="text-sm text-smile-description">No payment records.</p>
                )
              )}
            </div>
          </>
        )}
      </div>

      {cancelOpen && (
        <CancelAppointmentModal
          submitting={cancelMut.isPending}
          onSubmit={(reason) => cancelMut.mutate(reason)}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </AppShell>
  );
}
