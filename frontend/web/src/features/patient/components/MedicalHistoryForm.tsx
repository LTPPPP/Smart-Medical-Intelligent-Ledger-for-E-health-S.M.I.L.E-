'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Input } from '@/shared/components/common/Input';
import type {
  CreateMedicalHistoryRequest,
  UpdateMedicalHistoryRequest,
  MedicalHistory,
  ConditionType,
  ConditionSeverity,
} from '../types/patient.type';

interface MedicalHistoryFormProps {
  patientId: string;
  history?: MedicalHistory;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CONDITION_TYPES: { value: ConditionType; label: string; icon: string }[] =
  [
    { value: 'ALLERGY', label: 'Dị ứng', icon: 'mdi:alert-circle' },
    {
      value: 'CHRONIC_CONDITION',
      label: 'Bệnh mãn tính',
      icon: 'mdi:heart-pulse',
    },
    {
      value: 'PREVIOUS_SURGERY',
      label: 'Phẫu thuật trước đây',
      icon: 'mdi:medical-bag',
    },
    { value: 'MEDICATION', label: 'Thuốc đang dùng', icon: 'mdi:pill' },
    {
      value: 'FAMILY_HISTORY',
      label: 'Tiền sử gia đình',
      icon: 'mdi:account-group',
    },
  ];

const SEVERITY_LEVELS: {
  value: ConditionSeverity;
  label: string;
  color: string;
}[] = [
  { value: 'MILD', label: 'Nhẹ', color: 'text-green-600' },
  { value: 'MODERATE', label: 'Trung bình', color: 'text-orange-600' },
  { value: 'SEVERE', label: 'Nặng', color: 'text-red-600' },
];

export const MedicalHistoryForm = ({
  patientId,
  history,
  onSuccess,
  onCancel,
}: MedicalHistoryFormProps) => {
  const {
    createMedicalHistory,
    updateMedicalHistory,
    isCreatingMedicalHistory,
    isUpdatingMedicalHistory,
  } = usePatient();

  const [formData, setFormData] = useState<CreateMedicalHistoryRequest>({
    patientId,
    conditionType: history?.conditionType || 'ALLERGY',
    conditionName: history?.conditionName || '',
    severity: history?.severity,
    diagnosedDate: history?.diagnosedDate || '',
    notes: history?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (history) {
        await updateMedicalHistory({
          historyId: history.id,
          request: formData as UpdateMedicalHistoryRequest,
        });
      } else {
        await createMedicalHistory(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving medical history:', error);
      alert('Có lỗi xảy ra khi lưu bệnh sử');
    }
  };

  const isLoading = isCreatingMedicalHistory || isUpdatingMedicalHistory;
  const selectedType = CONDITION_TYPES.find(
    (t) => t.value === formData.conditionType,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon={selectedType?.icon || 'mdi:file-document'} width={24} />
          {history ? 'Cập nhật bệnh sử' : 'Thêm bệnh sử'}
        </h3>

        <div className="space-y-4">
          {/* Condition Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại bệnh sử <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CONDITION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, conditionType: type.value })
                  }
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.conditionType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    icon={type.icon}
                    width={24}
                    className={
                      formData.conditionType === type.value
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }
                  />
                  <div className="text-sm font-medium mt-1">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Condition Name */}
          <Input
            label="Tên bệnh / Triệu chứng"
            required
            value={formData.conditionName}
            onChange={(e) =>
              setFormData({ ...formData, conditionName: e.target.value })
            }
            placeholder={
              formData.conditionType === 'ALLERGY'
                ? 'VD: Penicillin'
                : formData.conditionType === 'CHRONIC_CONDITION'
                  ? 'VD: Tiểu đường type 2'
                  : formData.conditionType === 'PREVIOUS_SURGERY'
                    ? 'VD: Phẫu thuật ruột thừa'
                    : formData.conditionType === 'MEDICATION'
                      ? 'VD: Metformin 500mg'
                      : 'VD: Tiền sử bệnh tim mạch'
            }
          />

          {/* Severity */}
          {formData.conditionType !== 'FAMILY_HISTORY' &&
            formData.conditionType !== 'PREVIOUS_SURGERY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mức độ nghiêm trọng
                </label>
                <div className="flex gap-3">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, severity: level.value })
                      }
                      className={`flex-1 px-4 py-2 border-2 rounded-lg transition-all ${
                        formData.severity === level.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={level.color}>{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Diagnosed Date */}
          <Input
            label="Ngày chẩn đoán / Ngày bắt đầu"
            type="date"
            value={formData.diagnosedDate}
            onChange={(e) =>
              setFormData({ ...formData, diagnosedDate: e.target.value })
            }
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú chi tiết
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              placeholder={
                formData.conditionType === 'MEDICATION'
                  ? 'VD: Liều lượng: 1 viên x 2 lần/ngày, sau ăn'
                  : 'Thông tin bổ sung về bệnh sử...'
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <Icon icon="line-md:loading-twotone-loop" width={20} />}
          {history ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};
