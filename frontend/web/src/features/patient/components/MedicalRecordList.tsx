'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import type {
  MedicalRecord,
  RecordStatus,
  RecordType,
} from '../types/patient.type';

interface MedicalRecordListProps {
  patientId: string;
  onViewDetail?: (record: MedicalRecord) => void;
}

export const MedicalRecordList = ({
  patientId,
  onViewDetail,
}: MedicalRecordListProps) => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<RecordStatus | ''>('');
  const [selectedType, setSelectedType] = useState<RecordType | ''>('');

  const { useMedicalRecords } = usePatient();
  const { data, isLoading, error, refetch } = useMedicalRecords(patientId, {
    page,
    size,
    status: selectedStatus || undefined,
    recordType: selectedType || undefined,
  });

  const records = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  const getStatusBadge = (status: RecordStatus) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bản nháp' },
      FINALIZED: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Hoàn tất',
      },
      ARCHIVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Lưu trữ' },
    };
    const badge = badges[status];
    return (
      <span
        className={`px-3 py-1 text-xs rounded-full font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: RecordType) => {
    const badges = {
      EXAMINATION: {
        icon: 'mdi:stethoscope',
        label: 'Khám',
        color: 'text-blue-600',
      },
      TREATMENT: {
        icon: 'mdi:medical-bag',
        label: 'Điều trị',
        color: 'text-green-600',
      },
      FOLLOW_UP: {
        icon: 'mdi:calendar-check',
        label: 'Tái khám',
        color: 'text-orange-600',
      },
      EMERGENCY: {
        icon: 'mdi:ambulance',
        label: 'Cấp cứu',
        color: 'text-red-600',
      },
    };
    const badge = badges[type];
    return (
      <div className="flex items-center gap-1">
        <Icon icon={badge.icon} width={16} className={badge.color} />
        <span className="text-sm font-medium">{badge.label}</span>
      </div>
    );
  };

  if (error) {
    return <ErrorMessage message="Không thể tải bệnh án" onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại bệnh án
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as RecordType | '')
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="EXAMINATION">Khám bệnh</option>
              <option value="TREATMENT">Điều trị</option>
              <option value="FOLLOW_UP">Tái khám</option>
              <option value="EMERGENCY">Cấp cứu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as RecordStatus | '')
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="FINALIZED">Hoàn tất</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:refresh" width={18} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <Loading text="Đang tải bệnh án..." />}

      {/* Records List */}
      {!isLoading && (
        <>
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onViewDetail?.(record)}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeBadge(record.recordType)}
                      <span className="text-sm text-gray-500">
                        {new Date(record.visitDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  {record.chiefComplaint && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Lý do khám:{' '}
                      </span>
                      <span className="text-sm text-gray-600">
                        {record.chiefComplaint}
                      </span>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {record.diagnosis && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Chẩn đoán:{' '}
                      </span>
                      <span className="text-sm text-gray-600">
                        {record.diagnosis}
                      </span>
                    </div>
                  )}

                  {/* Treatment */}
                  {record.treatment && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Điều trị:{' '}
                      </span>
                      <span className="text-sm text-gray-600">
                        {record.treatment}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:doctor" width={16} />
                        {record.doctorName || 'Chưa có thông tin'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:hospital-building" width={16} />
                        {record.clinicName || 'Chưa có thông tin'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail?.(record);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Icon
                icon="mdi:file-document-outline"
                className="mx-auto mb-4 text-gray-300"
                width={64}
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có bệnh án
              </h3>
              <p className="text-gray-500">
                Bệnh nhân chưa có bệnh án nào được ghi nhận
              </p>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-left" width={20} />
          </button>

          <span className="px-4 py-2 font-medium">
            Trang {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-right" width={20} />
          </button>
        </div>
      )}
    </div>
  );
};
