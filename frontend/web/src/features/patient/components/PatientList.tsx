'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { Loading } from '@/shared/components/common/Loading';
import { ROUTES } from '@/shared/constants/routes';
import { demoPatients } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';

import { PatientCard } from './PatientCard';
import { usePatient } from '../hooks/usePatient';
import type { PatientType, PatientStatus } from '../types/patient.type';

export const PatientList = () => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<PatientType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | ''>('');

  const { usePatients } = usePatient();
  const { data, isLoading, refetch } = usePatients({
    page,
    size,
    keyword: keyword || undefined,
    patientType: selectedType || undefined,
    status: selectedStatus || undefined,
  });

  const pageData = toPage(data?.data, demoPatients, page, size);
  const patients = pageData.content;
  const totalPages = pageData.totalPages;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="border border-smile-border/50 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-smile-title mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
                width={20}
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên, mã BN, SĐT, email..."
                className="w-full rounded-md border border-smile-border py-2 pl-10 pr-4 text-sm focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
              />
            </div>
          </div>

          {/* Patient Type Filter */}
          <div>
            <label className="block text-sm font-medium text-smile-title mb-2">
              Loại bệnh nhân
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as PatientType | '')
              }
              className="w-full rounded-md border border-smile-border px-4 py-2 text-sm focus:ring-2 focus:ring-smile-primary/20"
            >
              <option value="">Tất cả</option>
              <option value="REGISTERED">Đã đăng ký</option>
              <option value="WALK_IN">Vãng lai</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-smile-title mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as PatientStatus | '')
              }
              className="w-full rounded-md border border-smile-border px-4 py-2 text-sm focus:ring-2 focus:ring-smile-primary/20"
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
        <div className="text-sm text-smile-title">
          Hiển thị <strong>{patients.length}</strong> trong tổng số{' '}
          <strong>{data?.data?.totalElements || 0}</strong> bệnh nhân
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-smile-primary hover:bg-smile-primary/5 rounded-lg transition-colors"
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
                    router.push(ROUTES.PATIENT_DETAIL(patient.id));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-smile-border/50 bg-white/80 p-12 text-center">
              <Icon
                icon="mdi:account-off"
                className="mx-auto mb-4 text-smile-description/50"
                width={64}
              />
              <h3 className="text-lg font-medium text-smile-primary-dark mb-2">
                Không tìm thấy bệnh nhân
              </h3>
              <p className="text-smile-description">
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
            className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-left" width={20} />
          </button>

          <span className="px-4 py-2 font-medium">
            Trang {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-right" width={20} />
          </button>
        </div>
      )}
    </div>
  );
};
