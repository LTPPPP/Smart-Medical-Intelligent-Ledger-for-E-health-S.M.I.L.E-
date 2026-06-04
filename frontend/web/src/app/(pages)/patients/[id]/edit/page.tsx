'use client';

import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout';
import { PatientForm } from '@/features/patient/components/PatientForm';
import { usePatient } from '@/features/patient/hooks/usePatient';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

export default function EditPatientPage() {
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
    <ProtectedLayout requiredPermissions={['MEDICAL_RECORD_UPDATE']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <button
              onClick={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
              className="mb-4 flex items-center gap-2 text-orange-100 hover:text-white transition-colors"
            >
              <Icon icon="mdi:arrow-left" width={20} />
              Quay lại hồ sơ
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:pencil" width={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Chỉnh sửa hồ sơ</h1>
                <p className="text-orange-100 mt-1">
                  {patient.fullName} - {patient.patientCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <PatientForm
            patient={patient}
            onSuccess={(updatedPatient) => {
              alert('Cập nhật hồ sơ thành công!');
              router.push(ROUTES.PATIENT_DETAIL(updatedPatient.id));
            }}
            onCancel={() => router.push(ROUTES.PATIENT_DETAIL(patientId))}
          />
        </div>
      </div>
    </ProtectedLayout>
  );
}
