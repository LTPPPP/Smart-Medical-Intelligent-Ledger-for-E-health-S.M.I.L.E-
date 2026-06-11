'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { PatientCard } from './PatientCard';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import type {
  PatientSearchParams,
  PatientType,
  PatientStatus,
  BloodType,
} from '../types/patient.type';

export const AdvancedPatientSearch = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState<PatientSearchParams>({
    page: 0,
    size: 20,
  });

  const { usePatients } = usePatient();
  const { data, isLoading, error, refetch } = usePatients(searchParams);

  const patients = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ ...searchParams, page: 0 });
    refetch();
  };

  const resetFilters = () => {
    setSearchParams({
      page: 0,
      size: 20,
    });
  };

  const hasActiveFilters = () => {
    return !!(
      searchParams.keyword ||
      searchParams.patientType ||
      searchParams.status ||
      searchParams.bloodType ||
      searchParams.hasAllergies !== undefined ||
      searchParams.ageFrom ||
      searchParams.ageTo
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Icon
                icon="mdi:magnify"
                width={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchParams.keyword || ''}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, keyword: e.target.value })
                }
                placeholder="Tìm theo tên, mã BN, SĐT, email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                showFilters || hasActiveFilters()
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon icon="mdi:filter-variant" width={20} />
              Bộ lọc
              {hasActiveFilters() && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:magnify" width={20} />
              Tìm kiếm
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Patient Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại bệnh nhân
                  </label>
                  <select
                    value={searchParams.patientType || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        patientType: e.target.value as PatientType | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="REGISTERED">Đã đăng ký</option>
                    <option value="WALK_IN">Khám trực tiếp</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={searchParams.status || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        status: e.target.value as PatientStatus | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="DECEASED">Đã mất</option>
                  </select>
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhóm máu
                  </label>
                  <select
                    value={searchParams.bloodType || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        bloodType: e.target.value as BloodType | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="UNKNOWN">Chưa xác định</option>
                  </select>
                </div>

                {/* Has Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dị ứng
                  </label>
                  <select
                    value={
                      searchParams.hasAllergies === undefined
                        ? ''
                        : String(searchParams.hasAllergies)
                    }
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        hasAllergies:
                          e.target.value === ''
                            ? undefined
                            : e.target.value === 'true',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Có dị ứng</option>
                    <option value="false">Không dị ứng</option>
                  </select>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi từ
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={searchParams.ageFrom || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        ageFrom: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="VD: 18"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi đến
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={searchParams.ageTo || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        ageTo: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="VD: 65"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={searchParams.gender || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        gender: e.target.value as
                          | 'MALE'
                          | 'FEMALE'
                          | 'OTHER'
                          | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Has Insurance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bảo hiểm
                  </label>
                  <select
                    value={
                      searchParams.hasInsurance === undefined
                        ? ''
                        : String(searchParams.hasInsurance)
                    }
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        hasInsurance:
                          e.target.value === ''
                            ? undefined
                            : e.target.value === 'true',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Có BHYT</option>
                    <option value="false">Không BHYT</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                >
                  <Icon icon="mdi:refresh" width={16} />
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            'Đang tải...'
          ) : (
            <>
              Hiển thị{' '}
              <span className="font-medium text-gray-900">
                {patients.length}
              </span>{' '}
              /{' '}
              <span className="font-medium text-gray-900">{totalElements}</span>{' '}
              bệnh nhân
              {hasActiveFilters() && (
                <span className="ml-2 text-blue-600">(đã lọc)</span>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Icon icon="mdi:refresh" width={16} />
          Làm mới
        </button>
      </div>

      {/* Results */}
      {isLoading && <Loading text="Đang tìm kiếm bệnh nhân..." />}

      {error && (
        <ErrorMessage
          message="Không thể tìm kiếm bệnh nhân"
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && (
        <>
          {patients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Icon
                icon="mdi:account-search"
                className="mx-auto mb-4 text-gray-300"
                width={64}
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy bệnh nhân
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters()
                  ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Chưa có bệnh nhân nào trong hệ thống'}
              </p>
              {hasActiveFilters() && (
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setSearchParams({
                ...searchParams,
                page: Math.max(0, searchParams.page! - 1),
              })
            }
            disabled={searchParams.page === 0}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-left" width={20} />
          </button>

          <span className="px-4 py-2 font-medium">
            Trang {(searchParams.page || 0) + 1} / {totalPages}
          </span>

          <button
            onClick={() =>
              setSearchParams({
                ...searchParams,
                page: Math.min(totalPages - 1, (searchParams.page || 0) + 1),
              })
            }
            disabled={(searchParams.page || 0) >= totalPages - 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="mdi:chevron-right" width={20} />
          </button>
        </div>
      )}
    </div>
  );
};
