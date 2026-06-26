'use client';

import { useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import type { ClinicalOrderFormValues } from '@/features/examination/components/ClinicalOrderModal';
import type { DiagnosticOrderFormValues } from '@/features/examination/components/DiagnosticOrderModal';
import type {
  PrescriptionFormValues,
  PrescriptionItemFormValues,
} from '@/features/examination/components/PrescriptionModal';
import type { SymptomFormValues } from '@/features/examination/components/SymptomModal';
import type { TreatmentPlanFormValues } from '@/features/examination/components/TreatmentPlanModal';
import { DOCTORS, doctorName, unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl';
const inputCls =
  'h-11 w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';
const areaCls =
  'min-h-[88px] w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';
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

  // ── inline form state ──
  const [symptomForm, setSymptomForm] = useState<SymptomFormValues>({
    symptom_name: '',
    body_location: '',
    severity: '',
    onset_date: '',
    duration: '',
    description: '',
  });
  const [planForm, setPlanForm] = useState<TreatmentPlanFormValues>({
    plan_name: '',
    objectives: '',
    duration_weeks: null,
    status: 'active',
  });
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormValues>({
    prescription_date: new Date().toISOString().slice(0, 10),
    status: 'draft',
    notes: '',
  });
  const [itemForm, setItemForm] = useState<PrescriptionItemFormValues>({
    medication_name: '',
    medication_code: '',
    dosage: '',
    route: '',
    frequency: '',
    duration_days: null,
    quantity: null,
    instructions: '',
  });
  const [diagnosticForm, setDiagnosticForm] = useState<DiagnosticOrderFormValues>({
    order_type: 'x_ray',
    priority: 'routine',
    tooth_number: '',
    area: '',
    description: '',
    notes: '',
  });
  const [clinicalForm, setClinicalForm] = useState<ClinicalOrderFormValues>({
    order_type: 'lab_test',
    test_type: '',
    clinical_indication: '',
    urgency: 'routine',
    status: 'ordered',
  });
  const [clinicalTeethRaw, setClinicalTeethRaw] = useState('');
  const [formError, setFormError] = useState('');

  // ── symptom mutations ──
  const createSymp = useMutation({
    mutationFn: (v: SymptomFormValues) =>
      apiClient.post(`${GW}/symptoms`, {
        session_id: id,
        patient_id: patientId || undefined,
        recorded_by: actorId,
        ...cleanDates(v),
      }),
    onSuccess: () => {
      toast.success('Symptom added');
      invalidate('symptoms');
      setSymptomForm({ symptom_name: '', body_location: '', severity: '', onset_date: '', duration: '', description: '' });
      setFormError('');
    },
    onError: (e) => toast.apiError(e, 'Failed to add symptom'),
  });
  const updateSymp = useMutation({
    mutationFn: ({ sid, v }: { sid: string; v: SymptomFormValues }) =>
      apiClient.patch(`${GW}/symptoms/${sid}`, cleanDates(v)),
    onSuccess: () => { toast.success('Symptom updated'); invalidate('symptoms'); },
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
    onSuccess: () => {
      toast.success('Treatment plan created');
      invalidate('plans', patientId);
      setPlanForm({ plan_name: '', objectives: '', duration_weeks: null, status: 'active' });
      setFormError('');
    },
    onError: (e) => toast.apiError(e, 'Failed to create treatment plan'),
  });
  const updatePlan = useMutation({
    mutationFn: ({ pid, v }: { pid: string; v: TreatmentPlanFormValues }) =>
      apiClient.patch(`${GW}/treatment-plans/${pid}`, { ...v, duration_weeks: v.duration_weeks ?? undefined }),
    onSuccess: () => { toast.success('Treatment plan updated'); invalidate('plans', patientId); },
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
      setPrescriptionForm({ prescription_date: new Date().toISOString().slice(0, 10), status: 'draft', notes: '' });
      setFormError('');
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
    onSuccess: () => {
      toast.success('Drug added');
      invalidate('prescription-items', selectedPrescriptionId ?? undefined);
      setItemForm({ medication_name: '', medication_code: '', dosage: '', route: '', frequency: '', duration_days: null, quantity: null, instructions: '' });
      setFormError('');
    },
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
    onSuccess: () => {
      toast.success('Diagnostic order created');
      invalidate('diagnostic-orders', patientId);
      setDiagnosticForm({ order_type: 'x_ray', priority: 'routine', tooth_number: '', area: '', description: '', notes: '' });
      setFormError('');
    },
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
    onSuccess: () => {
      toast.success('Clinical order created');
      invalidate('clinical-orders', patientId);
      setClinicalForm({ order_type: 'lab_test', test_type: '', clinical_indication: '', urgency: 'routine', status: 'ordered' });
      setClinicalTeethRaw('');
      setFormError('');
    },
    onError: (e) => toast.apiError(e, 'Failed to create clinical order'),
  });

  const requirePatient = () => {
    if (patientId) return true;
    toast.warning('Session has no patient.');
    return false;
  };

  const submitSymptom = (event: React.FormEvent) => {
    event.preventDefault();
    if (!symptomForm.symptom_name.trim()) {
      setFormError('Symptom name is required.');
      return;
    }
    setFormError('');
    createSymp.mutate(symptomForm);
  };

  const submitPlan = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirePatient()) return;
    if (!planForm.plan_name?.trim()) {
      setFormError('Plan name is required.');
      return;
    }
    setFormError('');
    createPlan.mutate(planForm);
  };

  const submitPrescription = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirePatient()) return;
    setFormError('');
    createPresc.mutate(prescriptionForm);
  };

  const submitDrug = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPrescriptionId) {
      setFormError('Create or select a prescription before adding medication.');
      return;
    }
    if (!itemForm.medication_name.trim() || !itemForm.dosage.trim() || !itemForm.frequency.trim()) {
      setFormError('Medication name, dosage and frequency are required.');
      return;
    }
    setFormError('');
    addItem.mutate(itemForm);
  };

  const submitDiagnosticOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirePatient()) return;
    if (!diagnosticForm.order_type) {
      setFormError('Diagnostic order type is required.');
      return;
    }
    setFormError('');
    createDx.mutate(diagnosticForm);
  };

  const submitClinicalOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirePatient()) return;
    if (!clinicalForm.order_type || !clinicalForm.test_type.trim()) {
      setFormError('Order type and test type are required.');
      return;
    }
    const teeth = clinicalTeethRaw
      .split(/[,\s]+/)
      .map((tooth) => Number(tooth.trim()))
      .filter((tooth) => Number.isInteger(tooth) && tooth > 0);
    setFormError('');
    createCo.mutate({ ...clinicalForm, teeth_numbers: teeth.length ? teeth : undefined });
  };

  // ── render ──
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push('/examinations')} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
          <Icon icon="lucide:arrow-left" width={16} /> Back to examinations
        </button>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-20 text-smile-description`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading session…
          </div>
        )}
        {isError && !isLoading && (
          <div className={`${cardBase} p-10 text-center text-sm text-red-300`}>Failed to load session.</div>
        )}
        {!isLoading && !isError && !session && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>Session not found.</div>
        )}

        {session && (
          <>
            {/* Session header */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
                  <Icon icon="lucide:clipboard-plus" width={24} className="text-smile-primary" />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h1 className="text-[24px] font-bold tracking-[-0.5px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                    Clinical Examination
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-smile-description">
                    <span className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-0.5 font-mono text-xs font-semibold text-smile-primary">
                      {session.session_id.slice(0, 8)}
                    </span>
                    <span className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-0.5 text-xs font-semibold capitalize text-smile-description">
                      {(session.status ?? 'in_progress').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-smile-description">
                    <span><Icon icon="lucide:user" width={13} className="mb-0.5 mr-1 inline" />{patientLabel}</span>
                    <span><Icon icon="lucide:stethoscope" width={13} className="mb-0.5 mr-1 inline" />{doctorName(session.doctor_id ?? undefined)}</span>
                    <span><Icon icon="lucide:calendar" width={13} className="mb-0.5 mr-1 inline" />{fmtDate(session.created_at ?? session.session_date)}</span>
                  </div>
                  {session.chief_complaint && <p className="text-sm text-smile-description"><span className="text-smile-description">Chief complaint: </span>{session.chief_complaint}</p>}
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}

            {/* Symptoms */}
            <Section
              title="Symptoms" count={symptoms.length}
              empty={symptoms.length === 0 ? 'No symptoms recorded.' : undefined}
            >
              <InlinePanel title="Record symptom" onSubmit={submitSymptom} submitting={createSymp.isPending} submitLabel="Save symptom">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InlineField label="Symptom name">
                    <input className={inputCls} value={symptomForm.symptom_name} placeholder="Toothache" onChange={(event) => setSymptomForm((form) => ({ ...form, symptom_name: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Body location">
                    <input className={inputCls} value={symptomForm.body_location ?? ''} placeholder="Lower left molar" onChange={(event) => setSymptomForm((form) => ({ ...form, body_location: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Severity">
                    <select className={inputCls} value={symptomForm.severity ?? ''} onChange={(event) => setSymptomForm((form) => ({ ...form, severity: event.target.value }))}>
                      {['', 'mild', 'moderate', 'severe'].map((severity) => (
                        <option key={severity || 'none'} value={severity} className="[background:var(--surface-input-bg)] text-smile-title">{severity || 'None'}</option>
                      ))}
                    </select>
                  </InlineField>
                  <InlineField label="Onset date">
                    <input type="date" className={inputCls} value={symptomForm.onset_date ?? ''} onChange={(event) => setSymptomForm((form) => ({ ...form, onset_date: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Duration">
                    <input className={inputCls} value={symptomForm.duration ?? ''} placeholder="3 days" onChange={(event) => setSymptomForm((form) => ({ ...form, duration: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Description">
                    <input className={inputCls} value={symptomForm.description ?? ''} placeholder="Additional details" onChange={(event) => setSymptomForm((form) => ({ ...form, description: event.target.value }))} />
                  </InlineField>
                </div>
              </InlinePanel>
              {symptoms.map((s) => (
                <Row
                  key={s.symptom_id}
                  title={s.symptom_name}
                  badge={s.severity ?? undefined}
                  subtitle={[s.body_location, s.duration, fmtDateMaybe(s.onset_date)].filter(Boolean).join(' · ')}
                  description={s.description ?? undefined}
                  onDelete={() => { if (confirm(`Delete symptom "${s.symptom_name}"?`)) deleteSymp.mutate(s.symptom_id); }}
                />
              ))}
            </Section>

            {/* Treatment Plans */}
            <Section
              title="Treatment Plans" count={plans.length}
              empty={plans.length === 0 ? 'No treatment plans yet.' : undefined}
            >
              <InlinePanel title="Create treatment plan" onSubmit={submitPlan} submitting={createPlan.isPending} submitLabel="Create plan">
                <InlineField label="Plan name">
                  <input className={inputCls} value={planForm.plan_name ?? ''} placeholder="Initial dental treatment plan" onChange={(event) => setPlanForm((form) => ({ ...form, plan_name: event.target.value }))} />
                </InlineField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InlineField label="Duration (weeks)">
                    <input type="number" min={0} className={inputCls} value={planForm.duration_weeks ?? ''} onChange={(event) => setPlanForm((form) => ({ ...form, duration_weeks: event.target.value ? Number(event.target.value) : null }))} />
                  </InlineField>
                  <InlineField label="Status">
                    <select className={inputCls} value={planForm.status ?? 'active'} onChange={(event) => setPlanForm((form) => ({ ...form, status: event.target.value }))}>
                      {['active', 'draft', 'completed', 'cancelled'].map((status) => (
                        <option key={status} value={status} className="[background:var(--surface-input-bg)] text-smile-title">{status}</option>
                      ))}
                    </select>
                  </InlineField>
                </div>
                <InlineField label="Objectives">
                  <textarea className={areaCls} value={planForm.objectives ?? ''} placeholder="Goals of the treatment plan" onChange={(event) => setPlanForm((form) => ({ ...form, objectives: event.target.value }))} />
                </InlineField>
              </InlinePanel>
              {plans.map((p) => {
                const sent = (p.status ?? '').toLowerCase() === 'sent';
                return (
                  <div key={p.plan_id} className="group flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-smile-title">{p.plan_name || 'Treatment plan'}</span>
                        {p.status && <span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-[11px] capitalize text-smile-description">{p.status}</span>}
                      </div>
                      <span className="text-xs text-smile-description">
                        {p.duration_weeks != null ? `${p.duration_weeks} weeks` : '—'}
                        {p.sent_at ? ` · sent ${fmtDate(p.sent_at)}` : ''}
                      </span>
                      {p.objectives && <span className="text-xs text-smile-description">{p.objectives}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => sendPlan.mutate(p.plan_id)}
                        disabled={sent || sendPlan.isPending}
                        className="flex items-center gap-1 rounded-lg border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-1 text-xs font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)] disabled:opacity-50"
                      >
                        <Icon icon="lucide:send" width={13} /> {sent ? 'Sent' : 'Send'}
                      </button>
                      <RowActions
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
                <h2 className="text-[16px] font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                  Prescription <span className="text-smile-description">({prescriptions.length})</span>
                </h2>
              </div>

              <InlinePanel title="Create electronic prescription" onSubmit={submitPrescription} submitting={createPresc.isPending} submitLabel="Create prescription">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InlineField label="Prescription date">
                    <input type="date" className={inputCls} value={prescriptionForm.prescription_date ?? ''} onChange={(event) => setPrescriptionForm((form) => ({ ...form, prescription_date: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Status">
                    <select className={inputCls} value={prescriptionForm.status ?? 'draft'} onChange={(event) => setPrescriptionForm((form) => ({ ...form, status: event.target.value }))}>
                      {['draft', 'active', 'completed', 'cancelled'].map((status) => (
                        <option key={status} value={status} className="[background:var(--surface-input-bg)] text-smile-title">{status}</option>
                      ))}
                    </select>
                  </InlineField>
                </div>
                <InlineField label="Notes">
                  <textarea className={areaCls} value={prescriptionForm.notes ?? ''} placeholder="Prescription notes" onChange={(event) => setPrescriptionForm((form) => ({ ...form, notes: event.target.value }))} />
                </InlineField>
              </InlinePanel>

              {prescriptions.length === 0 ? (
                <p className="text-sm text-smile-description">No prescriptions yet.</p>
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
                            ? { background: 'var(--color-smile-primary-light)', borderColor: 'var(--color-smile-primary)', color: 'var(--color-smile-primary)' }
                            : { background: 'var(--surface-panel-bg)', borderColor: 'var(--surface-panel-border)', color: 'var(--color-smile-description)' }}
                        >
                          {pr.prescription_id.slice(0, 8)} · {(pr.status ?? 'draft')}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-smile-description">
                    {selectedPrescriptionId ? `Drugs in ${selectedPrescriptionId.slice(0, 8)} (${items.length})` : 'Select a prescription'}
                  </span>

                  {selectedPrescriptionId && (
                    <InlinePanel title="Add medication" onSubmit={submitDrug} submitting={addItem.isPending} submitLabel="Add medication">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InlineField label="Medication name">
                          <input className={inputCls} value={itemForm.medication_name} placeholder="Amoxicillin" onChange={(event) => setItemForm((form) => ({ ...form, medication_name: event.target.value }))} />
                        </InlineField>
                        <InlineField label="Medication code">
                          <input className={inputCls} value={itemForm.medication_code ?? ''} placeholder="AMOX-500" onChange={(event) => setItemForm((form) => ({ ...form, medication_code: event.target.value }))} />
                        </InlineField>
                        <InlineField label="Dosage">
                          <input className={inputCls} value={itemForm.dosage} placeholder="500 mg" onChange={(event) => setItemForm((form) => ({ ...form, dosage: event.target.value }))} />
                        </InlineField>
                        <InlineField label="Frequency">
                          <input className={inputCls} value={itemForm.frequency} placeholder="3 times per day" onChange={(event) => setItemForm((form) => ({ ...form, frequency: event.target.value }))} />
                        </InlineField>
                        <InlineField label="Route">
                          <input className={inputCls} value={itemForm.route ?? ''} placeholder="Oral" onChange={(event) => setItemForm((form) => ({ ...form, route: event.target.value }))} />
                        </InlineField>
                        <InlineField label="Duration (days)">
                          <input type="number" min={0} className={inputCls} value={itemForm.duration_days ?? ''} onChange={(event) => setItemForm((form) => ({ ...form, duration_days: event.target.value ? Number(event.target.value) : null }))} />
                        </InlineField>
                        <InlineField label="Quantity">
                          <input type="number" min={0} className={inputCls} value={itemForm.quantity ?? ''} onChange={(event) => setItemForm((form) => ({ ...form, quantity: event.target.value ? Number(event.target.value) : null }))} />
                        </InlineField>
                      </div>
                      <InlineField label="Instructions">
                        <textarea className={areaCls} value={itemForm.instructions ?? ''} placeholder="Take after meals" onChange={(event) => setItemForm((form) => ({ ...form, instructions: event.target.value }))} />
                      </InlineField>
                    </InlinePanel>
                  )}

                  {selectedPrescriptionId && items.length === 0 && (
                    <p className="text-sm text-smile-description">No drugs in this prescription.</p>
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
              title="Diagnostic Orders - X-ray / CBCT" count={diagnosticOrders.length}
              empty={diagnosticOrders.length === 0 ? 'No imaging orders yet.' : undefined}
            >
              <InlinePanel title="Order imaging" onSubmit={submitDiagnosticOrder} submitting={createDx.isPending} submitLabel="Create order">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InlineField label="Order type">
                    <select className={inputCls} value={diagnosticForm.order_type} onChange={(event) => setDiagnosticForm((form) => ({ ...form, order_type: event.target.value }))}>
                      <option value="x_ray" className="[background:var(--surface-input-bg)] text-smile-title">X-ray</option>
                      <option value="cbct" className="[background:var(--surface-input-bg)] text-smile-title">CBCT</option>
                    </select>
                  </InlineField>
                  <InlineField label="Priority">
                    <select className={inputCls} value={diagnosticForm.priority ?? 'routine'} onChange={(event) => setDiagnosticForm((form) => ({ ...form, priority: event.target.value }))}>
                      {['routine', 'urgent', 'stat'].map((priority) => (
                        <option key={priority} value={priority} className="[background:var(--surface-input-bg)] text-smile-title">{priority}</option>
                      ))}
                    </select>
                  </InlineField>
                  <InlineField label="Tooth number">
                    <input className={inputCls} value={diagnosticForm.tooth_number ?? ''} placeholder="16" onChange={(event) => setDiagnosticForm((form) => ({ ...form, tooth_number: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Area">
                    <input className={inputCls} value={diagnosticForm.area ?? ''} placeholder="Lower-right quadrant" onChange={(event) => setDiagnosticForm((form) => ({ ...form, area: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Description">
                    <input className={inputCls} value={diagnosticForm.description ?? ''} placeholder="Periapical X-ray" onChange={(event) => setDiagnosticForm((form) => ({ ...form, description: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Notes">
                    <input className={inputCls} value={diagnosticForm.notes ?? ''} placeholder="Clinical context" onChange={(event) => setDiagnosticForm((form) => ({ ...form, notes: event.target.value }))} />
                  </InlineField>
                </div>
              </InlinePanel>
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
                <h2 className="text-[16px] font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                  Clinical / Lab Orders <span className="text-smile-description">({clinicalOrders.length})</span>
                </h2>
              </div>
              <InlinePanel title="Create clinical or lab order" onSubmit={submitClinicalOrder} submitting={createCo.isPending} submitLabel="Create order">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InlineField label="Order type">
                    <select className={inputCls} value={clinicalForm.order_type} onChange={(event) => setClinicalForm((form) => ({ ...form, order_type: event.target.value }))}>
                      <option value="lab_test" className="[background:var(--surface-input-bg)] text-smile-title">Laboratory test</option>
                      <option value="clinical_test" className="[background:var(--surface-input-bg)] text-smile-title">Clinical test</option>
                    </select>
                  </InlineField>
                  <InlineField label="Test type">
                    <input className={inputCls} value={clinicalForm.test_type} placeholder="CBC / Biopsy / Sensitivity" onChange={(event) => setClinicalForm((form) => ({ ...form, test_type: event.target.value }))} />
                  </InlineField>
                  <InlineField label="Urgency">
                    <select className={inputCls} value={clinicalForm.urgency ?? 'routine'} onChange={(event) => setClinicalForm((form) => ({ ...form, urgency: event.target.value }))}>
                      {['routine', 'urgent', 'stat'].map((urgency) => (
                        <option key={urgency} value={urgency} className="[background:var(--surface-input-bg)] text-smile-title">{urgency}</option>
                      ))}
                    </select>
                  </InlineField>
                  <InlineField label="Status">
                    <select className={inputCls} value={clinicalForm.status ?? 'ordered'} onChange={(event) => setClinicalForm((form) => ({ ...form, status: event.target.value }))}>
                      {['ordered', 'in_progress', 'completed', 'cancelled'].map((status) => (
                        <option key={status} value={status} className="[background:var(--surface-input-bg)] text-smile-title">{status}</option>
                      ))}
                    </select>
                  </InlineField>
                  <InlineField label="Teeth numbers">
                    <input className={inputCls} value={clinicalTeethRaw} placeholder="16, 17, 26" onChange={(event) => setClinicalTeethRaw(event.target.value)} />
                  </InlineField>
                </div>
                <InlineField label="Clinical indication">
                  <textarea className={areaCls} value={clinicalForm.clinical_indication ?? ''} placeholder="Reason for the test" onChange={(event) => setClinicalForm((form) => ({ ...form, clinical_indication: event.target.value }))} />
                </InlineField>
              </InlinePanel>
              {clinicalOrders.length === 0 ? (
                <p className="text-sm text-smile-description">No clinical or lab orders yet.</p>
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
function InlinePanel({
  title,
  submitLabel,
  submitting,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-smile-title">{title}</h3>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
        >
          {submitting && <Icon icon="line-md:loading-twotone-loop" width={14} />}
          {submitLabel}
        </button>
      </div>
      {children}
    </form>
  );
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-smile-description">{label}</span>
      {children}
    </label>
  );
}

function Section({
  title, count, empty, children,
}: {
  title: string; count: number; empty?: string; children: React.ReactNode;
}) {
  return (
    <div className={`${cardBase} flex flex-col gap-4 p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          {title} <span className="text-smile-description">({count})</span>
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {children}
        {empty && <p className="text-sm text-smile-description">{empty}</p>}
      </div>
    </div>
  );
}

function Row({
  title, badge, subtitle, description, onEdit, onDelete,
}: {
  title: string; badge?: string; subtitle?: string; description?: string; onEdit?: () => void; onDelete?: () => void;
}) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-smile-title">{title}</span>
          {badge && <span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-[11px] capitalize text-smile-description">{badge}</span>}
        </div>
        {subtitle && <span className="text-xs text-smile-description">{subtitle}</span>}
        {description && <span className="text-xs text-smile-description">{description}</span>}
      </div>
      {(onEdit || onDelete) && <RowActions onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
      {onEdit && <button onClick={onEdit} className="rounded p-1 text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:pencil" width={14} /></button>}
      {onDelete && <button onClick={onDelete} className="rounded p-1 text-red-300 transition hover:text-red-200"><Icon icon="lucide:trash-2" width={14} /></button>}
    </div>
  );
}
