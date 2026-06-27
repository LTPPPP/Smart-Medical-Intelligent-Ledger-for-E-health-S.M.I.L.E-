'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { ENV } from '@/shared/constants/env';
import { AppShell } from '@/shared/components/layout/AppShell';
import { toast } from '@/shared/lib/toast';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, doctorName, unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';

import { SymptomModal, type SymptomFormValues } from '@/features/examination/components/SymptomModal';
import { TreatmentPlanModal, type TreatmentPlanFormValues } from '@/features/examination/components/TreatmentPlanModal';
import {
  PrescriptionModal,
  PrescriptionItemModal,
  type PrescriptionFormValues,
  type PrescriptionItemFormValues,
} from '@/features/examination/components/PrescriptionModal';
import { DiagnosticOrderModal, type DiagnosticOrderFormValues } from '@/features/examination/components/DiagnosticOrderModal';
import { ClinicalOrderModal, type ClinicalOrderFormValues } from '@/features/examination/components/ClinicalOrderModal';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';
const GW = ENV.SERVICES.GATEWAY;

// ── types ────────────────────────────────────────────────────────────────
interface Session {
  session_id: string;
  patient_id?: string | null;
  record_id?: string | null;
  appointment_id?: string | null;
  doctor_id?: string | null;
  clinic_id?: string | null;
  status?: string;
  chief_complaint?: string | null;
  created_at?: string;
  session_date?: string;
}
interface Patient { patient_id: string; full_name?: string; patient_code?: string }
interface Symptom {
  symptom_id: string; symptom_name: string; body_location?: string | null; severity?: string | null;
  onset_date?: string | null; duration?: string | null; description?: string | null;
}
interface TreatmentPlan {
  plan_id: string; plan_name?: string | null; objectives?: string | null; duration_weeks?: number | null;
  status?: string | null; sent_at?: string | null;
}
interface Prescription { prescription_id: string; status?: string | null; notes?: string | null; prescription_date?: string | null; created_at?: string }
interface PrescriptionItem {
  item_id: string; medication_name: string; dosage?: string; frequency?: string;
  duration_days?: number | null; quantity?: number | null; instructions?: string | null; route?: string | null;
}
interface DiagnosticOrder {
  order_id: string; order_code?: string; order_type?: string; description?: string | null;
  priority?: string | null; tooth_number?: string | null; area?: string | null; status?: string | null;
}
interface ClinicalOrder {
  order_id: string; order_type?: string; test_type?: string; clinical_indication?: string | null;
  teeth_numbers?: number[] | null; urgency?: string | null; status?: string | null;
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

export default function ExaminationWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const actorId = currentUserId ?? DOCTORS[0]?.id ?? '';

  // ── session + patient ──
  const { data: sessRes, isLoading, isError } = useQuery({
    queryKey: ['examination', id],
    queryFn: () => apiClient.get(`${GW}/examination-sessions/${id}`),
    enabled: !!id,
  });
  const session = useMemo(() => unwrapOne<Session>(sessRes), [sessRes]);
  const patientId = session?.patient_id ?? '';

  const { data: patRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${GW}/patients`),
  });
  const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
  const patient = patients.find((p) => p.patient_id === patientId);
  const patientLabel = patient?.full_name ?? (patientId ? `Patient ${patientId.slice(0, 8)}` : '—');

  // ── symptoms (by session) ──
  const { data: sympRes } = useQuery({
    queryKey: ['examination', id, 'symptoms'],
    queryFn: () => apiClient.get(`${GW}/symptoms/session/${id}`),
    enabled: !!id,
  });
  const symptoms = useMemo(() => unwrapArr<Symptom>(sympRes), [sympRes]);

  // ── treatment plans (by patient) ──
  const { data: planRes } = useQuery({
    queryKey: ['examination', id, 'plans', patientId],
    queryFn: () => apiClient.get(`${GW}/treatment-plans/patient/${patientId}`),
    enabled: !!patientId,
  });
  const plans = useMemo(() => unwrapArr<TreatmentPlan>(planRes), [planRes]);

  // ── prescriptions (by patient) + items of selected prescription ──
  const { data: prescRes } = useQuery({
    queryKey: ['examination', id, 'prescriptions', patientId],
    queryFn: () => apiClient.get(`${GW}/prescriptions/patient/${patientId}`),
    enabled: !!patientId,
  });
  const prescriptions = useMemo(() => unwrapArr<Prescription>(prescRes), [prescRes]);
  const [activePrescriptionId, setActivePrescriptionId] = useState<string | null>(null);
  const selectedPrescriptionId = activePrescriptionId ?? prescriptions[0]?.prescription_id ?? null;

  const { data: itemsRes } = useQuery({
    queryKey: ['examination', id, 'prescription-items', selectedPrescriptionId],
    queryFn: () => apiClient.get(`${GW}/prescription-items/prescription/${selectedPrescriptionId}`),
    enabled: !!selectedPrescriptionId,
  });
  const items = useMemo(() => unwrapArr<PrescriptionItem>(itemsRes), [itemsRes]);

  // ── diagnostic orders (by patient) ──
  const { data: dxRes } = useQuery({
    queryKey: ['examination', id, 'diagnostic-orders', patientId],
    queryFn: () => apiClient.get(`${GW}/diagnostic-orders/patient/${patientId}`),
    enabled: !!patientId,
  });
  const diagnosticOrders = useMemo(() => unwrapArr<DiagnosticOrder>(dxRes), [dxRes]);

  // Diagnostic orders require a real appointment FK — source one from the patient's appointments.
  const { data: apptRes } = useQuery({
    queryKey: ['examination', id, 'appointments', patientId],
    queryFn: () => apiClient.get(`${GW}/appointments/patient/${patientId}`),
    enabled: !!patientId,
  });
  const patientAppointmentId = useMemo(() => {
    const list = unwrapArr<{ appointment_id: string }>(apptRes);
    return session?.appointment_id || list[0]?.appointment_id || '';
  }, [apptRes, session]);

  // ── clinical orders (by patient) ──
  const { data: coRes } = useQuery({
    queryKey: ['examination', id, 'clinical-orders', patientId],
    queryFn: () => apiClient.get(`${GW}/clinical-orders/patient/${patientId}`),
    enabled: !!patientId,
  });
  const clinicalOrders = useMemo(() => unwrapArr<ClinicalOrder>(coRes), [coRes]);

  const invalidate = (key: string, extra?: string) =>
    qc.invalidateQueries({ queryKey: extra ? ['examination', id, key, extra] : ['examination', id, key] });

  // ── modal state ──
  const [sympModal, setSympModal] = useState(false);
  const [editingSymp, setEditingSymp] = useState<Symptom | null>(null);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [prescModal, setPrescModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [dxModal, setDxModal] = useState(false);
  const [coModal, setCoModal] = useState(false);
  const [coDefaultType, setCoDefaultType] = useState('lab_test');

  // ── symptom mutations ──
  const createSymp = useMutation({
    mutationFn: (v: SymptomFormValues) =>
      apiClient.post(`${GW}/symptoms`, {
        session_id: id,
        patient_id: patientId || undefined,
        recorded_by: actorId,
        ...cleanDates(v),
      }),
    onSuccess: () => { toast.success('Symptom added'); invalidate('symptoms'); setSympModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add symptom'),
  });
  const updateSymp = useMutation({
    mutationFn: ({ sid, v }: { sid: string; v: SymptomFormValues }) =>
      apiClient.patch(`${GW}/symptoms/${sid}`, cleanDates(v)),
    onSuccess: () => { toast.success('Symptom updated'); invalidate('symptoms'); setSympModal(false); setEditingSymp(null); },
    onError: (e) => toast.apiError(e, 'Failed to update symptom'),
  });
  const deleteSymp = useMutation({
    mutationFn: (sid: string) => apiClient.delete(`${GW}/symptoms/${sid}`),
    onSuccess: () => { toast.success('Symptom deleted'); invalidate('symptoms'); },
    onError: (e) => toast.apiError(e, 'Failed to delete symptom'),
  });

  // ── treatment-plan mutations ──
  const createPlan = useMutation({
    mutationFn: (v: TreatmentPlanFormValues) =>
      apiClient.post(`${GW}/treatment-plans`, {
        patient_id: patientId,
        record_id: session?.record_id || undefined,
        created_by: actorId,
        ...v,
        duration_weeks: v.duration_weeks ?? undefined,
      }),
    onSuccess: () => { toast.success('Treatment plan created'); invalidate('plans', patientId); setPlanModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to create treatment plan'),
  });
  const updatePlan = useMutation({
    mutationFn: ({ pid, v }: { pid: string; v: TreatmentPlanFormValues }) =>
      apiClient.patch(`${GW}/treatment-plans/${pid}`, { ...v, duration_weeks: v.duration_weeks ?? undefined }),
    onSuccess: () => { toast.success('Treatment plan updated'); invalidate('plans', patientId); setPlanModal(false); setEditingPlan(null); },
    onError: (e) => toast.apiError(e, 'Failed to update treatment plan'),
  });
  const sendPlan = useMutation({
    mutationFn: (pid: string) =>
      apiClient.patch(`${GW}/treatment-plans/${pid}`, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to: patientId || undefined,
        sent_via: 'email',
      }),
    onSuccess: () => { toast.success('Treatment plan sent'); invalidate('plans', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to send treatment plan'),
  });
  const deletePlan = useMutation({
    mutationFn: (pid: string) => apiClient.delete(`${GW}/treatment-plans/${pid}`),
    onSuccess: () => { toast.success('Treatment plan deleted'); invalidate('plans', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to delete treatment plan'),
  });

  // ── prescription mutations ──
  const createPresc = useMutation({
    mutationFn: (v: PrescriptionFormValues) =>
      apiClient.post(`${GW}/prescriptions`, {
        patient_id: patientId,
        doctor_id: actorId,
        record_id: session?.record_id || undefined,
        ...v,
      }),
    onSuccess: (res) => {
      toast.success('Prescription created');
      invalidate('prescriptions', patientId);
      const created = unwrapOne<Prescription>(res);
      if (created?.prescription_id) setActivePrescriptionId(created.prescription_id);
      setPrescModal(false);
    },
    onError: (e) => toast.apiError(e, 'Failed to create prescription'),
  });
  const addItem = useMutation({
    mutationFn: (v: PrescriptionItemFormValues) =>
      apiClient.post(`${GW}/prescription-items`, {
        prescription_id: selectedPrescriptionId,
        ...v,
        duration_days: v.duration_days ?? undefined,
        quantity: v.quantity ?? undefined,
      }),
    onSuccess: () => { toast.success('Drug added'); invalidate('prescription-items', selectedPrescriptionId ?? undefined); setItemModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add drug'),
  });
  const deleteItem = useMutation({
    mutationFn: (itemId: string) => apiClient.delete(`${GW}/prescription-items/${itemId}`),
    onSuccess: () => { toast.success('Drug removed'); invalidate('prescription-items', selectedPrescriptionId ?? undefined); },
    onError: (e) => toast.apiError(e, 'Failed to remove drug'),
  });

  // ── diagnostic-order mutation ──
  const createDx = useMutation({
    mutationFn: (v: DiagnosticOrderFormValues) =>
      apiClient.post(`${GW}/diagnostic-orders`, {
        appointment_id: patientAppointmentId, // must reference a real appointment (FK)
        patient_id: patientId,
        doctor_id: actorId,
        order_type: v.order_type,
        description: v.description || undefined,
        priority: v.priority || undefined,
        tooth_number: v.tooth_number || undefined,
        area: v.area || undefined,
        notes: v.notes || undefined,
      }),
    onSuccess: () => { toast.success('Diagnostic order created'); invalidate('diagnostic-orders', patientId); setDxModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to create diagnostic order'),
  });

  // ── clinical-order mutation ──
  const createCo = useMutation({
    mutationFn: (v: ClinicalOrderFormValues) =>
      apiClient.post(`${GW}/clinical-orders`, {
        patient_id: patientId,
        ordered_by: actorId,
        record_id: session?.record_id || undefined,
        order_type: v.order_type,
        test_type: v.test_type,
        clinical_indication: v.clinical_indication || undefined,
        teeth_numbers: v.teeth_numbers,
        urgency: v.urgency || undefined,
        status: v.status || undefined,
      }),
    onSuccess: () => { toast.success('Clinical order created'); invalidate('clinical-orders', patientId); setCoModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to create clinical order'),
  });

  // ── render ──
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push('/examinations')} className="flex items-center gap-2 text-sm text-[#C1C7CF] transition hover:text-white">
          <Icon icon="lucide:arrow-left" width={16} /> Back to examinations
        </button>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-20 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading session…
          </div>
        )}
        {isError && !isLoading && (
          <div className={`${cardBase} p-10 text-center text-sm text-red-300`}>Failed to load session.</div>
        )}
        {!isLoading && !isError && !session && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>Session not found.</div>
        )}

        {session && (
          <>
            {/* Session header */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-[#323538]">
                  <Icon icon="lucide:clipboard-plus" width={24} style={{ color: BLUE }} />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h1 className="text-[24px] font-bold tracking-[-0.5px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                    Clinical Examination
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#C1C7CF]">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-semibold" style={{ color: TEAL }}>
                      {session.session_id.slice(0, 8)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#C1C7CF]">
                      {(session.status ?? 'in_progress').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#8B9199]">
                    <span><Icon icon="lucide:user" width={13} className="mb-0.5 mr-1 inline" />{patientLabel}</span>
                    <span><Icon icon="lucide:stethoscope" width={13} className="mb-0.5 mr-1 inline" />{doctorName(session.doctor_id ?? undefined)}</span>
                    <span><Icon icon="lucide:calendar" width={13} className="mb-0.5 mr-1 inline" />{fmtDate(session.created_at ?? session.session_date)}</span>
                  </div>
                  {session.chief_complaint && <p className="text-sm text-[#C1C7CF]"><span className="text-[#8B9199]">Chief complaint: </span>{session.chief_complaint}</p>}
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <Section
              title="Symptoms" count={symptoms.length} addLabel="Enter symptom"
              onAdd={() => { setEditingSymp(null); setSympModal(true); }}
              empty={symptoms.length === 0 ? 'No symptoms recorded.' : undefined}
            >
              {symptoms.map((s) => (
                <Row
                  key={s.symptom_id}
                  title={s.symptom_name}
                  badge={s.severity ?? undefined}
                  subtitle={[s.body_location, s.duration, fmtDateMaybe(s.onset_date)].filter(Boolean).join(' · ')}
                  description={s.description ?? undefined}
                  onEdit={() => { setEditingSymp(s); setSympModal(true); }}
                  onDelete={() => { if (confirm(`Delete symptom "${s.symptom_name}"?`)) deleteSymp.mutate(s.symptom_id); }}
                />
              ))}
            </Section>

            {/* Treatment Plans */}
            <Section
              title="Treatment Plans" count={plans.length} addLabel="Create plan"
              onAdd={() => { if (!patientId) { toast.warning('Session has no patient.'); return; } setEditingPlan(null); setPlanModal(true); }}
              empty={plans.length === 0 ? 'No treatment plans yet.' : undefined}
            >
              {plans.map((p) => {
                const sent = (p.status ?? '').toLowerCase() === 'sent';
                return (
                  <div key={p.plan_id} className="group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[rgba(29,32,35,0.5)] p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{p.plan_name || 'Treatment plan'}</span>
                        {p.status && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize text-[#C1C7CF]">{p.status}</span>}
                      </div>
                      <span className="text-xs text-[#8B9199]">
                        {p.duration_weeks != null ? `${p.duration_weeks} weeks` : '—'}
                        {p.sent_at ? ` · sent ${fmtDate(p.sent_at)}` : ''}
                      </span>
                      {p.objectives && <span className="text-xs text-[#C1C7CF]">{p.objectives}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => sendPlan.mutate(p.plan_id)}
                        disabled={sent || sendPlan.isPending}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25 disabled:opacity-50"
                      >
                        <Icon icon="lucide:send" width={13} /> {sent ? 'Sent' : 'Send'}
                      </button>
                      <RowActions
                        onEdit={() => { setEditingPlan(p); setPlanModal(true); }}
                        onDelete={() => { if (confirm(`Delete plan "${p.plan_name || ''}"?`)) deletePlan.mutate(p.plan_id); }}
                      />
                    </div>
                  </div>
                );
              })}
            </Section>

            {/* Prescription */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                  Prescription <span className="text-[#8B9199]">({prescriptions.length})</span>
                </h2>
                <button onClick={() => setPrescModal(true)} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE }}>
                  <Icon icon="lucide:plus" width={14} /> Create electronic prescription
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <p className="text-sm text-[#8B9199]">No prescriptions yet.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {prescriptions.map((pr) => {
                      const active = pr.prescription_id === selectedPrescriptionId;
                      return (
                        <button
                          key={pr.prescription_id}
                          onClick={() => setActivePrescriptionId(pr.prescription_id)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                          style={active
                            ? { background: 'rgba(69,240,207,0.15)', borderColor: 'rgba(69,240,207,0.3)', color: TEAL }
                            : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }}
                        >
                          {pr.prescription_id.slice(0, 8)} · {(pr.status ?? 'draft')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B9199]">
                      {selectedPrescriptionId ? `Drugs in ${selectedPrescriptionId.slice(0, 8)} (${items.length})` : 'Select a prescription'}
                    </span>
                    {selectedPrescriptionId && (
                      <button onClick={() => setItemModal(true)} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25">
                        <Icon icon="lucide:pill" width={13} /> Add drug
                      </button>
                    )}
                  </div>

                  {selectedPrescriptionId && items.length === 0 && (
                    <p className="text-sm text-[#8B9199]">No drugs in this prescription.</p>
                  )}
                  <div className="flex flex-col gap-3">
                    {items.map((it) => (
                      <Row
                        key={it.item_id}
                        title={it.medication_name}
                        subtitle={[it.dosage, it.frequency, it.route, it.duration_days != null ? `${it.duration_days} days` : '', it.quantity != null ? `qty ${it.quantity}` : ''].filter(Boolean).join(' · ')}
                        description={it.instructions ?? undefined}
                        onDelete={() => { if (confirm(`Remove "${it.medication_name}"?`)) deleteItem.mutate(it.item_id); }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Diagnostic Orders — X-ray/CBCT */}
            <Section
              title="Diagnostic Orders — X-ray / CBCT" count={diagnosticOrders.length} addLabel="Order X-ray / CBCT"
              onAdd={() => { if (!patientId) { toast.warning('Session has no patient.'); return; } setDxModal(true); }}
              empty={diagnosticOrders.length === 0 ? 'No imaging orders yet.' : undefined}
            >
              {diagnosticOrders.map((o) => (
                <Row
                  key={o.order_id}
                  title={`${(o.order_type ?? 'order').replace(/_/g, ' ').toUpperCase()}${o.order_code ? ` · ${o.order_code}` : ''}`}
                  badge={o.status ?? undefined}
                  subtitle={[o.priority, o.tooth_number ? `tooth ${o.tooth_number}` : '', o.area].filter(Boolean).join(' · ')}
                  description={o.description ?? undefined}
                />
              ))}
            </Section>

            {/* Clinical / Lab Orders */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                  Clinical / Lab Orders <span className="text-[#8B9199]">({clinicalOrders.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => { if (!patientId) { toast.warning('Session has no patient.'); return; } setCoDefaultType('lab_test'); setCoModal(true); }} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE }}>
                    <Icon icon="lucide:flask-conical" width={14} /> Order Lab Test
                  </button>
                  <button onClick={() => { if (!patientId) { toast.warning('Session has no patient.'); return; } setCoDefaultType('clinical_test'); setCoModal(true); }} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25">
                    <Icon icon="lucide:microscope" width={14} /> Order Clinical Test
                  </button>
                </div>
              </div>
              {clinicalOrders.length === 0 ? (
                <p className="text-sm text-[#8B9199]">No clinical or lab orders yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {clinicalOrders.map((o) => (
                    <Row
                      key={o.order_id}
                      title={`${(o.order_type ?? 'order').replace(/_/g, ' ')} · ${o.test_type ?? ''}`}
                      badge={o.status ?? undefined}
                      subtitle={[o.urgency, o.teeth_numbers?.length ? `teeth ${o.teeth_numbers.join(', ')}` : ''].filter(Boolean).join(' · ')}
                      description={o.clinical_indication ?? undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {sympModal && (
        <SymptomModal
          title={editingSymp ? 'Edit symptom' : 'Enter symptom'}
          submitting={createSymp.isPending || updateSymp.isPending}
          initial={editingSymp ? {
            symptom_name: editingSymp.symptom_name,
            body_location: editingSymp.body_location ?? '',
            severity: editingSymp.severity ?? '',
            onset_date: editingSymp.onset_date ? String(editingSymp.onset_date).slice(0, 10) : '',
            duration: editingSymp.duration ?? '',
            description: editingSymp.description ?? '',
          } : undefined}
          onClose={() => { setSympModal(false); setEditingSymp(null); }}
          onSubmit={(v) => (editingSymp ? updateSymp.mutate({ sid: editingSymp.symptom_id, v }) : createSymp.mutate(v))}
        />
      )}

      {planModal && (
        <TreatmentPlanModal
          title={editingPlan ? 'Edit treatment plan' : 'Create treatment plan'}
          submitting={createPlan.isPending || updatePlan.isPending}
          initial={editingPlan ? {
            plan_name: editingPlan.plan_name ?? '',
            objectives: editingPlan.objectives ?? '',
            duration_weeks: editingPlan.duration_weeks ?? null,
            status: editingPlan.status ?? 'active',
          } : undefined}
          onClose={() => { setPlanModal(false); setEditingPlan(null); }}
          onSubmit={(v) => (editingPlan ? updatePlan.mutate({ pid: editingPlan.plan_id, v }) : createPlan.mutate(v))}
        />
      )}

      {prescModal && (
        <PrescriptionModal
          title="Create electronic prescription"
          submitting={createPresc.isPending}
          onClose={() => setPrescModal(false)}
          onSubmit={(v) => createPresc.mutate(v)}
        />
      )}

      {itemModal && (
        <PrescriptionItemModal
          title="Add drug to prescription"
          submitting={addItem.isPending}
          onClose={() => setItemModal(false)}
          onSubmit={(v) => addItem.mutate(v)}
        />
      )}

      {dxModal && (
        <DiagnosticOrderModal
          title="Order X-ray / CBCT"
          submitting={createDx.isPending}
          onClose={() => setDxModal(false)}
          onSubmit={(v) => createDx.mutate(v)}
        />
      )}

      {coModal && (
        <ClinicalOrderModal
          title={coDefaultType === 'lab_test' ? 'Order Laboratory Test' : 'Order Clinical Test'}
          defaultOrderType={coDefaultType}
          submitting={createCo.isPending}
          onClose={() => setCoModal(false)}
          onSubmit={(v) => createCo.mutate(v)}
        />
      )}
    </AppShell>
  );
}

// ── helpers ──
function cleanDates(v: SymptomFormValues): SymptomFormValues {
  const out = { ...v };
  if (!out.onset_date) delete out.onset_date;
  if (!out.body_location) delete out.body_location;
  if (!out.severity) delete out.severity;
  if (!out.duration) delete out.duration;
  if (!out.description) delete out.description;
  return out;
}
const fmtDateMaybe = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '');

// ── presentational ──
function Section({
  title, count, addLabel = 'Add', onAdd, empty, children,
}: {
  title: string; count: number; addLabel?: string; onAdd: () => void; empty?: string; children: React.ReactNode;
}) {
  return (
    <div className={`${cardBase} flex flex-col gap-4 p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          {title} <span className="text-[#8B9199]">({count})</span>
        </h2>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE }}>
          <Icon icon="lucide:plus" width={14} /> {addLabel}
        </button>
      </div>
      {empty ? <p className="text-sm text-[#8B9199]">{empty}</p> : <div className="flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function Row({
  title, badge, subtitle, description, onEdit, onDelete,
}: {
  title: string; badge?: string; subtitle?: string; description?: string; onEdit?: () => void; onDelete?: () => void;
}) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[rgba(29,32,35,0.5)] p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize text-[#C1C7CF]">{badge}</span>}
        </div>
        {subtitle && <span className="text-xs text-[#8B9199]">{subtitle}</span>}
        {description && <span className="text-xs text-[#C1C7CF]">{description}</span>}
      </div>
      {(onEdit || onDelete) && <RowActions onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
      {onEdit && <button onClick={onEdit} className="rounded p-1 text-[#C1C7CF] transition hover:text-white"><Icon icon="lucide:pencil" width={14} /></button>}
      {onDelete && <button onClick={onDelete} className="rounded p-1 text-red-300 transition hover:text-red-200"><Icon icon="lucide:trash-2" width={14} /></button>}
    </div>
  );
}
