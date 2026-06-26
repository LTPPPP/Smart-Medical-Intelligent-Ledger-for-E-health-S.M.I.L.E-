'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  MedicalHistoryModal,
  type MedicalHistoryFormValues,
} from '@/features/patient/components/MedicalHistoryModal';
import {
  MedicalRecordModal,
  type MedicalRecordFormValues,
  type ClinicOption,
} from '@/features/patient/components/MedicalRecordModal';
import {
  TreatmentModal,
  type TreatmentFormValues,
  type RecordOption,
} from '@/features/patient/components/TreatmentModal';
import { DOCTORS, doctorName } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#2f9e8a';
const BLUE = '#417eaa';
const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl';

interface Patient {
  patient_id: string; patient_code: string; full_name: string;
  gender?: string; date_of_birth?: string; phone?: string; email?: string;
  address?: string; blood_type?: string; allergies?: string; chronic_diseases?: string;
}
interface MedicalHistory {
  history_id?: string; id?: string; condition_name: string; condition_type?: string;
  diagnosed_date?: string; treatment?: string; notes?: string;
}
interface MedicalRecord {
  record_id: string; clinic_id?: string; doctor_id?: string; visit_date?: string;
  chief_complaint?: string; diagnosis?: string; treatment_plan?: string; notes?: string; record_status?: string;
  file_url?: string;
}
interface Treatment {
  treatment_id?: string; id?: string; record_id: string; treatment_date?: string;
  procedure_name: string; tooth_numbers?: number[]; procedure_code?: string;
  cost?: number; status?: string; performed_by?: string;
}
interface Clinic { clinic_id: string; clinic_name: string }
interface RecordExport { file_url?: string; export_id?: string }

function unwrapOne<T>(res: unknown): T | null {
  const payload = (res as { data?: unknown })?.data;
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) return (payload as { data: T }).data;
  return (payload as T) ?? null;
}
function unwrapArr<T>(res: unknown): T[] {
  const payload = (res as { data?: unknown })?.data;
  if (Array.isArray(payload)) return payload as T[];
  const inner = (payload as { data?: unknown })?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
}

const histId = (h: MedicalHistory) => h.history_id ?? h.id ?? '';
const trtId = (t: Treatment) => t.treatment_id ?? t.id ?? '';
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const defaultDoctorId = currentUserId ?? DOCTORS[0]?.id;

  // ── modal state ──
  const [histModal, setHistModal] = useState(false);
  const [editingHist, setEditingHist] = useState<MedicalHistory | null>(null);
  const [recModal, setRecModal] = useState(false);
  const [editingRec, setEditingRec] = useState<MedicalRecord | null>(null);
  const [trtModal, setTrtModal] = useState(false);
  const [editingTrt, setEditingTrt] = useState<Treatment | null>(null);

  // ── queries ──
  const { data: patientRes, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.PATIENT.DETAIL(id)),
    enabled: !!id,
  });
  const { data: histRes } = useQuery({
    queryKey: ['patient', id, 'history'],
    queryFn: () => apiClient.get(API_ENDPOINTS.MEDICAL_HISTORY.BY_PATIENT(id)),
    enabled: !!id,
  });
  const { data: recRes } = useQuery({
    queryKey: ['patient', id, 'records'],
    queryFn: () => apiClient.get(API_ENDPOINTS.MEDICAL_RECORD.BY_PATIENT(id)),
    enabled: !!id,
  });
  const { data: trtRes } = useQuery({
    queryKey: ['patient', id, 'treatments'],
    queryFn: () => apiClient.get(API_ENDPOINTS.TREATMENT_HISTORY.BY_PATIENT(id)),
    enabled: !!id,
  });
  const { data: clinicsRes } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
  });

  const patient = useMemo(() => unwrapOne<Patient>(patientRes), [patientRes]);
  const histories = useMemo(() => unwrapArr<MedicalHistory>(histRes), [histRes]);
  const records = useMemo(() => unwrapArr<MedicalRecord>(recRes), [recRes]);
  const treatments = useMemo(() => unwrapArr<Treatment>(trtRes), [trtRes]);
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);

  const clinicOptions: ClinicOption[] = clinics.map((c) => ({ clinic_id: c.clinic_id, clinic_name: c.clinic_name }));
  const clinicName = (cid?: string) => clinics.find((c) => c.clinic_id === cid)?.clinic_name ?? '—';
  const recordOptions: RecordOption[] = records.map((r) => ({
    record_id: r.record_id,
    label: `${fmtDate(r.visit_date)} · ${r.chief_complaint || r.diagnosis || r.record_id.slice(0, 8)}`,
  }));

  const inv = (key: string) => qc.invalidateQueries({ queryKey: ['patient', id, key] });

  // ── patient mutations ──
  const deletePatient = useMutation({
    mutationFn: () => apiClient.delete(API_ENDPOINTS.PATIENT.DELETE(id)),
    onSuccess: () => { toast.success('Patient deleted'); router.push(ROUTES.PATIENTS); },
    onError: (e) => toast.apiError(e, 'Failed to delete patient'),
  });

  // ── medical history mutations ──
  const createHist = useMutation({
    mutationFn: (v: MedicalHistoryFormValues) => apiClient.post(API_ENDPOINTS.MEDICAL_HISTORY.CREATE(id), { patient_id: id, ...v }),
    onSuccess: () => { toast.success('Medical history added'); inv('history'); setHistModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add medical history'),
  });
  const updateHist = useMutation({
    mutationFn: ({ hid, v }: { hid: string; v: MedicalHistoryFormValues }) => apiClient.patch(API_ENDPOINTS.MEDICAL_HISTORY.UPDATE(id, hid), v),
    onSuccess: () => { toast.success('Medical history updated'); inv('history'); setHistModal(false); setEditingHist(null); },
    onError: (e) => toast.apiError(e, 'Failed to update medical history'),
  });
  const deleteHist = useMutation({
    mutationFn: (hid: string) => apiClient.delete(API_ENDPOINTS.MEDICAL_HISTORY.DELETE(id, hid)),
    onSuccess: () => { toast.success('Medical history deleted'); inv('history'); },
    onError: (e) => toast.apiError(e, 'Failed to delete medical history'),
  });

  // ── medical record mutations ──
  const createRec = useMutation({
    mutationFn: (v: MedicalRecordFormValues) => apiClient.post(API_ENDPOINTS.MEDICAL_RECORD.CREATE, { patient_id: id, ...v }),
    onSuccess: () => { toast.success('Medical record added'); inv('records'); setRecModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add medical record'),
  });
  const updateRec = useMutation({
    mutationFn: ({ rid, v }: { rid: string; v: MedicalRecordFormValues }) => {
      const { clinic_id, doctor_id, visit_date, ...rest } = v; // edit only sends text fields
      void clinic_id; void doctor_id; void visit_date;
      return apiClient.patch(API_ENDPOINTS.MEDICAL_RECORD.UPDATE(rid), rest);
    },
    onSuccess: () => { toast.success('Medical record updated'); inv('records'); setRecModal(false); setEditingRec(null); },
    onError: (e) => toast.apiError(e, 'Failed to update medical record'),
  });
  const deleteRec = useMutation({
    mutationFn: (rid: string) => apiClient.delete(API_ENDPOINTS.MEDICAL_RECORD.DELETE(rid)),
    onSuccess: () => { toast.success('Medical record deleted'); inv('records'); inv('treatments'); },
    onError: (e) => toast.apiError(e, 'Failed to delete medical record'),
  });
  const exportRec = useMutation({
    mutationFn: (rec: MedicalRecord) => apiClient.post(API_ENDPOINTS.RECORD_EXPORT.CREATE, {
      patient_id: id,
      record_id: rec.record_id,
      export_type: 'pdf',
      export_format: 'pdf',
      exported_by: defaultDoctorId,
    }),
    onSuccess: (res) => {
      const out = unwrapOne<RecordExport>(res);
      toast.success('Record exported');
      if (out?.file_url) window.open(out.file_url, '_blank');
    },
    onError: (e) => toast.apiError(e, 'Failed to export record'),
  });

  // ── treatment mutations ──
  const createTrt = useMutation({
    mutationFn: (v: TreatmentFormValues) => apiClient.post(API_ENDPOINTS.TREATMENT_HISTORY.CREATE, { patient_id: id, ...v }),
    onSuccess: () => { toast.success('Treatment added'); inv('treatments'); setTrtModal(false); },
    onError: (e) => toast.apiError(e, 'Failed to add treatment'),
  });
  const updateTrt = useMutation({
    mutationFn: ({ tid, v }: { tid: string; v: TreatmentFormValues }) => apiClient.patch(API_ENDPOINTS.TREATMENT_HISTORY.UPDATE(tid), v),
    onSuccess: () => { toast.success('Treatment updated'); inv('treatments'); setTrtModal(false); setEditingTrt(null); },
    onError: (e) => toast.apiError(e, 'Failed to update treatment'),
  });
  const deleteTrt = useMutation({
    mutationFn: (tid: string) => apiClient.delete(API_ENDPOINTS.TREATMENT_HISTORY.DELETE(tid)),
    onSuccess: () => { toast.success('Treatment deleted'); inv('treatments'); },
    onError: (e) => toast.apiError(e, 'Failed to delete treatment'),
  });

  const savingRec = createRec.isPending || updateRec.isPending;
  const savingTrt = createTrt.isPending || updateTrt.isPending;
  const savingHist = createHist.isPending || updateHist.isPending;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push(ROUTES.PATIENTS)} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
            <Icon icon="lucide:arrow-left" width={16} /> Back to patients
          </button>
          {patient && (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.PATIENT_EDIT(patient.patient_id)} className="flex items-center gap-2 rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2 text-sm font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)]">
                <Icon icon="lucide:pencil" width={15} /> Edit
              </Link>
              <button
                onClick={() => { if (confirm('Delete this patient? This cannot be undone.')) deletePatient.mutate(); }}
                className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
              >
                <Icon icon="lucide:trash-2" width={15} /> Delete
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-20 text-smile-description`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
          </div>
        )}
        {!isLoading && !patient && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>Patient not found.</div>
        )}

        {patient && (
          <>
            {/* Profile header */}
            <div className={`${cardBase} flex flex-col gap-5 p-6`}>
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
                  <Icon icon="lucide:user" width={26} style={{ color: BLUE }} />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h1 className="text-[26px] font-bold tracking-[-0.5px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>{patient.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-0.5 font-mono text-xs font-semibold" style={{ color: TEAL }}>{patient.patient_code}</span>
                    {patient.gender && <span className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-0.5 text-xs font-semibold capitalize text-smile-description">{patient.gender.toLowerCase()}</span>}
                    {patient.blood_type && <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'rgba(146,205,253,0.15)', borderColor: 'rgba(146,205,253,0.3)', color: BLUE }}>{patient.blood_type}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-smile-description sm:grid-cols-2">
                <Info icon="lucide:cake" text={`DOB: ${fmtDate(patient.date_of_birth)}`} />
                <Info icon="lucide:phone" text={patient.phone || '—'} />
                <Info icon="lucide:mail" text={patient.email || '—'} />
                <Info icon="lucide:map-pin" text={patient.address || '—'} />
                <Info icon="lucide:alert-triangle" text={`Allergies: ${patient.allergies || 'None'}`} />
                <Info icon="lucide:heart-pulse" text={`Chronic: ${patient.chronic_diseases || 'None'}`} />
              </div>
            </div>

            {/* Medical History */}
            <Section
              title="Medical History" count={histories.length}
              onAdd={() => { setEditingHist(null); setHistModal(true); }}
              empty={histories.length === 0 ? 'No medical history recorded.' : undefined}
            >
              {histories.map((h) => (
                <div key={histId(h)} className="group flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-smile-title">{h.condition_name}</span>
                      {h.condition_type && <span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-[11px] text-smile-description">{h.condition_type}</span>}
                    </div>
                    {h.diagnosed_date && <span className="text-xs text-smile-description">Diagnosed: {fmtDate(h.diagnosed_date)}</span>}
                    {h.treatment && <span className="text-xs text-smile-description">Treatment: {h.treatment}</span>}
                    {h.notes && <span className="text-xs text-smile-description">{h.notes}</span>}
                  </div>
                  <RowActions
                    onEdit={() => { setEditingHist(h); setHistModal(true); }}
                    onDelete={() => { if (confirm(`Delete "${h.condition_name}"?`)) deleteHist.mutate(histId(h)); }}
                  />
                </div>
              ))}
            </Section>

            {/* Medical Records */}
            <Section
              title="Medical Records" count={records.length}
              addLabel="Add record"
              onAdd={() => { setEditingRec(null); setRecModal(true); }}
              empty={records.length === 0 ? 'No medical records yet.' : undefined}
            >
              {records.map((r) => (
                <div key={r.record_id} className="group flex flex-col gap-2 rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-smile-title">{r.chief_complaint || r.diagnosis || 'Visit'}</span>
                      <span className="text-xs text-smile-description">{fmtDate(r.visit_date)} · {clinicName(r.clinic_id)} · {doctorName(r.doctor_id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportRec.mutate(r)}
                        disabled={exportRec.isPending}
                        className="flex items-center gap-1 rounded-lg border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2.5 py-1 text-xs font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)] disabled:opacity-60"
                      >
                        <Icon icon="lucide:download" width={13} /> Export
                      </button>
                      <RowActions
                        onEdit={() => { setEditingRec(r); setRecModal(true); }}
                        onDelete={() => { if (confirm('Delete this medical record?')) deleteRec.mutate(r.record_id); }}
                      />
                    </div>
                  </div>
                  {r.diagnosis && <p className="text-xs text-smile-description"><span className="text-smile-description">Diagnosis:</span> {r.diagnosis}</p>}
                  {r.treatment_plan && <p className="text-xs text-smile-description"><span className="text-smile-description">Plan:</span> {r.treatment_plan}</p>}
                  {r.notes && <p className="text-xs text-smile-description">{r.notes}</p>}
                </div>
              ))}
            </Section>

            {/* Treatment Profile */}
            <Section
              title="Treatment Profile" count={treatments.length}
              addLabel="Add treatment"
              onAdd={() => {
                if (records.length === 0) { toast.warning('Create a medical record first.'); return; }
                setEditingTrt(null); setTrtModal(true);
              }}
              empty={treatments.length === 0 ? 'No treatments yet.' : undefined}
            >
              {treatments.map((t) => (
                <div key={trtId(t)} className="group flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-smile-title">{t.procedure_name}</span>
                      {t.status && <span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-[11px] capitalize text-smile-description">{t.status}</span>}
                    </div>
                    <span className="text-xs text-smile-description">
                      {fmtDate(t.treatment_date)} · {doctorName(t.performed_by)}
                      {t.tooth_numbers?.length ? ` · Teeth: ${t.tooth_numbers.join(', ')}` : ''}
                      {t.cost != null ? ` · ${Number(t.cost).toLocaleString()}` : ''}
                    </span>
                    {t.procedure_code && <span className="text-xs text-smile-description">Code: {t.procedure_code}</span>}
                  </div>
                  <RowActions
                    onEdit={() => { setEditingTrt(t); setTrtModal(true); }}
                    onDelete={() => { if (confirm(`Delete treatment "${t.procedure_name}"?`)) deleteTrt.mutate(trtId(t)); }}
                  />
                </div>
              ))}
            </Section>
          </>
        )}
      </div>

      {/* Modals */}
      {histModal && (
        <MedicalHistoryModal
          title={editingHist ? 'Edit medical history' : 'Add medical history'}
          submitting={savingHist}
          initial={editingHist ?? undefined}
          onClose={() => { setHistModal(false); setEditingHist(null); }}
          onSubmit={(v) => (editingHist ? updateHist.mutate({ hid: histId(editingHist), v }) : createHist.mutate(v))}
        />
      )}

      {recModal && (
        <MedicalRecordModal
          title={editingRec ? 'Edit medical record' : 'Add medical record'}
          submitting={savingRec}
          isEdit={!!editingRec}
          clinics={clinicOptions}
          defaultDoctorId={defaultDoctorId}
          initial={editingRec ? {
            chief_complaint: editingRec.chief_complaint,
            diagnosis: editingRec.diagnosis,
            treatment_plan: editingRec.treatment_plan,
            notes: editingRec.notes,
          } : undefined}
          onClose={() => { setRecModal(false); setEditingRec(null); }}
          onSubmit={(v) => (editingRec ? updateRec.mutate({ rid: editingRec.record_id, v }) : createRec.mutate(v))}
        />
      )}

      {trtModal && (
        <TreatmentModal
          title={editingTrt ? 'Edit treatment' : 'Add treatment'}
          submitting={savingTrt}
          isEdit={!!editingTrt}
          records={recordOptions}
          defaultDoctorId={defaultDoctorId}
          initial={editingTrt ?? undefined}
          onClose={() => { setTrtModal(false); setEditingTrt(null); }}
          onSubmit={(v) => (editingTrt ? updateTrt.mutate({ tid: trtId(editingTrt), v }) : createTrt.mutate(v))}
        />
      )}
    </AppShell>
  );
}

function Section({
  title, count, addLabel = 'Add', onAdd, empty, children,
}: {
  title: string; count: number; addLabel?: string; onAdd: () => void; empty?: string; children: React.ReactNode;
}) {
  return (
    <div className={`${cardBase} flex flex-col gap-4 p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          {title} <span className="text-smile-description">({count})</span>
        </h2>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:bg-smile-primary-dark bg-smile-primary">
          <Icon icon="lucide:plus" width={14} /> {addLabel}
        </button>
      </div>
      {empty ? <p className="text-sm text-smile-description">{empty}</p> : <div className="flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
      <button onClick={onEdit} className="rounded p-1 text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:pencil" width={14} /></button>
      <button onClick={onDelete} className="rounded p-1 text-red-300 transition hover:text-red-200"><Icon icon="lucide:trash-2" width={14} /></button>
    </div>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon icon={icon} width={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
      <span>{text}</span>
    </div>
  );
}
