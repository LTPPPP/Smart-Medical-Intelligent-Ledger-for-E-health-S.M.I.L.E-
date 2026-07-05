'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { RoomModal, type RoomFormValues } from '@/features/clinic/components/RoomModal';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#38BDF8';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

interface OpenClose { open: string; close: string }
interface Clinic {
  clinic_id: string; clinic_name: string; clinic_code: string;
  address?: string; ward?: string; district?: string; city?: string;
  phone?: string; email?: string; website?: string; status?: string;
  license_number?: string; operating_hours?: Record<string, OpenClose | null>;
}
interface Room {
  room_id: string; room_name: string; room_code: string;
  room_type?: string; floor_number?: number | null; capacity?: number | null; status?: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
const ROOM_STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'text-[#38BDF8]',
  OCCUPIED: 'text-amber-300',
  MAINTENANCE: 'text-red-300',
};

function unwrap<T>(res: unknown): T | null {
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

export default function ClinicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data: clinicRes, isLoading } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.DETAIL(id)),
    enabled: !!id,
  });
  const { data: roomsRes } = useQuery({
    queryKey: ['clinic', id, 'rooms'],
    queryFn: () => apiClient.get(API_ENDPOINTS.TREATMENT_ROOM.BY_CLINIC(id)),
    enabled: !!id,
  });

  const clinic = useMemo(() => unwrap<Clinic>(clinicRes), [clinicRes]);
  const rooms = useMemo(() => unwrapArr<Room>(roomsRes), [roomsRes]);
  const active = (clinic?.status ?? '').toUpperCase() === 'ACTIVE';

  const invalidateRooms = () => qc.invalidateQueries({ queryKey: ['clinic', id, 'rooms'] });

  const createRoom = useMutation({
    mutationFn: (v: RoomFormValues) => apiClient.post(API_ENDPOINTS.TREATMENT_ROOM.CREATE(id), v),
    onSuccess: () => { toast.success('Room added'); invalidateRooms(); setModalOpen(false); },
    onError: (e) => toast.apiError(e, 'Failed to add room'),
  });
  const updateRoom = useMutation({
    mutationFn: ({ roomId, v }: { roomId: string; v: RoomFormValues }) => apiClient.patch(API_ENDPOINTS.TREATMENT_ROOM.UPDATE(id, roomId), v),
    onSuccess: () => { toast.success('Room updated'); invalidateRooms(); setModalOpen(false); setEditingRoom(null); },
    onError: (e) => toast.apiError(e, 'Failed to update room'),
  });
  const deleteRoom = useMutation({
    mutationFn: (roomId: string) => apiClient.delete(API_ENDPOINTS.TREATMENT_ROOM.DELETE(id, roomId)),
    onSuccess: () => { toast.success('Room deleted'); invalidateRooms(); },
    onError: (e) => toast.apiError(e, 'Failed to delete room'),
  });
  const deleteClinic = useMutation({
    mutationFn: () => apiClient.delete(API_ENDPOINTS.CLINIC.DELETE(id)),
    onSuccess: () => { toast.success('Clinic deleted'); router.push(ROUTES.CLINICS); },
    onError: (e) => toast.apiError(e, 'Failed to delete clinic'),
  });

  const openAdd = () => { setEditingRoom(null); setModalOpen(true); };
  const openEdit = (r: Room) => { setEditingRoom(r); setModalOpen(true); };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push(ROUTES.CLINICS)} className="flex items-center gap-2 text-sm text-[#C1C7CF] transition hover:text-white">
            <Icon icon="lucide:arrow-left" width={16} /> Back to clinics
          </button>
          {clinic && (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.CLINIC_EDIT(clinic.clinic_id)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25">
                <Icon icon="lucide:pencil" width={15} /> Edit
              </Link>
              <button
                onClick={() => { if (confirm('Delete this clinic? This cannot be undone.')) deleteClinic.mutate(); }}
                className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
              >
                <Icon icon="lucide:trash-2" width={15} /> Delete
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-20 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
          </div>
        )}
        {!isLoading && !clinic && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>Clinic not found.</div>
        )}

        {clinic && (
          <>
            {/* Header card */}
            <div className={`${cardBase} flex flex-col gap-5 p-6`}>
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-[#24384A]">
                  <Icon icon="lucide:building-2" width={26} style={{ color: BLUE }} />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h1 className="text-[26px] font-bold tracking-[-0.5px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>{clinic.clinic_name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-semibold" style={{ color: TEAL }}>{clinic.clinic_code}</span>
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
                      style={active ? { background: 'rgba(56, 189, 248,0.15)', borderColor: 'rgba(56, 189, 248,0.3)', color: TEAL } : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }}>
                      {(clinic.status ?? 'unknown').toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-[#C1C7CF] sm:grid-cols-2">
                <Info icon="lucide:map-pin" text={[clinic.address, clinic.district, clinic.city].filter(Boolean).join(', ') || '—'} />
                <Info icon="lucide:phone" text={clinic.phone || '—'} />
                <Info icon="lucide:mail" text={clinic.email || '—'} />
                <Info icon="lucide:globe" text={clinic.website || '—'} />
                <Info icon="lucide:badge-check" text={`License: ${clinic.license_number || '—'}`} />
              </div>
            </div>

            {/* Operating hours */}
            <div className={`${cardBase} flex flex-col gap-3 p-6`}>
              <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>Operating hours</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DAYS.map((d) => {
                  const t = clinic.operating_hours?.[d];
                  return (
                    <div key={d} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="text-[#C1C7CF]">{DAY_LABEL[d]}</span>
                      <span className="font-medium" style={{ color: t ? '#E1E2E6' : '#8B9199' }}>{t ? `${t.open} – ${t.close}` : 'Closed'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Treatment rooms */}
            <div className={`${cardBase} flex flex-col gap-4 p-6`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                  Treatment rooms <span className="text-[#8B9199]">({rooms.length})</span>
                </h2>
                <button onClick={openAdd} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE }}>
                  <Icon icon="lucide:plus" width={14} /> Add room
                </button>
              </div>
              {rooms.length === 0 ? (
                <p className="text-sm text-[#8B9199]">No treatment rooms yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((r) => (
                    <div key={r.room_id} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[rgba(20, 33, 46,0.5)] p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#24384A]">
                        <Icon icon="lucide:door-open" width={18} style={{ color: BLUE }} />
                      </span>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-white">{r.room_name}</span>
                        <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: TEAL }}>
                          {r.room_code} · {r.room_type ?? 'room'}
                        </span>
                        <span className={`text-[11px] font-semibold ${ROOM_STATUS_STYLE[(r.status ?? '').toUpperCase()] ?? 'text-[#8B9199]'}`}>
                          {r.status ?? '—'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(r)} className="rounded p-1 text-[#C1C7CF] transition hover:text-white"><Icon icon="lucide:pencil" width={14} /></button>
                        <button
                          onClick={() => { if (confirm(`Delete room "${r.room_name}"?`)) deleteRoom.mutate(r.room_id); }}
                          className="rounded p-1 text-red-300 transition hover:text-red-200"
                        ><Icon icon="lucide:trash-2" width={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <RoomModal
          title={editingRoom ? 'Edit room' : 'Add treatment room'}
          submitting={createRoom.isPending || updateRoom.isPending}
          initial={editingRoom ?? undefined}
          onClose={() => { setModalOpen(false); setEditingRoom(null); }}
          onSubmit={(v) => (editingRoom ? updateRoom.mutate({ roomId: editingRoom.room_id, v }) : createRoom.mutate(v))}
        />
      )}
    </AppShell>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon icon={icon} width={16} className="mt-0.5 shrink-0" style={{ color: '#92CDFD' }} />
      <span>{text}</span>
    </div>
  );
}
