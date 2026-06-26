'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { doctorName, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const GATEWAY = ENV.SERVICES.GATEWAY;

interface Annotation {
  annotation_id: string;
  image_id: string;
  annotated_by?: string;
  annotation_type?: string;
  annotation_data?: Record<string, unknown>;
  note?: string;
  created_at?: string;
}

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

export function AnnotationModal({
  imageId,
  annotatedBy,
  onClose,
}: {
  imageId: string;
  annotatedBy: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [annotationType, setAnnotationType] = useState('');
  const [note, setNote] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['image-annotations', imageId],
    queryFn: () => apiClient.get(`${GATEWAY}/image-annotations/image/${imageId}`),
    enabled: !!imageId,
  });
  const annotations = useMemo(() => unwrapArr<Annotation>(data), [data]);

  const inv = () => qc.invalidateQueries({ queryKey: ['image-annotations', imageId] });

  const createAnn = useMutation({
    mutationFn: () =>
      apiClient.post(`${GATEWAY}/image-annotations`, {
        image_id: imageId,
        annotated_by: annotatedBy,
        annotation_type: annotationType.trim() || undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Annotation added');
      setAnnotationType('');
      setNote('');
      inv();
    },
    onError: (e) => toast.apiError(e, 'Failed to add annotation'),
  });

  const deleteAnn = useMutation({
    mutationFn: (annotationId: string) => apiClient.delete(`${GATEWAY}/image-annotations/${annotationId}`),
    onSuccess: () => { toast.success('Annotation deleted'); inv(); },
    onError: (e) => toast.apiError(e, 'Failed to delete annotation'),
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !annotationType.trim()) {
      toast.warning('Add a note or a type.');
      return;
    }
    createAnn.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>Annotations</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {/* List */}
        <div className="mb-5 flex flex-col gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-smile-description">
              <Icon icon="line-md:loading-twotone-loop" width={18} /> Loading annotations…
            </div>
          )}
          {isError && !isLoading && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              Failed to load.{' '}
              <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
            </div>
          )}
          {!isLoading && !isError && annotations.length === 0 && (
            <p className="py-2 text-sm text-smile-description">No annotations yet.</p>
          )}
          {annotations.map((a) => (
            <div key={a.annotation_id} className="flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)] p-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {a.annotation_type && <span className="rounded-full [background:var(--surface-panel-bg)] px-2 py-0.5 text-[11px] text-smile-description">{a.annotation_type}</span>}
                  <span className="text-xs text-smile-description">{doctorName(a.annotated_by)}</span>
                </div>
                {a.note && <span className="text-sm text-smile-title">{a.note}</span>}
              </div>
              <button
                onClick={() => { if (confirm('Delete this annotation?')) deleteAnn.mutate(a.annotation_id); }}
                className="shrink-0 rounded p-1 text-red-300 transition hover:text-red-200"
              >
                <Icon icon="lucide:trash-2" width={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add */}
        <form onSubmit={add} className="flex flex-col gap-3 border-t [border-color:var(--surface-card-border)] pt-4">
          <input className={inputCls} value={annotationType} placeholder="Type (optional, e.g. finding)" onChange={(e) => setAnnotationType(e.target.value)} />
          <textarea
            className="min-h-[70px] rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]"
            value={note}
            placeholder="Annotation note…"
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createAnn.isPending}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
            >
              {createAnn.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Add annotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AnnotationModal;
