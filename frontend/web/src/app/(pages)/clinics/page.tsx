'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import { OperationsLayout, MetricCard, StatusBadge } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoClinics } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';

export default function ClinicsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { useClinics } = useClinic();
  const { data, isLoading, refetch } = useClinics({ page, size: 12 });
  const pageData = toPage(data?.data, demoClinics, page, 12);
  const clinics = (pageData?.content ?? []).filter((clinic) =>
    [clinic.clinicName, clinic.clinicCode, clinic.address, clinic.city].some((value) =>
      value?.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );
  const canManageClinics = !!user;

  return (
    <OperationsLayout
      title="Clinics"
      description="Manage clinic locations, treatment rooms, licensing details, and operational availability."
      icon="lucide:hospital"
      actions={[
        ...(canManageClinics
          ? [{ label: 'Add clinic', href: ROUTES.CLINIC_NEW, icon: 'lucide:plus', variant: 'primary' as const }]
          : []),
        { label: 'Services', href: ROUTES.SERVICES, icon: 'lucide:briefcase-medical' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Clinics" value={clinics.length} detail="Loaded locations" tone="brand" />
        <MetricCard label="Active" value={clinics.filter((clinic) => `${clinic.status}`.toLowerCase() === 'active').length} detail="Ready to serve" tone="green" />
        <MetricCard label="Cities" value={new Set(clinics.map((clinic) => clinic.city).filter(Boolean)).size || 1} detail="Coverage areas" tone="blue" />
        <MetricCard label="Licenses" value={clinics.filter((clinic) => clinic.licenseNumber).length} detail="Tracked records" />
      </div>

      <div className="mt-5 flex gap-3 border border-smile-border/50 bg-white p-4">
          <div className="relative flex-1">
          <Icon icon="lucide:search" width={17} className="absolute left-3 top-3 text-smile-description" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clinics on this page"
            className="h-10 w-full rounded-md border border-smile-border pl-9 pr-3 text-sm outline-none focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh clinics"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-smile-border bg-white"
          >
            <Icon icon="lucide:refresh-cw" width={17} />
          </button>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="py-16 text-center text-smile-description">Loading clinics...</div>
        ) : clinics.length === 0 ? (
          <div className="border-y border-dashed border-smile-border py-16 text-center text-smile-description">
            No clinics found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinics.map((clinic) => (
              <article key={clinic.clinicId} className="border border-smile-border/50 bg-white p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-smile-primary-dark">{clinic.clinicName}</h2>
                    <p className="mt-1 font-mono text-xs text-smile-description">{clinic.clinicCode}</p>
                  </div>
                  <StatusBadge tone={`${clinic.status}`.toLowerCase() === 'active' ? 'green' : 'orange'}>
                    {clinic.status}
                  </StatusBadge>
                </div>
                <div className="space-y-2 text-sm text-smile-title">
                  <p className="flex gap-2"><Icon icon="lucide:map-pin" width={16} />{clinic.address}</p>
                  {clinic.phone && <p className="flex gap-2"><Icon icon="lucide:phone" width={16} />{clinic.phone}</p>}
                  {clinic.email && <p className="flex gap-2"><Icon icon="lucide:mail" width={16} />{clinic.email}</p>}
                </div>
                <div className="mt-5 flex gap-2 border-t border-smile-border/30 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.CLINIC_DETAIL(clinic.clinicId))}
                    className="flex-1 rounded-md bg-smile-primary-dark px-3 py-2 text-sm font-medium text-white"
                  >
                    View details
                  </button>
                  {canManageClinics && (
                    <button
                      type="button"
                      title="Edit clinic"
                      onClick={() => router.push(ROUTES.CLINIC_EDIT(clinic.clinicId))}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-smile-border"
                    >
                      <Icon icon="lucide:pencil" width={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {(pageData?.totalPages ?? 0) > 1 && (
          <div className="mt-6 flex justify-center gap-3">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-md border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
            <span className="py-2 text-sm text-smile-title">Page {page + 1} of {pageData?.totalPages}</span>
            <button disabled={pageData?.last} onClick={() => setPage(page + 1)} className="rounded-md border px-4 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </OperationsLayout>
  );
}
