'use client';

import { useMemo, useState } from 'react';
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

interface Patient {
  patient_id: string;
  patient_code: string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
}

function unwrapArr<T>(res: unknown): T[] {
  const payload = (res as { data?: unknown })?.data;
  if (Array.isArray(payload)) return payload as T[];
  const inner = (payload as { data?: unknown })?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');

export default function PatientsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.PATIENT.LIST),
  });

  const patients = useMemo(() => unwrapArr<Patient>(data), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        (p.full_name ?? '').toLowerCase().includes(q) ||
        (p.patient_code ?? '').toLowerCase().includes(q),
    );
  }, [patients, search]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Patients
            </h1>
            <p className="text-sm text-[#C1C7CF]">
              {patients.length} patient{patients.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href={ROUTES.PATIENT_NEW}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95"
            style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
          >
            <Icon icon="lucide:plus" width={16} /> Add Patient
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Icon icon="lucide:search" width={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9199]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="h-11 w-full rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] pl-10 pr-4 text-sm text-white placeholder:text-[#6B7280] outline-none transition focus:border-[rgba(146,205,253,0.5)]"
          />
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading patients…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load patients.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>
            {patients.length === 0 ? 'No patients found.' : 'No patients match your search.'}
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className={`${cardBase} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[1px] text-[#8B9199]">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Gender</th>
                  <th className="px-5 py-3 font-semibold">Date of birth</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.patient_id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-semibold" style={{ color: TEAL }}>
                        {p.patient_code}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{p.full_name}</td>
                    <td className="px-5 py-3 capitalize text-[#C1C7CF]">{(p.gender ?? '—').toLowerCase()}</td>
                    <td className="px-5 py-3 text-[#C1C7CF]">{fmtDate(p.date_of_birth)}</td>
                    <td className="px-5 py-3 text-[#C1C7CF]">{p.phone || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={ROUTES.PATIENT_DETAIL(p.patient_id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
