'use client';

import { useParams, useRouter } from 'next/navigation';
import { ClinicForm } from '@/features/clinic/components/ClinicForm';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import type { CreateClinicRequest, UpdateClinicRequest } from '@/features/clinic/types/clinic.type';
import { ROUTES } from '@/shared/constants/routes';

export default function EditClinicPage() {
  const router = useRouter();
  const clinicId = useParams().id as string;
  const { useClinicById, updateClinic, isUpdatingClinic } = useClinic();
  const { data, isLoading, error, refetch } = useClinicById(clinicId);

  if (isLoading) return <Loading fullScreen text="Loading clinic..." />;
  if (error || !data?.data) return <ErrorMessage message="Unable to load clinic" onRetry={refetch} />;

  const handleSubmit = async (request: CreateClinicRequest | UpdateClinicRequest) => {
    const { clinicCode: _clinicCode, ...updateRequest } = request as CreateClinicRequest;
    await updateClinic({ clinicId, request: updateRequest });
    router.push(ROUTES.CLINIC_DETAIL(clinicId));
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Edit clinic</h1>
        <p className="mb-6 text-sm text-gray-600">Update clinic information and operating hours.</p>
        <ClinicForm
          clinic={data.data}
          onSubmit={handleSubmit}
          onCancel={() => router.push(ROUTES.CLINIC_DETAIL(clinicId))}
          isSubmitting={isUpdatingClinic}
        />
      </div>
    </main>
  );
}
