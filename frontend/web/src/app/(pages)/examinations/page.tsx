'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { ExaminationDetail } from '@/features/examination/components/ExaminationDetail';
import { useExamination } from '@/features/examination/hooks/useExamination';
import { OperationsLayout, MetricCard, StatusBadge } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { DEMO_IDS, demoExaminations } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';

export default function ExaminationsPage() {
  const [patientInput, setPatientInput] = useState(DEMO_IDS.patient);
  const [patientId, setPatientId] = useState(DEMO_IDS.patient);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { useSessionsByPatient } = useExamination();
  const { data, isLoading } = useSessionsByPatient(patientId, {
    page: 0,
    size: 20,
  });
  const pageData = toPage(data?.data, demoExaminations, 0, 20);
  const sessions = pageData.content;

  if (selectedSessionId) {
    return (
      <OperationsLayout
        title="Examination detail"
        description="Review the active clinical session, diagnoses, prescriptions, treatment plan, and clinical orders."
        icon="lucide:clipboard-plus"
        actions={[
          { label: 'Back to sessions', icon: 'lucide:arrow-left', onClick: () => setSelectedSessionId(null) },
        ]}
      >
        <button
          type="button"
          onClick={() => setSelectedSessionId(null)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-smile-title hover:text-smile-primary-dark"
        >
          <Icon icon="lucide:arrow-left" width={18} />
          Back to examination list
        </button>
        <ExaminationDetail sessionId={selectedSessionId} />
      </OperationsLayout>
    );
  }

  return (
    <OperationsLayout
      title="Clinical examinations"
      description="Load patient sessions, continue in-progress encounters, and open the downstream diagnosis, prescription, treatment plan, imaging, and lab workflow."
      icon="lucide:stethoscope"
      actions={[
        { label: 'New examination', href: ROUTES.EXAMINATION_NEW, icon: 'lucide:plus', variant: 'primary' },
        { label: 'Patients', href: ROUTES.PATIENTS, icon: 'lucide:users' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Sessions" value={sessions.length} detail="Loaded for patient" tone="brand" />
        <MetricCard label="In progress" value={sessions.filter((session) => session.status === 'IN_PROGRESS').length} detail="Needs completion" tone="orange" />
        <MetricCard label="Completed" value={sessions.filter((session) => session.status === 'COMPLETED').length} detail="Finalized sessions" tone="green" />
        <MetricCard label="Orders" value="2" detail="Diagnosis and imaging flow" tone="blue" />
      </div>

        <form
        className="mt-5 flex flex-col gap-3 border border-smile-border/50 bg-white p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setPatientId(patientInput.trim());
          }}
        >
          <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-smile-title">Patient ID</span>
            <input
              value={patientInput}
              onChange={(event) => setPatientInput(event.target.value)}
              placeholder="Enter the patient ID"
            className="h-10 w-full rounded-md border border-smile-border px-3 text-sm outline-none focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
            />
          </label>
          <button
            type="submit"
            disabled={!patientInput.trim()}
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-smile-primary-dark px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon="lucide:search" width={17} />
            Search
          </button>
        <button
          type="button"
          onClick={() => {
            setPatientInput(DEMO_IDS.patient);
            setPatientId(DEMO_IDS.patient);
          }}
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-smile-border/50 bg-white px-4 text-sm font-semibold text-smile-title hover:bg-smile-footer-bg"
        >
          <Icon icon="lucide:sparkles" width={16} />
          Use demo patient
        </button>
        </form>

        {!patientId ? (
        <div className="border-y border-dashed border-smile-border py-16 text-center text-smile-description">
            Search by patient ID to load clinical sessions.
          </div>
        ) : isLoading ? (
        <div className="py-16 text-center text-smile-description">Loading examinations...</div>
        ) : sessions.length === 0 ? (
        <div className="border-y border-dashed border-smile-border py-16 text-center">
          <p className="font-medium text-smile-title">No examination sessions found</p>
          <p className="mt-1 text-sm text-smile-description">Create one from the patient appointment.</p>
          </div>
        ) : (
        <div className="overflow-hidden border border-smile-border/50 bg-white">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
              className="grid w-full gap-3 border-b border-smile-border/30 px-4 py-4 text-left last:border-b-0 hover:bg-smile-footer-bg md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
              >
                <div>
                <p className="font-semibold text-smile-primary-dark">{session.chiefComplaint}</p>
                <p className="mt-1 text-xs text-smile-description">Session {session.id}</p>
                </div>
              <p className="text-sm text-smile-title">
                  {new Date(session.startTime).toLocaleString()}
                </p>
              <StatusBadge tone={session.status === 'COMPLETED' ? 'green' : session.status === 'CANCELLED' ? 'red' : 'orange'}>
                  {session.status.replaceAll('_', ' ')}
              </StatusBadge>
              <Icon icon="lucide:chevron-right" width={18} className="text-smile-description" />
              </button>
            ))}
          </div>
        )}
    </OperationsLayout>
  );
}
