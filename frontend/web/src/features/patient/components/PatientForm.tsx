'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Input } from '@/shared/components/common/Input';
import { GENDER_OPTIONS } from '@/shared/constants';
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  Patient,
  BloodType,
  RelationshipType,
} from '../types/patient.type';

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
}

const BLOOD_TYPES: BloodType[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
  'UNKNOWN',
];
const RELATIONSHIP_TYPES: RelationshipType[] = [
  'SPOUSE',
  'PARENT',
  'CHILD',
  'SIBLING',
  'FRIEND',
  'OTHER',
];

export const PatientForm = ({
  patient,
  onSuccess,
  onCancel,
}: PatientFormProps) => {
  const { createPatient, updatePatient, isCreatingPatient, isUpdatingPatient } =
    usePatient();

  const [formData, setFormData] = useState<CreatePatientRequest>({
    fullName: patient?.fullName || '',
    dateOfBirth: patient?.dateOfBirth || '',
    gender: patient?.gender || 'MALE',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    bloodType: patient?.bloodType,
    allergies: patient?.allergies || [],
    emergencyContact: patient?.emergencyContact,
    patientType: patient?.patientType || 'REGISTERED',
    insuranceNumber: patient?.insuranceNumber,
    insuranceProvider: patient?.insuranceProvider,
    notes: patient?.notes || '',
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [showEmergencyContact, setShowEmergencyContact] = useState(
    !!patient?.emergencyContact,
  );
  const [emergencyContact, setEmergencyContact] = useState({
    name: patient?.emergencyContact?.name || '',
    phone: patient?.emergencyContact?.phone || '',
    relationship:
      patient?.emergencyContact?.relationship || ('SPOUSE' as RelationshipType),
    address: patient?.emergencyContact?.address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requestData = {
      ...formData,
      emergencyContact: showEmergencyContact ? emergencyContact : undefined,
    };

    try {
      if (patient) {
        const result = await updatePatient({
          patientId: patient.id,
          request: requestData as UpdatePatientRequest,
        });
        onSuccess?.(result.data);
      } else {
        const result = await createPatient(requestData);
        onSuccess?.(result.data);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Có lỗi xảy ra khi lưu thông tin bệnh nhân');
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((_, i) => i !== index),
    });
  };

  const isLoading = isCreatingPatient || isUpdatingPatient;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:account" width={24} />
          Thông tin cá nhân
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Họ và tên"
            required
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            placeholder="Nguyễn Văn A"
          />

          <Input
            label="Ngày sinh"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhóm máu
            </label>
            <select
              value={formData.bloodType || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bloodType: e.target.value as BloodType,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn nhóm máu</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Số điện thoại"
            required
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="0901234567"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="email@example.com"
          />

          <div className="md:col-span-2">
            <Input
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Số nhà, đường, quận, thành phố"
            />
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:shield-account" width={24} />
          Thông tin bảo hiểm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Số thẻ BHYT"
            value={formData.insuranceNumber}
            onChange={(e) =>
              setFormData({ ...formData, insuranceNumber: e.target.value })
            }
            placeholder="VD: DN1234567890123"
          />

          <Input
            label="Nhà cung cấp BH"
            value={formData.insuranceProvider}
            onChange={(e) =>
              setFormData({ ...formData, insuranceProvider: e.target.value })
            }
            placeholder="VD: BHXH Việt Nam"
          />
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:alert-circle" width={24} className="text-red-500" />
          Dị ứng
        </h3>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addAllergy())
            }
            placeholder="Nhập tên dị ứng (VD: Penicillin)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addAllergy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon="mdi:plus" width={20} />
          </button>
        </div>

        {formData.allergies && formData.allergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.allergies.map((allergy, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(index)}
                  className="hover:text-red-900"
                >
                  <Icon icon="mdi:close" width={16} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Icon icon="mdi:phone-alert" width={24} />
            Người liên hệ khẩn cấp
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmergencyContact}
              onChange={(e) => setShowEmergencyContact(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">Thêm thông tin</span>
          </label>
        </div>

        {showEmergencyContact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Họ và tên"
              required={showEmergencyContact}
              value={emergencyContact.name}
              onChange={(e) =>
                setEmergencyContact({
                  ...emergencyContact,
                  name: e.target.value,
                })
              }
            />

            <Input
              label="Số điện thoại"
              required={showEmergencyContact}
              type="tel"
              value={emergencyContact.phone}
              onChange={(e) =>
                setEmergencyContact({
                  ...emergencyContact,
                  phone: e.target.value,
                })
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mối quan hệ{' '}
                {showEmergencyContact && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <select
                required={showEmergencyContact}
                value={emergencyContact.relationship}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    relationship: e.target.value as RelationshipType,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'SPOUSE'
                      ? 'Vợ/Chồng'
                      : type === 'PARENT'
                        ? 'Cha/Mẹ'
                        : type === 'CHILD'
                          ? 'Con'
                          : type === 'SIBLING'
                            ? 'Anh/Chị/Em'
                            : type === 'FRIEND'
                              ? 'Bạn bè'
                              : 'Khác'}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Địa chỉ"
              value={emergencyContact.address}
              onChange={(e) =>
                setEmergencyContact({
                  ...emergencyContact,
                  address: e.target.value,
                })
              }
            />
          </div>
        )}
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
          placeholder="Thông tin bổ sung về bệnh nhân..."
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
          {patient ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
};
