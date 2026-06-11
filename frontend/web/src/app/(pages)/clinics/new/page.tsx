'use client';

import { useRouter } from 'next/navigation';
import { ClinicForm } from '@/features/clinic/components/ClinicForm';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import type { CreateClinicRequest, UpdateClinicRequest } from '@/features/clinic/types/clinic.type';
import { ROUTES } from '@/shared/constants/routes';

export default function NewClinicPage() {
  const router = useRouter();
  const { createClinic, isCreatingClinic } = useClinic();

  const handleSubmit = async (data: CreateClinicRequest | UpdateClinicRequest) => {
    if (!('clinicCode' in data)) return;
    const response = await createClinic(data);
    router.push(ROUTES.CLINIC_DETAIL(response.data.clinicId));
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Create clinic</h1>
        <p className="mb-6 text-sm text-gray-600">Add contact, license, and operating-hour details.</p>
        <ClinicForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(ROUTES.CLINICS)}
          isSubmitting={isCreatingClinic}
        />
      </div>
    </main>
  );
}
