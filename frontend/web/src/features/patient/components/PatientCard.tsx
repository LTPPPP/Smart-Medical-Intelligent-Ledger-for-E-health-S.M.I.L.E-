'use client';

import { Icon } from '@iconify/react';
import { Patient } from '../types/patient.type';
import { cn } from '@/shared/lib/utils';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  selected?: boolean;
}

export const PatientCard = ({
  patient,
  onClick,
  selected,
}: PatientCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DECEASED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatientTypeColor = (type: string) => {
    return type === 'REGISTERED'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-orange-100 text-orange-800';
  };

  const getAgeFromDOB = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-2',
        selected ? 'border-blue-500' : 'border-transparent',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
            <Icon icon="mdi:account" className="text-white" width={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              {patient.fullName}
            </h3>
            <p className="text-sm text-gray-500">{patient.patientCode}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <span
            className={cn(
              'px-2 py-1 text-xs rounded-full font-medium',
              getStatusColor(patient.status),
            )}
          >
            {patient.status}
          </span>
          <span
            className={cn(
              'px-2 py-1 text-xs rounded-full font-medium',
              getPatientTypeColor(patient.patientType),
            )}
          >
            {patient.patientType === 'REGISTERED' ? 'Đã đăng ký' : 'Vãng lai'}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar" className="text-gray-400" width={16} />
          <span className="text-gray-600">
            {getAgeFromDOB(patient.dateOfBirth)} tuổi
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Icon
            icon={
              patient.gender === 'MALE'
                ? 'mdi:gender-male'
                : 'mdi:gender-female'
            }
            className="text-gray-400"
            width={16}
          />
          <span className="text-gray-600">
            {patient.gender === 'MALE'
              ? 'Nam'
              : patient.gender === 'FEMALE'
                ? 'Nữ'
                : 'Khác'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Icon icon="mdi:phone" className="text-gray-400" width={16} />
          <span className="text-gray-600">{patient.phone}</span>
        </div>

        {patient.email && (
          <div className="flex items-center gap-2">
            <Icon icon="mdi:email" className="text-gray-400" width={16} />
            <span className="text-gray-600 truncate">{patient.email}</span>
          </div>
        )}

        {patient.bloodType && (
          <div className="flex items-center gap-2">
            <Icon icon="mdi:water" className="text-gray-400" width={16} />
            <span className="text-gray-600">{patient.bloodType}</span>
          </div>
        )}

        {patient.allergies && patient.allergies.length > 0 && (
          <div className="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="text-red-500" width={16} />
            <span className="text-red-600 font-medium">
              {patient.allergies.length} dị ứng
            </span>
          </div>
        )}
      </div>

      {/* Address */}
      {patient.address && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-start gap-2 text-sm">
            <Icon
              icon="mdi:map-marker"
              className="text-gray-400 mt-0.5"
              width={16}
            />
            <span className="text-gray-600 line-clamp-1">
              {patient.address}
            </span>
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
        <Icon icon="mdi:clock-outline" width={14} />
        Tạo: {new Date(patient.createdAt).toLocaleDateString('vi-VN')}
      </div>
    </div>
  );
};
