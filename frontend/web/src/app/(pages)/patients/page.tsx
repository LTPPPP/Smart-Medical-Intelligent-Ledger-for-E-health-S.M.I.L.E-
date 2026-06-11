'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout';
import { PatientDashboard } from '@/features/patient/components/PatientDashboard';
import { AdvancedPatientSearch } from '@/features/patient/components/AdvancedPatientSearch';
import { PatientList } from '@/features/patient/components/PatientList';
import { ROUTES } from '@/shared/constants/routes';

type ViewMode = 'dashboard' | 'search' | 'list';

export default function PatientsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    // <ProtectedLayout requiredPermissions={['MEDICAL_RECORD_READ']}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:account-multiple" width={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Quản lý bệnh nhân</h1>
                <p className="text-green-100 mt-1">
                  Quản lý hồ sơ và thông tin bệnh nhân
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push(ROUTES.PATIENT_NEW)}
              className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 font-medium shadow-lg"
            >
              <Icon icon="mdi:plus" width={20} />
              Thêm bệnh nhân
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              {
                id: 'list' as const,
                label: 'Danh sách',
                icon: 'mdi:view-list',
              },
              {
                id: 'search' as const,
                label: 'Tìm kiếm nâng cao',
                icon: 'mdi:magnify',
              },
              {
                id: 'dashboard' as const,
                label: 'Thống kê',
                icon: 'mdi:chart-box',
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === mode.id
                    ? 'bg-green-900 text-white-600'
                    : 'bg-white bg-opacity-20 text-green-600 hover:bg-opacity-30'
                }`}
              >
                <Icon icon={mode.icon} width={18} />
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'dashboard' && <PatientDashboard />}
        {viewMode === 'search' && <AdvancedPatientSearch />}
        {viewMode === 'list' && <PatientList />}
      </div>
    </div>
    // </ProtectedLayout>
  );
}
