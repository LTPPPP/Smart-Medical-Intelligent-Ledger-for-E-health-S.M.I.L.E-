'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { PatientDashboard } from '@/features/patient/components/PatientDashboard';
import { AdvancedPatientSearch } from '@/features/patient/components/AdvancedPatientSearch';
import { PatientList } from '@/features/patient/components/PatientList';
import { ROUTES } from '@/shared/constants/routes';

type ViewMode = 'list' | 'search' | 'dashboard';

const VIEW_TABS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'list', label: 'Danh sách', icon: 'mdi:view-list' },
  { id: 'search', label: 'Tìm kiếm', icon: 'mdi:magnify' },
  { id: 'dashboard', label: 'Thống kê', icon: 'mdi:chart-box' },
];

export default function PatientsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    <div className="min-h-screen bg-[#E7ECEF]">
      {/* Teal gradient header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                <Icon icon="mdi:account-multiple" width={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quản lý bệnh nhân</h1>
                <p className="text-teal-100 text-sm mt-0.5">Hồ sơ & thông tin bệnh nhân</p>
              </div>
            </div>

            <button
              onClick={() => router.push(ROUTES.PATIENT_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-white text-teal-700 font-semibold rounded-xl shadow-md hover:brightness-95 hover:-translate-y-px transition-all text-sm"
            >
              <Icon icon="mdi:plus" width={18} />
              Thêm bệnh nhân
            </button>
          </div>

          {/* Segmented control for view mode */}
          <div className="inline-flex p-1 gap-0.5 bg-white/15 border border-white/20 rounded-full backdrop-blur-sm">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={
                  viewMode === tab.id
                    ? 'inline-flex items-center gap-1.5 px-4 min-h-[36px] rounded-full text-sm font-semibold bg-white text-teal-700 shadow-sm transition-all'
                    : 'inline-flex items-center gap-1.5 px-4 min-h-[36px] rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors'
                }
              >
                <Icon icon={tab.icon} width={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {viewMode === 'dashboard' && <PatientDashboard />}
        {viewMode === 'search' && <AdvancedPatientSearch />}
        {viewMode === 'list' && <PatientList />}
      </div>
    </div>
  );
}
