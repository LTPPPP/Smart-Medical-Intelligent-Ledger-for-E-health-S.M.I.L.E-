'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { toast } from '@/shared/lib/toast';
import {
  SpecialtyModalDark,
  type SpecialtyFormValues,
} from '@/features/service/components/SpecialtyModalDark';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

interface Specialty {
  specialty_id: string;
  specialty_name: string;
  specialty_code: string;
  description?: string | null;
  icon_url?: string | null;
  is_active: boolean;
  display_order?: number | null;
}

const SPECIALTY_KEY = ['specialties', 'list'] as const;

export default function SpecialtiesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: SPECIALTY_KEY,
    queryFn: () =>
      apiClient.get<{ data?: Specialty[] } | Specialty[]>(API_ENDPOINTS.SPECIALTY.LIST),
  });

  const specialties = useMemo<Specialty[]>(() => {
    const payload = (data as { data?: unknown } | undefined)?.data;
    if (Array.isArray(payload)) return payload as Specialty[];
    const inner = (payload as { data?: unknown })?.data;
    return Array.isArray(inner) ? (inner as Specialty[]) : [];
  }, [data]);

  const sorted = useMemo(
    () =>
      [...specialties].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      ),
    [specialties],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: SPECIALTY_KEY });

  const createMutation = useMutation({
    mutationFn: (values: SpecialtyFormValues) =>
      apiClient.post(API_ENDPOINTS.SPECIALTY.CREATE, values),
    onSuccess: () => {
      toast.success('Specialty created');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.apiError(err, 'Failed to create specialty'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SpecialtyFormValues }) =>
      apiClient.patch(API_ENDPOINTS.SPECIALTY.UPDATE(id), values),
    onSuccess: () => {
      toast.success('Specialty updated');
      invalidate();
      closeModal();
    },
    onError: (err) => toast.apiError(err, 'Failed to update specialty'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ENDPOINTS.SPECIALTY.DELETE(id)),
    onSuccess: () => {
      toast.success('Specialty deleted');
      invalidate();
      setDeletingId(null);
    },
    onError: (err) => {
      toast.apiError(err, 'Failed to delete specialty');
      setDeletingId(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (s: Specialty) => {
    setEditing(s);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = (values: SpecialtyFormValues) => {
    if (editing) updateMutation.mutate({ id: editing.specialty_id, values });
    else createMutation.mutate(values);
  };

  const handleDelete = (s: Specialty) => {
    if (window.confirm(`Delete specialty "${s.specialty_name}"? This cannot be undone.`)) {
      setDeletingId(s.specialty_id);
      deleteMutation.mutate(s.specialty_id);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-[28px] font-bold tracking-[-0.6px] text-white"
              style={{ fontFamily: 'Public Sans, sans-serif' }}
            >
              Specialties
            </h1>
            <p className="text-sm text-[#C1C7CF]">
              {specialties.length} specialt{specialties.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95"
            style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
          >
            <Icon icon="lucide:plus" width={16} /> Add Specialty
          </button>
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading specialties…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load specialties.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>
            No specialties found.
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {sorted.map((s) => {
              const isDeleting = deletingId === s.specialty_id && deleteMutation.isPending;
              return (
                <div key={s.specialty_id} className={`${cardBase} flex flex-col gap-4 p-6`}>
                  {/* Top */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-[#323538]">
                      <Icon icon="lucide:stethoscope" width={22} style={{ color: BLUE }} />
                    </span>
                    <div className="flex flex-1 flex-col gap-1">
                      <h3
                        className="text-[18px] font-semibold text-white"
                        style={{ fontFamily: 'Public Sans, sans-serif' }}
                      >
                        {s.specialty_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-semibold"
                          style={{ color: TEAL }}
                        >
                          {s.specialty_code}
                        </span>
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
                          style={
                            s.is_active
                              ? { background: 'rgba(69,240,207,0.15)', borderColor: 'rgba(69,240,207,0.3)', color: TEAL }
                              : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }
                          }
                        >
                          {s.is_active ? 'active' : 'inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="min-h-[40px] text-sm text-[#C1C7CF]">
                    {s.description || 'No description provided.'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs text-[#8B9199]">
                      Display order: {s.display_order ?? '—'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25"
                      >
                        <Icon icon="lucide:pencil" width={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={isDeleting}
                        className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300 transition hover:border-red-400/40 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Icon icon="line-md:loading-twotone-loop" width={13} />
                        ) : (
                          <Icon icon="lucide:trash-2" width={13} />
                        )}{' '}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <SpecialtyModalDark
          title={editing ? 'Edit Specialty' : 'Add Specialty'}
          submitting={createMutation.isPending || updateMutation.isPending}
          initial={
            editing
              ? {
                  specialty_name: editing.specialty_name,
                  specialty_code: editing.specialty_code,
                  description: editing.description ?? '',
                  display_order: editing.display_order ?? null,
                  is_active: editing.is_active,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </AppShell>
  );
}
