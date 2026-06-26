'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const GATEWAY = ENV.SERVICES.GATEWAY;

interface Category {
  category_id: string;
  category_name: string;
  description?: string;
}

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

export function CategoryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['image-categories'],
    queryFn: () => apiClient.get(`${GATEWAY}/image-categories`),
  });
  const categories = useMemo(() => unwrapArr<Category>(data), [data]);

  const inv = () => qc.invalidateQueries({ queryKey: ['image-categories'] });
  const reset = () => { setEditingId(null); setName(''); setDescription(''); };

  const createCat = useMutation({
    mutationFn: () => apiClient.post(`${GATEWAY}/image-categories`, {
      category_name: name.trim(),
      description: description.trim() || undefined,
    }),
    onSuccess: () => { toast.success('Category added'); reset(); inv(); },
    onError: (e) => toast.apiError(e, 'Failed to add category'),
  });

  const updateCat = useMutation({
    mutationFn: (id: string) => apiClient.patch(`${GATEWAY}/image-categories/${id}`, {
      category_name: name.trim(),
      description: description.trim() || undefined,
    }),
    onSuccess: () => { toast.success('Category updated'); reset(); inv(); },
    onError: (e) => toast.apiError(e, 'Failed to update category'),
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${GATEWAY}/image-categories/${id}`),
    onSuccess: () => { toast.success('Category deleted'); inv(); },
    onError: (e) => toast.apiError(e, 'Failed to delete category'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.warning('Category name is required.'); return; }
    if (editingId) updateCat.mutate(editingId);
    else createCat.mutate();
  };

  const saving = createCat.isPending || updateCat.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>Image categories</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {/* List */}
        <div className="mb-5 flex flex-col gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-smile-description">
              <Icon icon="line-md:loading-twotone-loop" width={18} /> Loading categories…
            </div>
          )}
          {isError && !isLoading && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              Failed to load.{' '}
              <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
            </div>
          )}
          {!isLoading && !isError && categories.length === 0 && (
            <p className="py-2 text-sm text-smile-description">No categories yet.</p>
          )}
          {categories.map((c) => (
            <div key={c.category_id} className="flex items-start justify-between gap-3 rounded-xl border [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)] p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-smile-title">{c.category_name}</span>
                {c.description && <span className="text-xs text-smile-description">{c.description}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => { setEditingId(c.category_id); setName(c.category_name); setDescription(c.description ?? ''); }}
                  className="rounded p-1 text-smile-description transition hover:text-smile-title"
                >
                  <Icon icon="lucide:pencil" width={14} />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete category "${c.category_name}"?`)) deleteCat.mutate(c.category_id); }}
                  className="rounded p-1 text-red-300 transition hover:text-red-200"
                >
                  <Icon icon="lucide:trash-2" width={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add / edit */}
        <form onSubmit={submit} className="flex flex-col gap-3 border-t [border-color:var(--surface-card-border)] pt-4">
          <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{editingId ? 'Edit category' : 'Add category'}</span>
          <input className={inputCls} value={name} placeholder="Category name" onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} value={description} placeholder="Description (optional)" onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end gap-3">
            {editingId && (
              <button type="button" onClick={reset} className="rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-white/25">Cancel edit</button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
            >
              {saving && <Icon icon="line-md:loading-twotone-loop" width={16} />} {editingId ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;
