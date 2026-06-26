'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

const BLUE = '#417eaa';

export interface RecordOption {
  record_id: string;
  label: string;
}
export interface CategoryOption {
  category_id: string;
  category_name: string;
}

export interface UploadImageFormValues {
  image_type: string;
  image_url: string;
  tooth_numbers?: number[];
  category_id?: string;
  view_angle?: string;
  description?: string;
  record_id?: string;
}

const IMAGE_TYPES = [
  { value: 'endodontic', label: 'Endodontic' },
  { value: 'xray', label: 'X-ray' },
  { value: 'cbct', label: 'CBCT' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

function parseTeeth(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
}

export function UploadImageModal({
  submitting,
  categories,
  records,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  categories: CategoryOption[];
  records: RecordOption[];
  onSubmit: (v: UploadImageFormValues) => void;
  onClose: () => void;
}) {
  const [imageType, setImageType] = useState('endodontic');
  const [imageUrl, setImageUrl] = useState('');
  const [teeth, setTeeth] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [viewAngle, setViewAngle] = useState('');
  const [description, setDescription] = useState('');
  const [recordId, setRecordId] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageType.trim()) {
      setError('Image type is required.');
      return;
    }
    if (!imageUrl.trim()) {
      setError('Image URL is required.');
      return;
    }
    setError('');
    const teethArr = parseTeeth(teeth);
    onSubmit({
      image_type: imageType,
      image_url: imageUrl.trim(),
      tooth_numbers: teethArr.length ? teethArr : undefined,
      category_id: categoryId || undefined,
      view_angle: viewAngle.trim() || undefined,
      description: description.trim() || undefined,
      record_id: recordId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>Upload image</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <div className="mb-4 flex items-start gap-2 rounded-xl border [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)] px-4 py-2.5 text-xs text-smile-description">
          <Icon icon="lucide:info" width={14} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
          Metadata only — paste a hosted image URL (no file upload backend).
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Image type">
            <select className={inputCls} value={imageType} onChange={(e) => setImageType(e.target.value)}>
              {IMAGE_TYPES.map((t) => <option key={t.value} value={t.value} className="[background:var(--surface-input-bg)] text-smile-title">{t.label}</option>)}
            </select>
          </Field>
          <Field label="Image URL">
            <input className={inputCls} value={imageUrl} placeholder="https://…/image.png" onChange={(e) => setImageUrl(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tooth numbers (comma-separated)">
              <input className={inputCls} value={teeth} placeholder="11, 12, 21" onChange={(e) => setTeeth(e.target.value)} />
            </Field>
            <Field label="View angle">
              <input className={inputCls} value={viewAngle} placeholder="bitewing / periapical…" onChange={(e) => setViewAngle(e.target.value)} />
            </Field>
          </div>
          <Field label="Category (optional)">
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">— None —</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id} className="[background:var(--surface-input-bg)] text-smile-title">{c.category_name}</option>)}
            </select>
          </Field>
          <Field label="Attach to treatment profile (medical record, optional)">
            <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">— Not attached —</option>
              {records.map((r) => <option key={r.record_id} value={r.record_id} className="[background:var(--surface-input-bg)] text-smile-title">{r.label}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              className="min-h-[80px] rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]"
              value={description}
              placeholder="Notes about this image…"
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-white/25">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
            >
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />} Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadImageModal;
