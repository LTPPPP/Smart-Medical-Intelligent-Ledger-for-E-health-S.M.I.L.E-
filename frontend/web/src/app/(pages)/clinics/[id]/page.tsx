'use client';

import { useParams, useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { TreatmentRoomsList } from '@/features/clinic/components/TreatmentRoomsList';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

export default function ClinicDetailPage() {
  const router = useRouter();
  const clinicId = useParams().id as string;
  const { useClinicById } = useClinic();
  const { data, isLoading, error, refetch } = useClinicById(clinicId);
  const clinic = data?.data;
  const canManageClinic = true;

  if (isLoading) return <Loading fullScreen text="Loading clinic..." />;
  if (error || !clinic) return <ErrorMessage message="Unable to load clinic" onRetry={refetch} />;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => router.push(ROUTES.CLINICS)} className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Icon icon="lucide:arrow-left" width={17} />
          Clinics
        </button>
        <header className="border-y border-gray-200 bg-white py-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{clinic.clinicName}</h1>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold uppercase text-green-700">{clinic.status}</span>
              </div>
              <p className="font-mono text-sm text-gray-500">{clinic.clinicCode}</p>
            </div>
            {canManageClinic && (
              <button type="button" onClick={() => router.push(ROUTES.CLINIC_EDIT(clinicId))} className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-semibold">
                <Icon icon="lucide:pencil" width={17} />
                Edit clinic
              </button>
            )}
          </div>
          <div className="mt-6 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
            <p className="flex gap-2"><Icon icon="lucide:map-pin" width={17} />{[clinic.address, clinic.ward, clinic.district, clinic.city].filter(Boolean).join(', ')}</p>
            {clinic.phone && <p className="flex gap-2"><Icon icon="lucide:phone" width={17} />{clinic.phone}</p>}
            {clinic.email && <p className="flex gap-2"><Icon icon="lucide:mail" width={17} />{clinic.email}</p>}
            {clinic.website && <p className="flex gap-2"><Icon icon="lucide:globe" width={17} />{clinic.website}</p>}
            {clinic.licenseNumber && <p className="flex gap-2"><Icon icon="lucide:badge-check" width={17} />License {clinic.licenseNumber}</p>}
          </div>
        </header>

        {clinic.operatingHours && (
          <section className="py-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Operating hours</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(clinic.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between border border-gray-200 bg-white px-3 py-2 text-sm">
                  <span className="capitalize text-gray-600">{day}</span>
                  <span className="font-medium text-gray-900">{hours}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-gray-200 pt-6">
          <TreatmentRoomsList clinicId={clinicId} />
        </section>
      </div>
    </main>
  );
}
