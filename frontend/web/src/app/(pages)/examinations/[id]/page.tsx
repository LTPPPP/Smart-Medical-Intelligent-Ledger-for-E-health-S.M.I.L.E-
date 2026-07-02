'use client';

import { useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ClinicalOrderModal, type ClinicalOrderFormValues } from '@/features/examination/components/ClinicalOrderModal';
import { DiagnosticOrderModal, type DiagnosticOrderFormValues } from '@/features/examination/components/DiagnosticOrderModal';
import {
  PrescriptionModal,
  PrescriptionItemModal,
  type PrescriptionFormValues,
  type PrescriptionItemFormValues,
} from '@/features/examination/components/PrescriptionModal';
import { SymptomModal, type SymptomFormValues } from '@/features/examination/components/SymptomModal';
import { TreatmentPlanModal, type TreatmentPlanFormValues } from '@/features/examination/components/TreatmentPlanModal';
import {
  DENTAL_CHART_TOOTH_NUMBER_MESSAGE,
  getDentalChartFormBlocker,
  normalizeDentalChartToothNumber,
} from '@/features/examination/utils/dentalChartFlow';
import { getFinalizeEncounterBlocker } from '@/features/examination/utils/encounterFinalize';
import {
  filterByAppointmentScope,
  filterByEncounterScope,
} from '@/features/examination/utils/encounterScope';
import {
  canCreatePrescription,
  canModifyPrescriptionItems,
  normalizePrescriptionStatus,
} from '@/features/examination/utils/prescriptionFlow';
import { DOCTORS, doctorName, unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

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
  present_illness?: string | null;
  physical_examination?: string | null;
  completed_at?: string | null;
  signed_at?: string | null;
  signed_by?: string | null;
  created_at?: string;
  session_date?: string;
}
interface Patient { patient_id: string; full_name?: string; patient_code?: string }
interface Symptom {
  symptom_id: string; symptom_name: string; body_location?: string | null; severity?: string | null;
  onset_date?: string | null; duration?: string | null; description?: string | null;
}
interface Diagnosis {
  diagnosis_id: string; icd_code?: string | null; diagnosis_name: string;
  diagnosis_type?: string | null; severity?: string | null; notes?: string | null;
}
interface TreatmentPlan {
  plan_id: string; plan_name?: string | null; objectives?: string | null; duration_weeks?: number | null;
  status?: string | null; sent_at?: string | null; session_id?: string | null; record_id?: string | null;
  estimated_cost?: string | number | null; quote_currency?: string | null; proposed_at?: string | null;
  accepted_at?: string | null; accepted_by?: string | null; declined_at?: string | null; declined_by?: string | null;
  decline_reason?: string | null;
}
interface Prescription {
  prescription_id: string; session_id?: string | null; record_id?: string | null; status?: string | null; notes?: string | null; prescription_date?: string | null; created_at?: string;
  issued_at?: string | null; issued_by?: string | null; cancelled_at?: string | null; cancellation_reason?: string | null;
}
interface PrescriptionItem {
  item_id: string; medication_name: string; dosage?: string; frequency?: string;
  duration_days?: number | null; quantity?: number | null; instructions?: string | null; route?: string | null;
}
interface DiagnosticOrder {
  order_id: string; appointment_id?: string | null; order_code?: string; order_type?: string; description?: string | null;
  priority?: string | null; tooth_number?: string | null; area?: string | null; status?: string | null;
}
interface ClinicalOrder {
  order_id: string; session_id?: string | null; order_type?: string; test_type?: string; clinical_indication?: string | null;
  teeth_numbers?: number[] | null; urgency?: string | null; status?: string | null;
}
interface DentalChartEntry {
  chart_id: string; patient_id: string; record_id: string; tooth_number: number; tooth_status?: string | null;
  surfaces?: Record<string, unknown> | null; notes?: string | null;
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
  const isFinalized = ['completed', 'signed'].includes((session?.status ?? '').toLowerCase());

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

  // ── diagnoses (by session) ──
  const { data: diagRes } = useQuery({
    queryKey: ['examination', id, 'diagnoses'],
    queryFn: () => apiClient.get(`${GW}/diagnoses/session/${id}`),
    enabled: !!id,
  });
  const diagnoses = useMemo(() => unwrapArr<Diagnosis>(diagRes), [diagRes]);
  const finalizeBlocker = session
    ? getFinalizeEncounterBlocker({
      status: session.status,
      clinicalNotes: [
        session.chief_complaint,
        session.present_illness,
        session.physical_examination,
      ],
      diagnosisCount: diagnoses.length,
    })
    : 'Session is not loaded.';

  // ── treatment plans (by patient) ──
  const { data: planRes } = useQuery({
    queryKey: ['examination', id, 'plans', patientId],
    queryFn: () => apiClient.get(`${GW}/treatment-plans/patient/${patientId}`),
    enabled: !!patientId,
  });
  const plans = useMemo(
    () =>
      filterByEncounterScope(unwrapArr<TreatmentPlan>(planRes), {
        sessionId: id,
        recordId: session?.record_id,
      }),
    [id, planRes, session?.record_id],
  );

  // ── prescriptions (by patient) + items of selected prescription ──
  const { data: prescRes } = useQuery({
    queryKey: ['examination', id, 'prescriptions', patientId],
    queryFn: () => apiClient.get(`${GW}/prescriptions/patient/${patientId}`),
    enabled: !!patientId,
  });
  const prescriptions = useMemo(
    () =>
      filterByEncounterScope(unwrapArr<Prescription>(prescRes), {
        sessionId: id,
        recordId: session?.record_id,
      }),
    [id, prescRes, session?.record_id],
  );
  const [activePrescriptionId, setActivePrescriptionId] = useState<string | null>(null);
  const selectedPrescriptionId = activePrescriptionId ?? prescriptions[0]?.prescription_id ?? null;
  const selectedPrescription = prescriptions.find((pr) => pr.prescription_id === selectedPrescriptionId) ?? null;
  const selectedPrescriptionStatus = normalizePrescriptionStatus(selectedPrescription?.status);
  const canCreatePrescriptionNow = canCreatePrescription({ isFinalized, patientId });
  const canModifySelectedPrescriptionItems = canModifyPrescriptionItems({
    isFinalized,
    prescriptionId: selectedPrescriptionId,
    status: selectedPrescriptionStatus,
  });

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
  const diagnosticOrders = useMemo(
    () =>
      filterByAppointmentScope(
        unwrapArr<DiagnosticOrder>(dxRes),
        session?.appointment_id,
      ),
    [dxRes, session?.appointment_id],
  );

  const sessionAppointmentId = session?.appointment_id ?? '';

  // ── clinical orders (by patient) ──
  const { data: coRes } = useQuery({
    queryKey: ['examination', id, 'clinical-orders', patientId],
    queryFn: () => apiClient.get(`${GW}/clinical-orders/patient/${patientId}`),
    enabled: !!patientId,
  });
  const clinicalOrders = useMemo(
    () =>
      filterByEncounterScope(unwrapArr<ClinicalOrder>(coRes), {
        sessionId: id,
        recordId: session?.record_id,
      }),
    [coRes, id, session?.record_id],
  );

  // ── dental chart (by record) ──
  const { data: chartRes } = useQuery({
    queryKey: ['examination', id, 'dental-chart', session?.record_id],
    queryFn: () => apiClient.get(`${GW}/dental-charts/record/${session?.record_id}`),
    enabled: !!session?.record_id,
  });
  const dentalChartEntries = useMemo(
    () =>
      unwrapArr<DentalChartEntry>(chartRes).toSorted(
        (a, b) => a.tooth_number - b.tooth_number,
      ),
    [chartRes],
  );

  const invalidate = (key: string, extra?: string) =>
    qc.invalidateQueries({ queryKey: extra ? ['examination', id, key, extra] : ['examination', id, key] });

  // ── modal state ──
  const [sympModal, setSympModal] = useState(false);
  const [editingSymp, setEditingSymp] = useState<Symptom | null>(null);
  const [diagModal, setDiagModal] = useState(false);
  const [editingDiag, setEditingDiag] = useState<Diagnosis | null>(null);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [prescModal, setPrescModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [dxModal, setDxModal] = useState(false);
  const [coModal, setCoModal] = useState(false);
  const [coDefaultType, setCoDefaultType] = useState('lab_test');
  const [chartModal, setChartModal] = useState(false);
  const [editingChart, setEditingChart] = useState<DentalChartEntry | null>(null);

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

  // ── diagnosis mutations ──
  const createDiag = useMutation({
    mutationFn: (v: DiagnosisFormValues) =>
      apiClient.post(`${GW}/diagnoses`, {
        session_id: id,
        icd_code: v.icd_code || undefined,
        diagnosis_name: v.diagnosis_name,
        diagnosis_type: v.diagnosis_type || undefined,
        severity: v.severity || undefined,
        notes: v.notes || undefined,
      }),
    onSuccess: () => { toast.success('Diagnosis added'); invalidate('diagnoses'); setDiagModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add diagnosis'),
  });
  const updateDiag = useMutation({
    mutationFn: ({ did, v }: { did: string; v: DiagnosisFormValues }) =>
      apiClient.patch(`${GW}/diagnoses/${did}`, {
        icd_code: v.icd_code || undefined,
        diagnosis_name: v.diagnosis_name,
        diagnosis_type: v.diagnosis_type || undefined,
        severity: v.severity || undefined,
        notes: v.notes || undefined,
      }),
    onSuccess: () => { toast.success('Diagnosis updated'); invalidate('diagnoses'); setDiagModal(false); setEditingDiag(null); },
    onError: (e) => toast.apiError(e, 'Failed to update diagnosis'),
  });
  const deleteDiag = useMutation({
    mutationFn: (did: string) => apiClient.delete(`${GW}/diagnoses/${did}`),
    onSuccess: () => { toast.success('Diagnosis deleted'); invalidate('diagnoses'); },
    onError: (e) => toast.apiError(e, 'Failed to delete diagnosis'),
  });

  // ── treatment-plan mutations ──
  const createPlan = useMutation({
    mutationFn: (v: TreatmentPlanFormValues) =>
      apiClient.post(`${GW}/treatment-plans`, {
        session_id: id,
        patient_id: patientId,
        record_id: session?.record_id || undefined,
        created_by: actorId,
        plan_name: v.plan_name,
        objectives: v.objectives,
        duration_weeks: v.duration_weeks ?? undefined,
        estimated_cost: v.estimated_cost || undefined,
        quote_currency: v.quote_currency || 'VND',
      }),
    onSuccess: () => { toast.success('Treatment plan created'); invalidate('plans', patientId); setPlanModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to create treatment plan'),
  });
  const updatePlan = useMutation({
    mutationFn: ({ pid, v }: { pid: string; v: TreatmentPlanFormValues }) =>
      apiClient.patch(`${GW}/treatment-plans/${pid}`, {
        plan_name: v.plan_name,
        objectives: v.objectives,
        duration_weeks: v.duration_weeks ?? undefined,
        estimated_cost: v.estimated_cost || undefined,
        quote_currency: v.quote_currency || 'VND',
      }),
    onSuccess: () => { toast.success('Treatment plan updated'); invalidate('plans', patientId); setPlanModal(false); setEditingPlan(null); },
    onError: (e) => toast.apiError(e, 'Failed to update treatment plan'),
  });
  const proposePlan = useMutation({
    mutationFn: (pid: string) => apiClient.patch(`${GW}/treatment-plans/${pid}/propose`),
    onSuccess: () => { toast.success('Treatment plan proposed'); invalidate('plans', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to propose treatment plan'),
  });
  const acceptPlan = useMutation({
    mutationFn: (pid: string) => apiClient.patch(`${GW}/treatment-plans/${pid}/accept`, { accepted_by: actorId }),
    onSuccess: () => { toast.success('Treatment plan accepted'); invalidate('plans', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to accept treatment plan'),
  });
  const declinePlan = useMutation({
    mutationFn: ({ pid, reason }: { pid: string; reason?: string }) =>
      apiClient.patch(`${GW}/treatment-plans/${pid}/decline`, { declined_by: actorId, reason }),
    onSuccess: () => { toast.success('Treatment plan declined'); invalidate('plans', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to decline treatment plan'),
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
        session_id: id,
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
  const issuePresc = useMutation({
    mutationFn: (prescriptionId: string) => apiClient.patch(`${GW}/prescriptions/${prescriptionId}/issue`),
    onSuccess: () => { toast.success('Prescription issued'); invalidate('prescriptions', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to issue prescription'),
  });
  const cancelPresc = useMutation({
    mutationFn: ({ prescriptionId, reason }: { prescriptionId: string; reason: string }) =>
      apiClient.patch(`${GW}/prescriptions/${prescriptionId}/cancel`, { reason }),
    onSuccess: () => { toast.success('Prescription cancelled'); invalidate('prescriptions', patientId); },
    onError: (e) => toast.apiError(e, 'Failed to cancel prescription'),
  });

  // ── diagnostic-order mutation ──
  const createDx = useMutation({
    mutationFn: (v: DiagnosticOrderFormValues) =>
      apiClient.post(`${GW}/diagnostic-orders`, {
        appointment_id: sessionAppointmentId,
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
        session_id: id,
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

  // ── dental-chart mutations ──
  const createChart = useMutation({
    mutationFn: (v: DentalChartFormValues) =>
      apiClient.post(`${GW}/dental-charts`, {
        patient_id: patientId,
        record_id: session?.record_id,
        tooth_number: normalizeDentalChartToothNumber(v.tooth_number),
        tooth_status: v.tooth_status || undefined,
        notes: v.notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Dental chart entry added');
      invalidate('dental-chart', session?.record_id ?? undefined);
      setChartModal(false);
    },
    onError: (e) => toast.apiError(e, 'Failed to add dental chart entry'),
  });
  const updateChart = useMutation({
    mutationFn: ({ chartId, v }: { chartId: string; v: DentalChartFormValues }) =>
      apiClient.patch(`${GW}/dental-charts/${chartId}`, {
        tooth_status: v.tooth_status || undefined,
        notes: v.notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Dental chart entry updated');
      invalidate('dental-chart', session?.record_id ?? undefined);
      setChartModal(false);
      setEditingChart(null);
    },
    onError: (e) => toast.apiError(e, 'Failed to update dental chart entry'),
  });
  const deleteChart = useMutation({
    mutationFn: (chartId: string) => apiClient.delete(`${GW}/dental-charts/${chartId}`),
    onSuccess: () => {
      toast.success('Dental chart entry deleted');
      invalidate('dental-chart', session?.record_id ?? undefined);
    },
    onError: (e) => toast.apiError(e, 'Failed to delete dental chart entry'),
  });

  const finalizeSession = useMutation({
    mutationFn: () => apiClient.patch(`${GW}/examination-sessions/${id}/finalize`),
    onSuccess: () => {
      toast.success('Encounter finalized');
      qc.invalidateQueries({ queryKey: ['examination', id] });
      if (sessionAppointmentId) {
        qc.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
    onError: (e) => toast.apiError(e, 'Failed to finalize encounter'),
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-[24px] font-bold tracking-[-0.5px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                      Clinical Examination
                    </h1>
                    <button
                      onClick={() => {
                        if (finalizeBlocker) {
                          toast.warning(finalizeBlocker);
                          return;
                        }
                        if (!confirm('Finalize this encounter? It will lock the examination note.')) return;
                        finalizeSession.mutate();
                      }}
                      disabled={isFinalized || !!finalizeBlocker || finalizeSession.isPending}
                      title={finalizeBlocker ?? undefined}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ background: TEAL }}
                    >
                      <Icon icon={isFinalized ? 'lucide:lock' : 'lucide:signature'} width={14} />
                      {isFinalized ? 'Finalized' : 'Finalize encounter'}
                    </button>
                  </div>
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
              onAdd={() => {
                if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                setEditingSymp(null); setSympModal(true);
              }}
              empty={symptoms.length === 0 ? 'No symptoms recorded.' : undefined}
            >
              {symptoms.map((s) => (
                <Row
                  key={s.symptom_id}
                  title={s.symptom_name}
                  badge={s.severity ?? undefined}
                  subtitle={[s.body_location, s.duration, fmtDateMaybe(s.onset_date)].filter(Boolean).join(' · ')}
                  description={s.description ?? undefined}
                  onEdit={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    setEditingSymp(s); setSympModal(true);
                  }}
                  onDelete={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    if (confirm(`Delete symptom "${s.symptom_name}"?`)) deleteSymp.mutate(s.symptom_id);
                  }}
                />
              ))}
            </Section>

            {/* Diagnoses */}
            <Section
              title="Diagnoses" count={diagnoses.length} addLabel="Add diagnosis"
              onAdd={() => {
                if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                setEditingDiag(null); setDiagModal(true);
              }}
              empty={diagnoses.length === 0 ? 'No diagnoses recorded.' : undefined}
            >
              {diagnoses.map((d) => (
                <Row
                  key={d.diagnosis_id}
                  title={d.diagnosis_name}
                  badge={d.severity ?? undefined}
                  subtitle={[d.icd_code, d.diagnosis_type].filter(Boolean).join(' · ')}
                  description={d.notes ?? undefined}
                  onEdit={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    setEditingDiag(d); setDiagModal(true);
                  }}
                  onDelete={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    if (confirm(`Delete diagnosis "${d.diagnosis_name}"?`)) deleteDiag.mutate(d.diagnosis_id);
                  }}
                />
              ))}
            </Section>

            {/* Treatment Plans */}
            <Section
              title="Treatment Plans" count={plans.length} addLabel="Create plan"
              onAdd={() => {
                if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                if (!patientId) { toast.warning('Session has no patient.'); return; }
                setEditingPlan(null); setPlanModal(true);
              }}
              empty={plans.length === 0 ? 'No treatment plans yet.' : undefined}
            >
              {plans.map((p) => {
                const status = (p.status ?? 'draft').toLowerCase();
                const hasQuote = Number(p.estimated_cost ?? 0) > 0;
                const editable = !isFinalized && !['accepted', 'declined', 'in_progress', 'completed', 'cancelled'].includes(status);
                return (
                  <div key={p.plan_id} className="group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[rgba(29,32,35,0.5)] p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{p.plan_name || 'Treatment plan'}</span>
                        {p.status && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize text-[#C1C7CF]">{p.status}</span>}
                      </div>
                      <span className="text-xs text-[#8B9199]">
                        {p.duration_weeks != null ? `${p.duration_weeks} weeks` : '—'}
                        {hasQuote ? ` · ${formatMoney(p.estimated_cost, p.quote_currency ?? undefined)}` : ' · no quote'}
                        {p.proposed_at ? ` · proposed ${fmtDate(p.proposed_at)}` : ''}
                        {p.accepted_at ? ` · accepted ${fmtDate(p.accepted_at)}` : ''}
                        {p.declined_at ? ` · declined ${fmtDate(p.declined_at)}` : ''}
                      </span>
                      {p.objectives && <span className="text-xs text-[#C1C7CF]">{p.objectives}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {status === 'draft' && (
                        <button
                          onClick={() => {
                            if (!hasQuote) { toast.warning('Estimated cost is required before proposing.'); return; }
                            proposePlan.mutate(p.plan_id);
                          }}
                          disabled={isFinalized || proposePlan.isPending}
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25 disabled:opacity-50"
                        >
                          <Icon icon="lucide:send" width={13} /> Propose
                        </button>
                      )}
                      {status === 'proposed' && (
                        <>
                          <button
                            onClick={() => { if (confirm('Record patient acceptance for this treatment plan?')) acceptPlan.mutate(p.plan_id); }}
                            disabled={isFinalized || acceptPlan.isPending}
                            className="rounded p-1 text-[#45F0CF] transition hover:text-white disabled:opacity-50"
                            title="Accept treatment plan"
                          >
                            <Icon icon="lucide:check" width={14} />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Decline reason (optional)') ?? undefined;
                              declinePlan.mutate({ pid: p.plan_id, reason });
                            }}
                            disabled={isFinalized || declinePlan.isPending}
                            className="rounded p-1 text-red-300 transition hover:text-red-200 disabled:opacity-50"
                            title="Decline treatment plan"
                          >
                            <Icon icon="lucide:x" width={14} />
                          </button>
                        </>
                      )}
                      {editable && (
                        <RowActions
                          onEdit={() => { setEditingPlan(p); setPlanModal(true); }}
                          onDelete={() => { if (confirm(`Delete plan "${p.plan_name || ''}"?`)) deletePlan.mutate(p.plan_id); }}
                        />
                      )}
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
                <button
                  onClick={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    if (!patientId) { toast.warning('Session has no patient.'); return; }
                    setPrescModal(true);
                  }}
                  disabled={!canCreatePrescriptionNow || createPresc.isPending}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: BLUE }}
                >
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
                      const status = normalizePrescriptionStatus(pr.status);
                      const canModifyThisPrescription = canModifyPrescriptionItems({
                        isFinalized,
                        prescriptionId: pr.prescription_id,
                        status,
                      });
                      return (
                        <div key={pr.prescription_id} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                          <button
                            onClick={() => setActivePrescriptionId(pr.prescription_id)}
                            className="rounded-md px-2 py-1 text-xs font-semibold transition"
                            style={active
                              ? { background: 'rgba(69,240,207,0.15)', color: TEAL }
                              : { color: '#C1C7CF' }}
                          >
                            {pr.prescription_id.slice(0, 8)} · {status}
                          </button>
                          {canModifyThisPrescription && (
                            <>
                              <button
                                onClick={() => {
                                  if (!confirm('Issue and sign this prescription?')) return;
                                  issuePresc.mutate(pr.prescription_id);
                                }}
                                className="rounded p-1 text-[#C1C7CF] transition hover:text-white"
                                title="Issue prescription"
                              >
                                <Icon icon="lucide:signature" width={13} />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Cancellation reason');
                                  if (!reason) return;
                                  cancelPresc.mutate({ prescriptionId: pr.prescription_id, reason });
                                }}
                                className="rounded p-1 text-red-300 transition hover:text-red-200"
                                title="Cancel prescription"
                              >
                                <Icon icon="lucide:x" width={13} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B9199]">
                      {selectedPrescriptionId ? `Drugs in ${selectedPrescriptionId.slice(0, 8)} (${items.length})` : 'Select a prescription'}
                    </span>
                    {selectedPrescriptionId && (
                      <button
                        onClick={() => {
                          if (!canModifySelectedPrescriptionItems) {
                            toast.warning('Only draft prescriptions can be changed.');
                            return;
                          }
                          setItemModal(true);
                        }}
                        disabled={!canModifySelectedPrescriptionItems || addItem.isPending}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                      >
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
                        onDelete={canModifySelectedPrescriptionItems ? () => { if (confirm(`Remove "${it.medication_name}"?`)) deleteItem.mutate(it.item_id); } : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dental Chart */}
            <Section
              title="Dental Chart" count={dentalChartEntries.length} addLabel="Chart tooth"
              onAdd={() => {
                const blocker = getDentalChartFormBlocker({
                  isFinalized,
                  patientId,
                  recordId: session?.record_id,
                  toothNumber: '11',
                });
                if (blocker) {
                  toast.warning(blocker);
                  return;
                }
                setEditingChart(null);
                setChartModal(true);
              }}
              empty={dentalChartEntries.length === 0 ? 'No dental chart entries yet.' : undefined}
            >
              {dentalChartEntries.map((entry) => (
                <Row
                  key={entry.chart_id}
                  title={`Tooth ${entry.tooth_number}`}
                  badge={entry.tooth_status ?? undefined}
                  description={entry.notes ?? undefined}
                  onEdit={() => {
                    if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                    setEditingChart(entry);
                    setChartModal(true);
                  }}
                  onDelete={!isFinalized ? () => {
                    if (confirm(`Delete dental chart entry for tooth ${entry.tooth_number}?`)) {
                      deleteChart.mutate(entry.chart_id);
                    }
                  } : undefined}
                />
              ))}
            </Section>

            {/* Diagnostic Orders — X-ray/CBCT */}
            <Section
              title="Diagnostic Orders — X-ray / CBCT" count={diagnosticOrders.length} addLabel="Order X-ray / CBCT"
              onAdd={() => {
                if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; }
                if (!patientId) { toast.warning('Session has no patient.'); return; }
                if (!sessionAppointmentId) { toast.warning('Session has no linked appointment.'); return; }
                setDxModal(true);
              }}
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
                  <button onClick={() => { if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; } if (!patientId) { toast.warning('Session has no patient.'); return; } setCoDefaultType('lab_test'); setCoModal(true); }} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE }}>
                    <Icon icon="lucide:flask-conical" width={14} /> Order Lab Test
                  </button>
                  <button onClick={() => { if (isFinalized) { toast.warning('Finalized encounters are locked.'); return; } if (!patientId) { toast.warning('Session has no patient.'); return; } setCoDefaultType('clinical_test'); setCoModal(true); }} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25">
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
            estimated_cost: editingPlan.estimated_cost ? String(editingPlan.estimated_cost) : '',
            quote_currency: editingPlan.quote_currency ?? 'VND',
          } : undefined}
          onClose={() => { setPlanModal(false); setEditingPlan(null); }}
          onSubmit={(v) => (editingPlan ? updatePlan.mutate({ pid: editingPlan.plan_id, v }) : createPlan.mutate(v))}
        />
      )}

      {diagModal && (
        <DiagnosisModal
          title={editingDiag ? 'Edit diagnosis' : 'Add diagnosis'}
          submitting={createDiag.isPending || updateDiag.isPending}
          initial={editingDiag ? {
            icd_code: editingDiag.icd_code ?? '',
            diagnosis_name: editingDiag.diagnosis_name,
            diagnosis_type: editingDiag.diagnosis_type ?? '',
            severity: editingDiag.severity ?? '',
            notes: editingDiag.notes ?? '',
          } : undefined}
          onClose={() => { setDiagModal(false); setEditingDiag(null); }}
          onSubmit={(v) => (editingDiag ? updateDiag.mutate({ did: editingDiag.diagnosis_id, v }) : createDiag.mutate(v))}
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

      {chartModal && (
        <DentalChartModal
          title={editingChart ? 'Edit dental chart entry' : 'Chart tooth'}
          submitting={createChart.isPending || updateChart.isPending}
          lockedTooth={editingChart?.tooth_number}
          initial={editingChart ? {
            tooth_number: String(editingChart.tooth_number),
            tooth_status: editingChart.tooth_status ?? '',
            notes: editingChart.notes ?? '',
          } : undefined}
          onClose={() => { setChartModal(false); setEditingChart(null); }}
          onSubmit={(v) => {
            const blocker = getDentalChartFormBlocker({
              isFinalized,
              patientId,
              recordId: session?.record_id,
              toothNumber: v.tooth_number,
            });
            if (blocker) {
              toast.warning(blocker);
              return;
            }
            if (editingChart) {
              updateChart.mutate({ chartId: editingChart.chart_id, v });
            } else {
              createChart.mutate(v);
            }
          }}
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

const formatMoney = (value?: string | number | null, currency = 'VND') => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'no quote';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface DiagnosisFormValues {
  icd_code: string;
  diagnosis_name: string;
  diagnosis_type: string;
  severity: string;
  notes: string;
}

interface DentalChartFormValues {
  tooth_number: string;
  tooth_status: string;
  notes: string;
}

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

function DentalChartModal({
  title, submitting, initial, lockedTooth, onClose, onSubmit,
}: {
  title: string; submitting?: boolean; initial?: DentalChartFormValues; lockedTooth?: number; onClose: () => void; onSubmit: (v: DentalChartFormValues) => void;
}) {
  const [form, setForm] = useState<DentalChartFormValues>(initial ?? {
    tooth_number: '',
    tooth_status: '',
    notes: '',
  });
  const inputCls = 'rounded-lg border border-white/10 bg-[#181B1F] px-3 py-2 text-sm text-white outline-none transition focus:border-[#45F0CF]/50';
  const set = (key: keyof DentalChartFormValues, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!normalizeDentalChartToothNumber(form.tooth_number)) {
            toast.warning(DENTAL_CHART_TOOTH_NUMBER_MESSAGE);
            return;
          }
          onSubmit(form);
        }}
        className={`${cardBase} flex w-full max-w-md flex-col gap-4 p-6`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#C1C7CF] hover:text-white">
            <Icon icon="lucide:x" width={18} />
          </button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">
            Tooth number
            <input
              className={inputCls}
              value={form.tooth_number}
              disabled={lockedTooth !== undefined}
              placeholder="11"
              onChange={(e) => set('tooth_number', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">
            Status
            <select className={inputCls} value={form.tooth_status} onChange={(e) => set('tooth_status', e.target.value)}>
              <option value="">Select status</option>
              <option value="sound">Sound</option>
              <option value="caries">Caries</option>
              <option value="filled">Filled</option>
              <option value="missing">Missing</option>
              <option value="crown">Crown</option>
              <option value="implant">Implant</option>
              <option value="root_canal">Root canal</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">
            Notes
            <textarea className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Clinical note" rows={3} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-[#C1C7CF] hover:text-white">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#003450] disabled:opacity-50" style={{ background: TEAL }}>
            {submitting ? 'Saving...' : 'Save chart entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DiagnosisModal({
  title, submitting, initial, onClose, onSubmit,
}: {
  title: string; submitting?: boolean; initial?: DiagnosisFormValues; onClose: () => void; onSubmit: (v: DiagnosisFormValues) => void;
}) {
  const [form, setForm] = useState<DiagnosisFormValues>(initial ?? {
    icd_code: '',
    diagnosis_name: '',
    diagnosis_type: '',
    severity: '',
    notes: '',
  });
  const inputCls = 'rounded-lg border border-white/10 bg-[#181B1F] px-3 py-2 text-sm text-white outline-none transition focus:border-[#45F0CF]/50';
  const set = (key: keyof DiagnosisFormValues, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.diagnosis_name.trim()) {
            toast.warning('Diagnosis name is required.');
            return;
          }
          onSubmit(form);
        }}
        className={`${cardBase} flex w-full max-w-lg flex-col gap-4 p-6`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#C1C7CF] hover:text-white">
            <Icon icon="lucide:x" width={18} />
          </button>
        </div>
        <div className="grid gap-3">
          <input className={inputCls} value={form.diagnosis_name} onChange={(e) => set('diagnosis_name', e.target.value)} placeholder="Diagnosis name" />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={inputCls} value={form.icd_code} onChange={(e) => set('icd_code', e.target.value)} placeholder="ICD code" />
            <input className={inputCls} value={form.diagnosis_type} onChange={(e) => set('diagnosis_type', e.target.value)} placeholder="Type" />
            <select className={inputCls} value={form.severity} onChange={(e) => set('severity', e.target.value)}>
              <option value="">Severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <textarea className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notes" rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-[#C1C7CF] hover:text-white">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#003450] disabled:opacity-50" style={{ background: TEAL }}>
            {submitting ? 'Saving...' : 'Save diagnosis'}
          </button>
        </div>
      </form>
    </div>
  );
}
