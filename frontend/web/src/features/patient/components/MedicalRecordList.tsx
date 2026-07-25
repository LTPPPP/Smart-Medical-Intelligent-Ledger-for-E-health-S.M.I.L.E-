'use client';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { ROUTES } from '@/shared/constants/routes';

import { usePatient } from '../hooks/usePatient';
import type { MedicalRecord, RecordStatus } from '../types/patient.type';

const STATUS_CONFIG: Record<
  RecordStatus,
  { label: string; dotColor: string; chipClass: string; icon: string }
> = {
  DRAFT: {
    label: 'Draft',
    dotColor: 'bg-teal-600',
    chipClass: 'bg-teal-100 text-teal-700',
    icon: 'mdi:pencil',
  },
  FINALIZED: {
    label: 'Finalized',
    dotColor: 'bg-emerald-500',
    chipClass: 'bg-emerald-100 text-emerald-700',
    icon: 'mdi:check-circle',
  },
};

interface MedicalRecordListProps {
  patientId: string;
  onViewDetail?: (record: MedicalRecord) => void;
}

export function MedicalRecordList({ patientId, onViewDetail }: MedicalRecordListProps) {
  const router = useRouter();
  const { useMedicalRecordsByPatient } = usePatient();
  const { data, isLoading, error } = useMedicalRecordsByPatient(patientId);
  const records: MedicalRecord[] = data?.data ?? [];

  const sorted = [...records].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
  );

  const handleNew = () =>
    router.push(`${ROUTES.PATIENTS}/${patientId}/medical-records/new`);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative pl-6 pb-5 border-l-2 border-slate-200 animate-pulse">
            <span className="absolute left-[-9px] top-0.5 w-4 h-4 rounded-full bg-slate-200 ring-4 ring-white" />
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <Icon icon="mdi:alert-circle" width={40} className="text-red-400 mx-auto mb-2" />
        <p className="text-red-700 text-sm">Failed to load medical records</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-900">Medical Records</h3>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
              {records.length}
            </span>
          )}
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all text-sm"
          >
            <Icon icon="mdi:plus" width={16} />
            New Medical Record
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          <Icon icon="mdi:file-document-outline" width={48} className="mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 mb-3">No medical records yet</p>
        </div>
      ) : (
        /* Vertical timeline */
        <div className="space-y-0">
          {sorted.map((record, idx) => {
            const status = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.DRAFT;
            const isNewest = idx === 0;
            return (
              <button
                key={record.id}
                onClick={() =>
                  onViewDetail
                    ? onViewDetail(record)
                    : router.push(
                        `${ROUTES.PATIENTS}/${patientId}/medical-records/${record.id}`,
                      )
                }
                className="relative pl-6 pb-5 border-l-2 border-slate-200 last:border-transparent text-left w-full hover:opacity-90 transition-opacity group"
              >
                {/* Timeline dot */}
                <span
                  className={`absolute left-[-9px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white ${status.dotColor}`}
                />

                <div className="bg-white rounded-2xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] p-4 group-hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isNewest && (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          Current
                        </span>
                      )}
                      {!isNewest && record.recordType && (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {record.recordType}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold ${status.chipClass}`}
                      >
                        <Icon icon={status.icon} width={11} />
                        {status.label}
                      </span>
                    </div>
                    <Icon icon="mdi:chevron-right" width={18} className="text-slate-400 flex-none mt-0.5" />
                  </div>

                  <p className="font-bold text-slate-800 text-sm">
                    {record.diagnosis || 'No diagnosis yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(record.visitDate).toLocaleDateString('vi-VN')}
                    {record.doctorName ? ` · ${record.doctorName}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
