'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { AnnotationModal } from '@/features/dental-image/components/AnnotationModal';
import { CategoryModal } from '@/features/dental-image/components/CategoryModal';
import {
  EditImageModal,
  type EditImageFormValues,
} from '@/features/dental-image/components/EditImageModal';
import {
  UploadImageModal,
  type UploadImageFormValues,
  type CategoryOption,
  type RecordOption,
} from '@/features/dental-image/components/UploadImageModal';
import { DOCTORS, doctorName, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const TEAL = '#2f9e8a';
const BLUE = '#417eaa';
const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)] backdrop-blur-[10px]';
const GATEWAY = ENV.SERVICES.GATEWAY;

interface PatientLite {
  patient_id: string;
  full_name: string;
  patient_code?: string;
}
interface CategoryLite {
  category_id: string;
  category_name: string;
}
interface MedicalRecordLite {
  record_id: string;
  visit_date?: string;
  chief_complaint?: string;
  diagnosis?: string;
}
interface DentalImage {
  image_id: string;
  patient_id: string;
  record_id?: string;
  category_id?: string;
  image_type: string;
  image_url: string;
  thumbnail_url?: string;
  tooth_numbers?: number[];
  view_angle?: string;
  description?: string;
  uploaded_by?: string;
  is_archived?: boolean;
  created_at?: string;
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '');

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1d2023"/><text x="50%" y="50%" fill="#5b6068" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">No preview</text></svg>`,
  );

export default function DentalImagesPage() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const defaultActorId = currentUserId ?? DOCTORS[0]?.id;

  const [patientId, setPatientId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<DentalImage | null>(null);
  const [annotating, setAnnotating] = useState<DentalImage | null>(null);

  // ── queries ──
  const { data: patientsRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${GATEWAY}/patients`),
  });
  const { data: categoriesRes } = useQuery({
    queryKey: ['image-categories'],
    queryFn: () => apiClient.get(`${GATEWAY}/image-categories`),
  });
  const { data: recordsRes } = useQuery({
    queryKey: ['medical-records', 'patient', patientId],
    queryFn: () => apiClient.get(`${GATEWAY}/medical-records/patient/${patientId}`),
    enabled: !!patientId,
  });
  const {
    data: imagesRes,
    isLoading: imagesLoading,
    isError: imagesError,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ['dental-images', 'patient', patientId],
    queryFn: () => apiClient.get(`${GATEWAY}/dental-images/patient/${patientId}`),
    enabled: !!patientId,
  });

  const patients = useMemo(() => unwrapArr<PatientLite>(patientsRes), [patientsRes]);
  const categories = useMemo(() => unwrapArr<CategoryLite>(categoriesRes), [categoriesRes]);
  const records = useMemo(() => unwrapArr<MedicalRecordLite>(recordsRes), [recordsRes]);
  const images = useMemo(() => unwrapArr<DentalImage>(imagesRes), [imagesRes]);

  const categoryOptions: CategoryOption[] = categories.map((c) => ({ category_id: c.category_id, category_name: c.category_name }));
  const categoryName = (id?: string) => categories.find((c) => c.category_id === id)?.category_name;
  const recordOptions: RecordOption[] = records.map((r) => ({
    record_id: r.record_id,
    label: `${fmtDate(r.visit_date) || r.record_id.slice(0, 8)} · ${r.chief_complaint || r.diagnosis || r.record_id.slice(0, 8)}`,
  }));

  const invImages = () => qc.invalidateQueries({ queryKey: ['dental-images', 'patient', patientId] });

  // ── mutations ──
  const createImage = useMutation({
    mutationFn: (v: UploadImageFormValues) =>
      apiClient.post(`${GATEWAY}/dental-images`, {
        patient_id: patientId,
        uploaded_by: defaultActorId,
        image_type: v.image_type,
        image_url: v.image_url,
        tooth_numbers: v.tooth_numbers,
        category_id: v.category_id,
        view_angle: v.view_angle,
        description: v.description,
        record_id: v.record_id,
      }),
    onSuccess: () => { toast.success('Image uploaded'); invImages(); setUploadOpen(false); },
    onError: (e) => toast.apiError(e, 'Failed to upload image'),
  });

  const updateImage = useMutation({
    mutationFn: ({ id, v }: { id: string; v: EditImageFormValues }) =>
      apiClient.patch(`${GATEWAY}/dental-images/${id}`, {
        description: v.description,
        category_id: v.category_id,
        view_angle: v.view_angle,
        record_id: v.record_id,
      }),
    onSuccess: () => { toast.success('Image updated'); invImages(); setEditing(null); },
    onError: (e) => toast.apiError(e, 'Failed to update image'),
  });

  const archiveImage = useMutation({
    mutationFn: (id: string) => apiClient.patch(`${GATEWAY}/dental-images/${id}/archive`),
    onSuccess: () => { toast.success('Image archived'); invImages(); },
    onError: (e) => toast.apiError(e, 'Failed to archive image'),
  });

  const deleteImage = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${GATEWAY}/dental-images/${id}`),
    onSuccess: () => { toast.success('Image deleted'); invImages(); },
    onError: (e) => toast.apiError(e, 'Failed to delete image'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Dental Imaging
            </h1>
            <p className="text-sm text-smile-description">Image library, annotations and categories</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-[38px] rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none focus:[border-color:var(--surface-card-border)]"
            >
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id} className="[background:var(--surface-input-bg)] text-smile-title">
                  {p.full_name}{p.patient_code ? ` (${p.patient_code})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCategoriesOpen(true)}
              className="flex items-center gap-2 rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2 text-sm font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)]"
            >
              <Icon icon="lucide:tags" width={16} /> Categories
            </button>
            <button
              onClick={() => {
                if (!patientId) { toast.warning('Select a patient first.'); return; }
                setUploadOpen(true);
              }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-smile-primary-dark bg-smile-primary"
            >
              <Icon icon="lucide:upload" width={16} /> Upload image
            </button>
          </div>
        </div>

        {/* No patient */}
        {!patientId && (
          <div className={`${cardBase} flex flex-col items-center gap-2 p-12 text-center text-sm text-smile-description`}>
            <Icon icon="lucide:scan" width={28} style={{ color: BLUE }} />
            Select a patient to view their dental image library.
          </div>
        )}

        {/* States */}
        {patientId && imagesLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading images…
          </div>
        )}
        {patientId && imagesError && !imagesLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load images.{' '}
            <button onClick={() => refetchImages()} className="font-semibold underline">Retry</button>
          </div>
        )}
        {patientId && !imagesLoading && !imagesError && images.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>No images for this patient yet.</div>
        )}

        {/* Gallery */}
        {patientId && !imagesLoading && !imagesError && images.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <div key={img.image_id} className={`${cardBase} flex flex-col overflow-hidden`}>
                {/* Image */}
                <div className="relative h-44 w-full bg-[#1d2023]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url || PLACEHOLDER}
                    alt={img.description || img.image_type}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <span
                    className="absolute left-2 top-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                    style={{ background: 'rgba(146,205,253,0.15)', borderColor: 'rgba(146,205,253,0.3)', color: BLUE }}
                  >
                    {img.image_type}
                  </span>
                  {img.is_archived && (
                    <span className="absolute right-2 top-2 rounded-full border [border-color:var(--surface-panel-border)] bg-black/50 px-2.5 py-0.5 text-[11px] font-semibold text-smile-description">
                      Archived
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {img.description && <p className="text-sm font-medium text-smile-title">{img.description}</p>}
                  <div className="flex flex-col gap-1 text-xs text-smile-description">
                    {!!img.tooth_numbers?.length && (
                      <span><span className="text-smile-description">Teeth:</span> {img.tooth_numbers.join(', ')}</span>
                    )}
                    {img.view_angle && <span><span className="text-smile-description">View:</span> {img.view_angle}</span>}
                    {categoryName(img.category_id) && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-2 py-0.5" style={{ color: TEAL }}>
                        <Icon icon="lucide:tag" width={11} /> {categoryName(img.category_id)}
                      </span>
                    )}
                    {img.record_id && (
                      <span className="inline-flex w-fit items-center gap-1 text-smile-primary">
                        <Icon icon="lucide:link" width={11} /> Attached to treatment profile
                      </span>
                    )}
                    <span className="mt-1">{doctorName(img.uploaded_by)}{img.created_at ? ` · ${fmtDate(img.created_at)}` : ''}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-1 border-t [border-color:var(--surface-panel-border)] px-3 py-2.5">
                  <button onClick={() => setEditing(img)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-smile-title transition hover:bg-smile-primary-light/40">
                    <Icon icon="lucide:pencil" width={13} /> Edit
                  </button>
                  <button onClick={() => setAnnotating(img)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-smile-title transition hover:bg-smile-primary-light/40">
                    <Icon icon="lucide:message-square-text" width={13} /> Annotate
                  </button>
                  {!img.is_archived && (
                    <button
                      onClick={() => { if (confirm('Archive this image?')) archiveImage.mutate(img.image_id); }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-smile-description transition hover:bg-smile-primary-light/40"
                    >
                      <Icon icon="lucide:archive" width={13} /> Archive
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Delete this image? This cannot be undone.')) deleteImage.mutate(img.image_id); }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
                  >
                    <Icon icon="lucide:trash-2" width={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadOpen && (
        <UploadImageModal
          submitting={createImage.isPending}
          categories={categoryOptions}
          records={recordOptions}
          onClose={() => setUploadOpen(false)}
          onSubmit={(v) => createImage.mutate(v)}
        />
      )}

      {editing && (
        <EditImageModal
          submitting={updateImage.isPending}
          categories={categoryOptions}
          records={recordOptions}
          initial={{
            description: editing.description,
            category_id: editing.category_id,
            view_angle: editing.view_angle,
            record_id: editing.record_id,
          }}
          onClose={() => setEditing(null)}
          onSubmit={(v) => updateImage.mutate({ id: editing.image_id, v })}
        />
      )}

      {annotating && (
        <AnnotationModal
          imageId={annotating.image_id}
          annotatedBy={defaultActorId}
          onClose={() => setAnnotating(null)}
        />
      )}

      {categoriesOpen && <CategoryModal onClose={() => setCategoriesOpen(false)} />}
    </AppShell>
  );
}
