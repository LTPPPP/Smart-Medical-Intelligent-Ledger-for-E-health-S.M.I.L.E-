'use client';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

import { useClinic } from '@/features/clinic/hooks/useClinic';
import { ClinicForm } from '@/features/clinic/components/ClinicForm';
import { CreateClinicRequest, UpdateClinicRequest} from '@/features/clinic/types/clinic.type';

import { ROUTES } from '@/shared/constants/routes';

export default function NewClinicPage() {
  const router = useRouter();
  const { createClinic, isCreatingClinic } = useClinic();

  const handleSubmit = async (data: CreateClinicRequest | UpdateClinicRequest) => {
    try {
      await createClinic(data as CreateClinicRequest);
      alert('Clinic created successfully!');
      router.push(ROUTES.CLINICS);
    } catch {
      alert('Failed to create clinic');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800">Create New Clinic</h1>
          <p className="text-gray-600 mt-1">Add a new dental clinic to the system</p>
        </div>

        <ClinicForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreatingClinic}
        />
      </div>
    </div>
  );
}