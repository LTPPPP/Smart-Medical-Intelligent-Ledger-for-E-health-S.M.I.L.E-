'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout';
import { PatientForm } from '@/features/patient/components/PatientForm';
import { ROUTES } from '@/shared/constants/routes';

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <ProtectedLayout requiredPermissions={['MEDICAL_RECORD_CREATE']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <button
              onClick={() => router.push(ROUTES.PATIENTS)}
              className="mb-4 flex items-center gap-2 text-green-100 hover:text-white transition-colors"
            >
              <Icon icon="mdi:arrow-left" width={20} />
              Quay lại danh sách
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:account-plus" width={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Thêm bệnh nhân mới</h1>
                <p className="text-green-100 mt-1">
                  Tạo hồ sơ bệnh nhân mới trong hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <PatientForm
            onSuccess={(patient) => {
              alert('Tạo hồ sơ bệnh nhân thành công!');
              router.push(ROUTES.PATIENT_DETAIL(patient.id));
            }}
            onCancel={() => router.push(ROUTES.PATIENTS)}
          />
        </div>
      </div>
    </ProtectedLayout>
  );
}
