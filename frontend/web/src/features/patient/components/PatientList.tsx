'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { PatientCard } from './PatientCard';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import type { PatientType, PatientStatus } from '../types/patient.type';

export const PatientList = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<PatientType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | ''>('');

  const { usePatients } = usePatient();
  const { data, isLoading, error, refetch } = usePatients({
    page,
    size,
    keyword: keyword || undefined,
    patientType: selectedType || undefined,
    status: selectedStatus || undefined,
  });

  const patients = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  if (error) {
    return (
      <ErrorMessage
        message="Không thể tải danh sách bệnh nhân"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width={20}
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên, mã BN, SĐT, email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Patient Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại bệnh nhân
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as PatientType | '')
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="REGISTERED">Đã đăng ký</option>
              <option value="WALK_IN">Vãng lai</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as PatientStatus | '')
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="DECEASED">Đã qua đời</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Hiển thị <strong>{patients.length}</strong> trong tổng số{' '}
          <strong>{data?.data?.totalElements || 0}</strong> bệnh nhân
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Icon icon="mdi:refresh" width={18} />
          Làm mới
        </button>
      </div>

      {/* Loading */}
      {isLoading && <Loading text="Đang tải danh sách bệnh nhân..." />}

      {/* Patient Grid */}
      {!isLoading && (
        <>
          {patients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => {
                    // TODO: Navigate to patient detail
                    console.log('View patient:', patient.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Icon
                icon="mdi:account-off"
                className="mx-auto mb-4 text-gray-300"
                width={64}
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy bệnh nhân
              </h3>
              <p className="text-gray-500">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
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
