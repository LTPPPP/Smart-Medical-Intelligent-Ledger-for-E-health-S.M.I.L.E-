'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Input } from '@/shared/components/common/Input';
import type {
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecord,
  RecordType,
  Medication,
} from '../types/patient.type';

interface MedicalRecordFormProps {
  patientId: string;
  appointmentId?: string;
  record?: MedicalRecord;
  onSuccess?: (record: MedicalRecord) => void;
  onCancel?: () => void;
}

const RECORD_TYPES: {
  value: RecordType;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    value: 'EXAMINATION',
    label: 'Khám bệnh',
    icon: 'mdi:stethoscope',
    color: 'blue',
  },
  {
    value: 'TREATMENT',
    label: 'Điều trị',
    icon: 'mdi:medical-bag',
    color: 'green',
  },
  {
    value: 'FOLLOW_UP',
    label: 'Tái khám',
    icon: 'mdi:calendar-check',
    color: 'orange',
  },
  { value: 'EMERGENCY', label: 'Cấp cứu', icon: 'mdi:ambulance', color: 'red' },
];

export const MedicalRecordForm = ({
  patientId,
  appointmentId,
  record,
  onSuccess,
  onCancel,
}: MedicalRecordFormProps) => {
  const {
    createMedicalRecord,
    updateMedicalRecord,
    isCreatingMedicalRecord,
    isUpdatingMedicalRecord,
  } = usePatient();

  const [formData, setFormData] = useState<CreateMedicalRecordRequest>({
    patientId,
    appointmentId,
    doctorId: record?.doctorId || '',
    clinicId: record?.clinicId || '',
    recordType: record?.recordType || 'EXAMINATION',
    visitDate: record?.visitDate || new Date().toISOString().split('T')[0],
    chiefComplaint: record?.chiefComplaint || '',
    diagnosis: record?.diagnosis || '',
    treatment: record?.treatment || '',
    prescription: record?.prescription || { medications: [] },
    notes: record?.notes || '',
  });

  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.doctorId || !formData.clinicId) {
      alert('Vui lòng nhập đầy đủ thông tin bác sĩ và phòng khám');
      return;
    }

    try {
      if (record) {
        const result = await updateMedicalRecord({
          recordId: record.id,
          request: formData as UpdateMedicalRecordRequest,
        });
        onSuccess?.(result.data);
      } else {
        const result = await createMedicalRecord(formData);
        onSuccess?.(result.data);
      }
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert('Có lỗi xảy ra khi lưu bệnh án');
    }
  };

  const addMedication = () => {
    if (!newMedication.name.trim()) {
      alert('Vui lòng nhập tên thuốc');
      return;
    }

    setFormData({
      ...formData,
      prescription: {
        ...formData.prescription,
        medications: [
          ...(formData.prescription?.medications || []),
          { ...newMedication },
        ],
      },
    });

    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      prescription: {
        ...formData.prescription,
        medications:
          formData.prescription?.medications?.filter((_, i) => i !== index) ||
          [],
      },
    });
  };

  const isLoading = isCreatingMedicalRecord || isUpdatingMedicalRecord;
  const selectedType = RECORD_TYPES.find(
    (t) => t.value === formData.recordType,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Record Type Selection */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:clipboard-text" width={24} />
          {record ? 'Cập nhật bệnh án' : 'Tạo bệnh án mới'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại bệnh án <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {RECORD_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, recordType: type.value })
                }
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.recordType === type.value
                    ? `border-${type.color}-500 bg-${type.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  icon={type.icon}
                  width={28}
                  className={
                    formData.recordType === type.value
                      ? `text-${type.color}-600`
                      : 'text-gray-400'
                  }
                />
                <div className="text-sm font-medium mt-2">{type.label}</div>
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
            label="Mã bác sĩ"
            required
            value={formData.doctorId}
            onChange={(e) =>
              setFormData({ ...formData, doctorId: e.target.value })
            }
            placeholder="doc-001"
          />

          <Input
            label="Mã phòng khám"
            required
            value={formData.clinicId}
            onChange={(e) =>
              setFormData({ ...formData, clinicId: e.target.value })
            }
            placeholder="clinic-001"
          />

          <Input
            label="Ngày khám"
            type="date"
            required
            value={formData.visitDate}
            onChange={(e) =>
              setFormData({ ...formData, visitDate: e.target.value })
            }
          />

          {appointmentId && (
            <Input
              label="Mã lịch hẹn"
              value={appointmentId}
              disabled
              className="bg-gray-50"
            />
          )}
        </div>
      </div>

      {/* Clinical Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:stethoscope" width={24} />
          Thông tin lâm sàng
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do khám / Triệu chứng
            </label>
            <textarea
              value={formData.chiefComplaint}
              onChange={(e) =>
                setFormData({ ...formData, chiefComplaint: e.target.value })
              }
              rows={3}
              placeholder="Mô tả chi tiết lý do đến khám và các triệu chứng..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chẩn đoán <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              rows={3}
              placeholder="Kết quả chẩn đoán chi tiết..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương pháp điều trị <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.treatment}
              onChange={(e) =>
                setFormData({ ...formData, treatment: e.target.value })
              }
              rows={3}
              placeholder="Mô tả chi tiết phương pháp điều trị..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Prescription */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:pill" width={24} />
          Đơn thuốc
        </h3>

        {/* Add Medication Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <Input
              label="Tên thuốc"
              value={newMedication.name}
              onChange={(e) =>
                setNewMedication({ ...newMedication, name: e.target.value })
              }
              placeholder="VD: Amoxicillin 500mg"
            />

            <Input
              label="Liều lượng"
              value={newMedication.dosage}
              onChange={(e) =>
                setNewMedication({ ...newMedication, dosage: e.target.value })
              }
              placeholder="VD: 1 viên"
            />

            <Input
              label="Tần suất"
              value={newMedication.frequency}
              onChange={(e) =>
                setNewMedication({
                  ...newMedication,
                  frequency: e.target.value,
                })
              }
              placeholder="VD: 3 lần/ngày"
            />

            <Input
              label="Thời gian"
              value={newMedication.duration}
              onChange={(e) =>
                setNewMedication({ ...newMedication, duration: e.target.value })
              }
              placeholder="VD: 7 ngày"
            />

            <div className="md:col-span-2">
              <Input
                label="Hướng dẫn"
                value={newMedication.instructions}
                onChange={(e) =>
                  setNewMedication({
                    ...newMedication,
                    instructions: e.target.value,
                  })
                }
                placeholder="VD: Uống sau ăn"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addMedication}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:plus" width={20} />
            Thêm thuốc
          </button>
        </div>

        {/* Medications List */}
        {formData.prescription?.medications &&
          formData.prescription.medications.length > 0 && (
            <div className="space-y-3">
              {formData.prescription.medications.map((med, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-800">{med.name}</div>
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Icon icon="mdi:close" width={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Liều:</span> {med.dosage}
                    </div>
                    <div>
                      <span className="font-medium">Tần suất:</span>{' '}
                      {med.frequency}
                    </div>
                    <div>
                      <span className="font-medium">Thời gian:</span>{' '}
                      {med.duration}
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <span className="font-medium">Hướng dẫn:</span>{' '}
                      {med.instructions || 'Không có'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Prescription Instructions */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lưu ý chung về đơn thuốc
          </label>
          <textarea
            value={formData.prescription?.instructions || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                prescription: {
                  ...formData.prescription,
                  medications: formData.prescription?.medications ?? [],
                  instructions: e.target.value,
                },
              })
            }
            rows={2}
            placeholder="VD: Tránh uống rượu trong thời gian dùng thuốc..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:note-text" width={24} />
          Ghi chú
        </h3>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          placeholder="Ghi chú bổ sung, khuyến nghị theo dõi, lịch tái khám..."
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
          {record ? 'Cập nhật bệnh án' : 'Tạo bệnh án'}
        </button>
      </div>
    </form>
  );
};
