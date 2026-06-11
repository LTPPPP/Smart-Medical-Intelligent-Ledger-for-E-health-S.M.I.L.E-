'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useExamination } from '@/features/examination/hooks/useExamination';
import { ExaminationDetail } from '@/features/examination/components/ExaminationDetail';
import { ROUTES } from '@/shared/constants/routes';

export default function ExaminationsPage() {
  const [patientInput, setPatientInput] = useState('');
  const [patientId, setPatientId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { useSessionsByPatient } = useExamination();
  const { data, isLoading, error } = useSessionsByPatient(patientId, {
    page: 0,
    size: 20,
  });
  const sessions = data?.data.content ?? [];

  if (selectedSessionId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <button
          type="button"
          onClick={() => setSelectedSessionId(null)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <Icon icon="lucide:arrow-left" width={18} />
          Back to examination list
        </button>
        <ExaminationDetail sessionId={selectedSessionId} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinical examinations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Find a patient&apos;s sessions, review diagnoses, and manage prescriptions.
            </p>
          </div>
          <Link
            href={ROUTES.EXAMINATION_NEW}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Icon icon="lucide:plus" width={18} />
            New examination
          </Link>
        </div>

        <form
          className="mb-6 flex flex-col gap-3 border-y border-gray-200 bg-white py-5 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setPatientId(patientInput.trim());
          }}
        >
          <label className="flex-1">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Patient ID</span>
            <input
              value={patientInput}
              onChange={(event) => setPatientInput(event.target.value)}
              placeholder="Enter the patient ID"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={!patientInput.trim()}
            className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon="lucide:search" width={17} />
            Search
          </button>
        </form>

        {!patientId ? (
          <div className="border-y border-dashed border-gray-300 py-16 text-center text-gray-500">
            Search by patient ID to load clinical sessions.
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center text-gray-500">Loading examinations...</div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Unable to load examinations. Check the patient ID and try again.
          </div>
        ) : sessions.length === 0 ? (
          <div className="border-y border-dashed border-gray-300 py-16 text-center">
            <p className="font-medium text-gray-800">No examination sessions found</p>
            <p className="mt-1 text-sm text-gray-500">Create one from the patient appointment.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 bg-white">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
                className="grid w-full gap-3 border-b border-gray-100 px-4 py-4 text-left last:border-b-0 hover:bg-gray-50 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900">{session.chiefComplaint}</p>
                  <p className="mt-1 text-xs text-gray-500">Session {session.id}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(session.startTime).toLocaleString()}
                </p>
                <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {session.status.replaceAll('_', ' ')}
                </span>
                <Icon icon="lucide:chevron-right" width={18} className="text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
