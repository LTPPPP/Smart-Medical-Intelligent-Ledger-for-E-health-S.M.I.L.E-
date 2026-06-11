'use client';

import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import type {
  TreatmentHistory,
  TreatmentType,
  TreatmentResult,
} from '../types/patient.type';

interface TreatmentHistoryTimelineProps {
  patientId: string;
}

export const TreatmentHistoryTimeline = ({
  patientId,
}: TreatmentHistoryTimelineProps) => {
  const { useTreatmentHistory } = usePatient();
  const { data, isLoading, error, refetch } = useTreatmentHistory(patientId);

  const treatments = data?.data || [];

  const getTreatmentIcon = (type: TreatmentType) => {
    const icons = {
      FILLING: 'mdi:tooth',
      ROOT_CANAL: 'mdi:tooth-outline',
      EXTRACTION: 'mdi:tooth-broken',
      CLEANING: 'mdi:water-outline',
      CROWN: 'mdi:crown',
      BRIDGE: 'mdi:bridge',
      IMPLANT: 'mdi:screw-machine-flat-top',
      ORTHODONTICS: 'mdi:account-check',
      WHITENING: 'mdi:white-balance-sunny',
      OTHER: 'mdi:dots-horizontal',
    };
    return icons[type] || 'mdi:medical-bag';
  };

  const getTreatmentColor = (type: TreatmentType) => {
    const colors = {
      FILLING: 'bg-blue-100 text-blue-600',
      ROOT_CANAL: 'bg-purple-100 text-purple-600',
      EXTRACTION: 'bg-red-100 text-red-600',
      CLEANING: 'bg-cyan-100 text-cyan-600',
      CROWN: 'bg-yellow-100 text-yellow-600',
      BRIDGE: 'bg-orange-100 text-orange-600',
      IMPLANT: 'bg-green-100 text-green-600',
      ORTHODONTICS: 'bg-pink-100 text-pink-600',
      WHITENING: 'bg-indigo-100 text-indigo-600',
      OTHER: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getResultBadge = (result?: TreatmentResult) => {
    if (!result) return null;

    const badges = {
      SUCCESS: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Thành công',
      },
      PARTIAL: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        label: 'Một phần',
      },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Thất bại' },
      IN_PROGRESS: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Đang thực hiện',
      },
    };
    const badge = badges[result];
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (error) {
    return (
      <ErrorMessage
        message="Không thể tải lịch sử điều trị"
        onRetry={refetch}
      />
    );
  }

  if (isLoading) {
    return <Loading text="Đang tải lịch sử điều trị..." />;
  }

  if (treatments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Icon
          icon="mdi:timeline-outline"
          className="mx-auto mb-4 text-gray-300"
          width={64}
        />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có lịch sử điều trị
        </h3>
        <p className="text-gray-500">
          Bệnh nhân chưa có lịch sử điều trị nào được ghi nhận
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="mdi:timeline-clock" width={24} />
          Lịch sử điều trị ({treatments.length})
        </h3>
        <button
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          <Icon icon="mdi:refresh" width={16} />
          Làm mới
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {treatments.map((treatment, index) => (
            <div key={treatment.id} className="relative pl-20">
              {/* Timeline Dot */}
              <div
                className={`absolute left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${getTreatmentColor(treatment.treatmentType)}`}
              >
                <Icon
                  icon={getTreatmentIcon(treatment.treatmentType)}
                  width={20}
                />
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {treatment.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Icon icon="mdi:calendar" width={16} />
                      {new Date(treatment.treatmentDate).toLocaleDateString(
                        'vi-VN',
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </div>
                  </div>
                  {getResultBadge(treatment.result)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {treatment.toothNumber && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Răng số</div>
                      <div className="font-semibold text-gray-800">
                        #{treatment.toothNumber}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bác sĩ</div>
                    <div className="font-semibold text-gray-800 truncate">
                      {treatment.performedByName || 'Chưa có thông tin'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Chi phí</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(treatment.totalCost)}
                    </div>
                  </div>

                  {treatment.followUpDate && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tái khám</div>
                      <div className="font-semibold text-blue-600">
                        {new Date(treatment.followUpDate).toLocaleDateString(
                          'vi-VN',
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Materials */}
                {treatment.materials && treatment.materials.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Vật liệu sử dụng:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {treatment.materials.map((material, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complications */}
                {treatment.complications && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Icon
                        icon="mdi:alert-circle"
                        className="text-red-600 mt-0.5"
                        width={16}
                      />
                      <div>
                        <div className="text-sm font-medium text-red-900">
                          Biến chứng:
                        </div>
                        <div className="text-sm text-red-700">
                          {treatment.complications}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {treatment.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700">
                      {treatment.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-blue-100 text-sm mb-1">
              Tổng số lần điều trị
            </div>
            <div className="text-3xl font-bold">{treatments.length}</div>
          </div>
          <div>
            <div className="text-blue-100 text-sm mb-1">Tổng chi phí</div>
            <div className="text-3xl font-bold">
              {formatCurrency(
                treatments.reduce((sum, t) => sum + t.totalCost, 0),
              )}
            </div>
          </div>
          <div>
            <div className="text-blue-100 text-sm mb-1">
              Điều trị thành công
            </div>
            <div className="text-3xl font-bold">
              {treatments.filter((t) => t.result === 'SUCCESS').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
