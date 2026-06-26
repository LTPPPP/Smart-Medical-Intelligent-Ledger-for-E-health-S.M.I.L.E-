'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import type { CategoryOption, RecordOption } from './UploadImageModal';


export interface EditImageFormValues {
  description?: string;
  category_id?: string | null;
  view_angle?: string;
  record_id?: string | null;
}

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

export function EditImageModal({
  submitting,
  categories,
  records,
  initial,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  categories: CategoryOption[];
  records: RecordOption[];
  initial?: { description?: string; category_id?: string; view_angle?: string; record_id?: string };
  onSubmit: (v: EditImageFormValues) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [viewAngle, setViewAngle] = useState(initial?.view_angle ?? '');
  const [recordId, setRecordId] = useState(initial?.record_id ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: description.trim() || undefined,
      category_id: categoryId || null,
      view_angle: viewAngle.trim() || undefined,
      record_id: recordId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>Edit image</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="View angle">
            <input className={inputCls} value={viewAngle} placeholder="bitewing / periapical…" onChange={(e) => setViewAngle(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">— None —</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id} className="[background:var(--surface-input-bg)] text-smile-title">{c.category_name}</option>)}
            </select>
          </Field>
          <Field label="Attach to treatment profile (medical record)">
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
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditImageModal;
