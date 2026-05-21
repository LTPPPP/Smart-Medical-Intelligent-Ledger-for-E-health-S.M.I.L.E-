'use client';

import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout';
import { usePatient } from '@/features/patient/hooks/usePatient';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';
import { MedicalRecordForm } from '@/features/patient/components/MedicalRecordForm';

export default function NewMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { usePatientById } = usePatient();
  const { data, isLoading, error, refetch } = usePatientById(patientId);

  const patient = data?.data;

  if (isLoading)
    return <Loading fullScreen text="Đang tải thông tin bệnh nhân..." />;
  if (error)
    return (
      <ErrorMessage
        message="Không thể tải thông tin bệnh nhân"
        onRetry={refetch}
      />
    );
  if (!patient) return <ErrorMessage message="Không tìm thấy bệnh nhân" />;

  return (
    <ProtectedLayout requiredPermissions={['MEDICAL_RECORD_CREATE']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <button
              onClick={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
              className="mb-4 flex items-center gap-2 text-purple-100 hover:text-white transition-colors"
            >
              <Icon icon="mdi:arrow-left" width={20} />
              Quay lại hồ sơ bệnh nhân
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:file-document-plus" width={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Tạo bệnh án mới</h1>
                <p className="text-purple-100 mt-1">
                  Bệnh nhân: {patient.fullName} ({patient.patientCode})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <MedicalRecordForm
            patientId={patientId}
            onSuccess={(record) => {
              alert('Tạo bệnh án thành công!');
              router.push(
                `${ROUTES.PATIENT_DETAIL(patientId)}/medical-records/${record.id}`,
              );
            }}
            onCancel={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
          />
        </div>
      </div>
    </ProtectedLayout>
  );
}
