'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';

export default function ClinicsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { useClinics } = useClinic();
  const { data, isLoading, error, refetch } = useClinics({ page, size: 12 });
  const pageData = data?.data;
  const clinics = (pageData?.content ?? []).filter((clinic) =>
    [clinic.clinicName, clinic.clinicCode, clinic.address, clinic.city].some((value) =>
      value?.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );
  const isAdmin = user?.roles.some((role) =>
    ['ADMIN', 'ROLE_ADMIN', 'CLINIC_ADMIN', 'ROLE_CLINIC_ADMIN', 'SUPER_ADMIN'].includes(role),
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinics</h1>
            <p className="mt-1 text-sm text-gray-600">Clinic locations, contact details, and rooms.</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push(ROUTES.CLINIC_NEW)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Icon icon="lucide:plus" width={18} />
              Add clinic
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-3 border-y border-gray-200 bg-white py-4">
          <div className="relative flex-1">
            <Icon icon="lucide:search" width={17} className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clinics on this page"
              className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh clinics"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white"
          >
            <Icon icon="lucide:refresh-cw" width={17} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">Loading clinics...</div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Unable to load clinics.
          </div>
        ) : clinics.length === 0 ? (
          <div className="border-y border-dashed border-gray-300 py-16 text-center text-gray-500">
            No clinics found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinics.map((clinic) => (
              <article key={clinic.clinicId} className="border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{clinic.clinicName}</h2>
                    <p className="mt-1 font-mono text-xs text-gray-500">{clinic.clinicCode}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold uppercase text-green-700">
                    {clinic.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex gap-2"><Icon icon="lucide:map-pin" width={16} />{clinic.address}</p>
                  {clinic.phone && <p className="flex gap-2"><Icon icon="lucide:phone" width={16} />{clinic.phone}</p>}
                  {clinic.email && <p className="flex gap-2"><Icon icon="lucide:mail" width={16} />{clinic.email}</p>}
                </div>
                <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.CLINIC_DETAIL(clinic.clinicId))}
                    className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                  >
                    View details
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      title="Edit clinic"
                      onClick={() => router.push(ROUTES.CLINIC_EDIT(clinic.clinicId))}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300"
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
            <span className="py-2 text-sm text-gray-600">Page {page + 1} of {pageData?.totalPages}</span>
            <button disabled={pageData?.last} onClick={() => setPage(page + 1)} className="rounded-md border px-4 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </main>
  );
}
