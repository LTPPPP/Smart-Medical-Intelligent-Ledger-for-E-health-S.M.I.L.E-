'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { AdvancedPatientSearch } from '@/features/patient/components/AdvancedPatientSearch';
import { PatientDashboard } from '@/features/patient/components/PatientDashboard';
import { PatientList } from '@/features/patient/components/PatientList';
import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoPatients } from '@/shared/data/clinicalDemoData';

type ViewMode = 'dashboard' | 'search' | 'list';

export default function PatientsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    <OperationsLayout
      title="Patients and Medical Records"
      description="Search patients, open the longitudinal chart, manage dental images, and create medical records without leaving the clinical workspace."
      icon="lucide:users"
      actions={[
        { label: 'Add patient', href: ROUTES.PATIENT_NEW, icon: 'lucide:user-plus', variant: 'primary' },
        { label: 'Open demo chart', href: ROUTES.PATIENT_DETAIL(demoPatients[0].id), icon: 'lucide:file-heart' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Demo patient" value={demoPatients.length} detail="Seeded chart ready" tone="brand" />
        <MetricCard label="Records" value="1" detail="Medical record sample" tone="blue" />
        <MetricCard label="Images" value="1" detail="Dental image category" />
        <MetricCard label="Allergy flags" value="1" detail="Clinical safety note" tone="orange" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border border-smile-border/50 bg-white p-3">
        {[
          { id: 'list' as const, label: 'Patient list', icon: 'mdi:view-list' },
          { id: 'search' as const, label: 'Advanced search', icon: 'mdi:magnify' },
          { id: 'dashboard' as const, label: 'Dashboard', icon: 'mdi:chart-box' },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setViewMode(mode.id)}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${
              viewMode === mode.id
                ? 'bg-smile-primary text-white'
                : 'text-smile-title hover:bg-smile-footer-bg hover:text-smile-primary-dark'
            }`}
          >
            <Icon icon={mode.icon} width={17} />
            {mode.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {viewMode === 'dashboard' && <PatientDashboard />}
        {viewMode === 'search' && <AdvancedPatientSearch />}
        {viewMode === 'list' && <PatientList />}
      </div>
    </OperationsLayout>
  );
}
