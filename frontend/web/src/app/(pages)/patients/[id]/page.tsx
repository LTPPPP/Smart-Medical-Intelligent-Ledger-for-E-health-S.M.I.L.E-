'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout';
import { usePatient } from '@/features/patient/hooks/usePatient';
import { MedicalRecordList } from '@/features/patient/components/MedicalRecordList';
import { TreatmentHistoryTimeline } from '@/features/patient/components/TreatmentHistoryTimeline';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

type TabType =
  | 'overview'
  | 'medical-records'
  | 'treatment-history'
  | 'medical-history';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { usePatientById, useMedicalHistory } = usePatient();

  const {
    data: patientData,
    isLoading,
    error,
    refetch,
  } = usePatientById(patientId);
  const { data: medicalHistoryData } = useMedicalHistory(patientId);

  const patient = patientData?.data;
  const medicalHistory = medicalHistoryData?.data || [];

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: 'mdi:account' },
    {
      id: 'medical-records' as const,
      label: 'Bệnh án',
      icon: 'mdi:file-document',
    },
    {
      id: 'treatment-history' as const,
      label: 'Lịch sử điều trị',
      icon: 'mdi:history',
    },
    {
      id: 'medical-history' as const,
      label: 'Bệnh sử',
      icon: 'mdi:clipboard-text',
    },
  ];

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

  if (isLoading)
    return <Loading fullScreen text="Đang tải thông tin bệnh nhân..." />;
  if (error)
    return (
      <ErrorMessage
        message="Không thể tải thông tin bệnh nhân"
        onRetry={refetch}
      />
    );
  if (!patient) return <ErrorMessage message="Không tìm thấy bệnh nhân" />;

  return (
    // <ProtectedLayout requiredPermissions={['MEDICAL_RECORD_READ']}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push(ROUTES.PATIENTS)}
            className="mb-4 flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Quay lại danh sách
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:account" width={40} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{patient.fullName}</h1>
                <div className="flex items-center gap-4 mt-2 text-blue-100">
                  <span>Mã BN: {patient.patientCode}</span>
                  <span>•</span>
                  <span>{getAgeFromDOB(patient.dateOfBirth)} tuổi</span>
                  <span>•</span>
                  <span>{patient.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(ROUTES.PATIENT_EDIT(patientId))}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Icon icon="mdi:pencil" width={20} />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon icon={tab.icon} width={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Số điện thoại
                    </div>
                    <div className="font-medium">{patient.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="font-medium">
                      {patient.email || 'Chưa có'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ngày sinh</div>
                    <div className="font-medium">
                      {new Date(patient.dateOfBirth).toLocaleDateString(
                        'vi-VN',
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Nhóm máu</div>
                    <div className="font-medium">
                      {patient.bloodType || 'Chưa xác định'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500 mb-1">Địa chỉ</div>
                    <div className="font-medium">
                      {patient.address || 'Chưa có'}
                    </div>
                  </div>
                </div>
              </div>

              {patient.emergencyContact && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Liên hệ khẩn cấp
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Họ và tên
                      </div>
                      <div className="font-medium">
                        {patient.emergencyContact.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Số điện thoại
                      </div>
                      <div className="font-medium">
                        {patient.emergencyContact.phone}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Mối quan hệ
                      </div>
                      <div className="font-medium">
                        {patient.emergencyContact.relationship}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                    <Icon icon="mdi:alert-circle" width={24} />
                    Dị ứng
                  </h3>
                  <div className="space-y-2">
                    {patient.allergies.map((allergy, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-red-800"
                      >
                        <Icon icon="mdi:alert" width={16} />
                        {allergy}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Bảo hiểm
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Số thẻ BHYT
                    </div>
                    <div className="font-medium">
                      {patient.insuranceNumber || 'Chưa có'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Nhà cung cấp
                    </div>
                    <div className="font-medium">
                      {patient.insuranceProvider || 'Chưa có'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medical-records' && (
          <MedicalRecordList
            patientId={patientId}
            onViewDetail={(record) => {
              // TODO: Navigate to medical record detail
              console.log('View record:', record.id);
            }}
          />
        )}

        {activeTab === 'treatment-history' && (
          <TreatmentHistoryTimeline patientId={patientId} />
        )}

        {activeTab === 'medical-history' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Bệnh sử</h3>
            {medicalHistory.length > 0 ? (
              <div className="space-y-3">
                {medicalHistory.map((history) => (
                  <div key={history.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-800">
                        {history.conditionName}
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {history.conditionType}
                      </span>
                    </div>
                    {history.notes && (
                      <div className="text-sm text-gray-600">
                        {history.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chưa có bệnh sử được ghi nhận
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    // </ProtectedLayout>
  );
}
