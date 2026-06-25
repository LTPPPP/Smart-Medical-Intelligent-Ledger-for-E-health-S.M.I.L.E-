'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

interface OpenClose { open: string; close: string }
interface Clinic {
  clinic_id: string;
  clinic_name: string;
  clinic_code: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
  license_number?: string;
  operating_hours?: Record<string, OpenClose | null>;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function todayHours(oh?: Record<string, OpenClose | null>): string {
  if (!oh) return '—';
  const day = DAYS[(new Date().getDay() + 6) % 7]; // JS Sun=0 → our Mon=0
  const t = oh[day];
  return t ? `${t.open} – ${t.close}` : 'Closed today';
}

export default function ClinicsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get<{ data?: Clinic[] } | Clinic[]>(API_ENDPOINTS.CLINIC.LIST),
  });

  const clinics = useMemo<Clinic[]>(() => {
    const payload = (data as { data?: unknown } | undefined)?.data;
    if (Array.isArray(payload)) return payload as Clinic[];
    const inner = (payload as { data?: unknown })?.data;
    return Array.isArray(inner) ? (inner as Clinic[]) : [];
  }, [data]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Clinics
            </h1>
            <p className="text-sm text-[#C1C7CF]">
              {clinics.length} location{clinics.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href={ROUTES.CLINIC_NEW}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95"
            style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
          >
            <Icon icon="lucide:plus" width={16} /> Add Clinic
          </Link>
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading clinics…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load clinics.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && clinics.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>No clinics found.</div>
        )}

        {/* Grid */}
        {!isLoading && !isError && clinics.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {clinics.map((c) => {
              const active = (c.status ?? '').toUpperCase() === 'ACTIVE';
              const fullAddress = [c.address, c.district, c.city].filter(Boolean).join(', ');
              return (
                <div key={c.clinic_id} className={`${cardBase} flex flex-col gap-4 p-6`}>
                  {/* Top */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-[#323538]">
                      <Icon icon="lucide:building-2" width={22} style={{ color: BLUE }} />
                    </span>
                    <div className="flex flex-1 flex-col gap-1">
                      <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                        {c.clinic_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-semibold" style={{ color: TEAL }}>
                          {c.clinic_code}
                        </span>
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
                          style={
                            active
                              ? { background: 'rgba(69,240,207,0.15)', borderColor: 'rgba(69,240,207,0.3)', color: TEAL }
                              : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }
                          }
                        >
                          {(c.status ?? 'unknown').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-2.5 text-sm text-[#C1C7CF]">
                    <div className="flex items-start gap-2.5">
                      <Icon icon="lucide:map-pin" width={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
                      <span>{fullAddress || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:phone" width={16} className="shrink-0" style={{ color: BLUE }} />
                      <span>{c.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:mail" width={16} className="shrink-0" style={{ color: BLUE }} />
                      <span>{c.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:clock" width={16} className="shrink-0" style={{ color: BLUE }} />
                      <span>Today: {todayHours(c.operating_hours)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs text-[#8B9199]">License: {c.license_number || '—'}</span>
                    <Link
                      href={ROUTES.CLINIC_DETAIL(c.clinic_id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
