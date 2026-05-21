'use client';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useClinic } from '@/features/clinic/hooks/useClinic';
import { ClinicForm } from '@/features/clinic/components/ClinicForm';
import { UpdateClinicRequest } from '@/features/clinic/types/clinic.type';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

export default function EditClinicPage() {
  const router = useRouter();
  const params = useParams();
  const clinicId = params?.id as string;

  const { useClinicById, updateClinic, isUpdatingClinic } = useClinic();
  const { data, isLoading, error, refetch } = useClinicById(clinicId);

  const handleSubmit = async (formData: UpdateClinicRequest) => {
    try {
      await updateClinic({ clinicId, request: formData });
      alert('Clinic updated successfully!');
      router.push(`/clinics/${clinicId}`);
    } catch {
      alert('Failed to update clinic');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) return <Loading fullScreen text="Loading clinic..." />;
  if (error) return <ErrorMessage message="Failed to load clinic" onRetry={refetch} />;

  const clinic = data?.data;
  if (!clinic) return <ErrorMessage message="Clinic not found" />;

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
          
          <h1 className="text-3xl font-bold text-gray-800">Edit Clinic</h1>
          <p className="text-gray-600 mt-1">Update clinic information</p>
        </div>

        <ClinicForm
          clinic={clinic}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isUpdatingClinic}
        />
      </div>
    </div>
  );
}