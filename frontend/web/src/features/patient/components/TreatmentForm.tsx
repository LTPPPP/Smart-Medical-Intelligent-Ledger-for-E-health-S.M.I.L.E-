'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Input } from '@/shared/components/common/Input';
import type {
  CreateTreatmentHistoryRequest,
  UpdateTreatmentHistoryRequest,
  TreatmentHistory,
  TreatmentType,
  TreatmentResult,
} from '../types/patient.type';

interface TreatmentFormProps {
  patientId: string;
  medicalRecordId?: string;
  treatment?: TreatmentHistory;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TREATMENT_TYPES: { value: TreatmentType; label: string; icon: string }[] =
  [
    { value: 'FILLING', label: 'Trám răng', icon: 'mdi:tooth' },
    { value: 'ROOT_CANAL', label: 'Nội nha', icon: 'mdi:tooth-outline' },
    { value: 'EXTRACTION', label: 'Nhổ răng', icon: 'mdi:tooth-broken' },
    { value: 'CLEANING', label: 'Vệ sinh răng', icon: 'mdi:water-outline' },
    { value: 'CROWN', label: 'Bọc răng sứ', icon: 'mdi:crown' },
    { value: 'BRIDGE', label: 'Cầu răng', icon: 'mdi:bridge' },
    { value: 'IMPLANT', label: 'Cấy ghép', icon: 'mdi:screw-machine-flat-top' },
    { value: 'ORTHODONTICS', label: 'Chỉnh nha', icon: 'mdi:account-check' },
    { value: 'WHITENING', label: 'Tẩy trắng', icon: 'mdi:white-balance-sunny' },
    { value: 'OTHER', label: 'Khác', icon: 'mdi:dots-horizontal' },
  ];

const TREATMENT_RESULTS: {
  value: TreatmentResult;
  label: string;
  color: string;
}[] = [
  { value: 'SUCCESS', label: 'Thành công', color: 'green' },
  { value: 'PARTIAL', label: 'Một phần', color: 'orange' },
  { value: 'FAILED', label: 'Thất bại', color: 'red' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện', color: 'blue' },
];

export const TreatmentForm = ({
  patientId,
  medicalRecordId,
  treatment,
  onSuccess,
  onCancel,
}: TreatmentFormProps) => {
  const {
    createTreatmentHistory,
    updateTreatmentHistory,
    isCreatingTreatmentHistory,
    isUpdatingTreatmentHistory,
  } = usePatient();

  const [formData, setFormData] = useState<CreateTreatmentHistoryRequest>({
    patientId,
    medicalRecordId,
    treatmentType: treatment?.treatmentType || 'FILLING',
    toothNumber: treatment?.toothNumber,
    treatmentDate:
      treatment?.treatmentDate || new Date().toISOString().split('T')[0],
    description: treatment?.description || '',
    materials: treatment?.materials || [],
    performedBy: treatment?.performedBy || '',
    result: treatment?.result,
    complications: treatment?.complications || '',
    followUpDate: treatment?.followUpDate || '',
    totalCost: treatment?.totalCost || 0,
    notes: treatment?.notes || '',
  });

  const [materialInput, setMaterialInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.performedBy) {
      alert('Vui lòng nhập mã bác sĩ thực hiện');
      return;
    }

    try {
      if (treatment) {
        await updateTreatmentHistory({
          treatmentId: treatment.id,
          request: formData as UpdateTreatmentHistoryRequest,
        });
      } else {
        await createTreatmentHistory(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert('Có lỗi xảy ra khi lưu điều trị');
    }
  };

  const addMaterial = () => {
    if (materialInput.trim()) {
      setFormData({
        ...formData,
        materials: [...(formData.materials || []), materialInput.trim()],
      });
      setMaterialInput('');
    }
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials?.filter((_, i) => i !== index),
    });
  };

  const isLoading = isCreatingTreatmentHistory || isUpdatingTreatmentHistory;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Treatment Type */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {treatment ? 'Cập nhật điều trị' : 'Thêm điều trị mới'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại điều trị <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TREATMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, treatmentType: type.value })
                }
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.treatmentType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  icon={type.icon}
                  width={24}
                  className={
                    formData.treatmentType === type.value
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                />
                <div className="text-xs font-medium mt-1">{type.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Thông tin cơ bản
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Số răng (FDI)"
            type="number"
            min={11}
            max={48}
            value={formData.toothNumber || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                toothNumber: parseInt(e.target.value) || undefined,
              })
            }
            placeholder="VD: 36"
          />

          <Input
            label="Ngày thực hiện"
            type="date"
            required
            value={formData.treatmentDate}
            onChange={(e) =>
              setFormData({ ...formData, treatmentDate: e.target.value })
            }
          />

          <Input
            label="Mã bác sĩ thực hiện"
            required
            value={formData.performedBy}
            onChange={(e) =>
              setFormData({ ...formData, performedBy: e.target.value })
            }
            placeholder="doc-001"
          />

          <Input
            label="Chi phí (VNĐ)"
            type="number"
            required
            value={formData.totalCost}
            onChange={(e) =>
              setFormData({
                ...formData,
                totalCost: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="500000"
          />

          <Input
            label="Ngày tái khám"
            type="date"
            value={formData.followUpDate}
            onChange={(e) =>
              setFormData({ ...formData, followUpDate: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kết quả
            </label>
            <select
              value={formData.result || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  result: e.target.value as TreatmentResult,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chưa đánh giá</option>
              {TREATMENT_RESULTS.map((result) => (
                <option key={result.value} value={result.value}>
                  {result.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Mô tả điều trị</h3>
        <textarea
          required
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          placeholder="Mô tả chi tiết quy trình điều trị..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Materials */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Vật liệu sử dụng
        </h3>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={materialInput}
            onChange={(e) => setMaterialInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addMaterial())
            }
            placeholder="VD: Composite resin, Gutta-percha..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addMaterial}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon="mdi:plus" width={20} />
          </button>
        </div>

        {formData.materials && formData.materials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.materials.map((material, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
              >
                {material}
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="hover:text-blue-900"
                >
                  <Icon icon="mdi:close" width={16} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Complications */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:alert-circle" width={24} className="text-red-600" />
          Biến chứng (nếu có)
        </h3>
        <textarea
          value={formData.complications}
          onChange={(e) =>
            setFormData({ ...formData, complications: e.target.value })
          }
          rows={3}
          placeholder="Ghi nhận các biến chứng nếu có..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Ghi chú</h3>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Ghi chú bổ sung..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
          {treatment ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};
