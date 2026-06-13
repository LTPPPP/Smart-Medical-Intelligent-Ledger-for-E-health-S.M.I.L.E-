'use client';

import { Icon } from '@iconify/react';
import { useSpecialties } from '@/features/service/hooks/useService';
import { Specialty } from '@/features/service/types/service.type';

interface ServiceFiltersProps {
  filters: {
    specialtyId?: string;
    isActive?: boolean;
    search?: string;
  };
  onFilterChange: (key: string, value: string | boolean | undefined) => void;
  onReset: () => void;
}

export const ServiceFilters = ({
  filters,
  onFilterChange,
  onReset,
}: ServiceFiltersProps) => {
  const { data: specialtiesData, isLoading } = useSpecialties({ isActive: true });
  const specialties = (specialtiesData as unknown as Specialty[]) || [];

  const hasActiveFilters =
    filters.specialtyId || filters.isActive !== undefined || filters.search;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Icon icon="mdi:refresh" className="text-lg" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
              placeholder="Search services..."
            />
          </div>
        </div>

        {/* Specialty Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Specialty
          </label>
          <select
            value={filters.specialtyId || ''}
            onChange={(e) =>
              onFilterChange(
                'specialtyId',
                e.target.value || undefined
              )
            }
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          >
            <option value="">All Specialties</option>
            {specialties?.map((specialty) => (
              <option key={specialty.specialtyId} value={specialty.specialtyId}>
                {specialty.specialtyName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={
              filters.isActive === undefined
                ? ''
                : filters.isActive
                  ? 'true'
                  : 'false'
            }
            onChange={(e) => {
              const value = e.target.value;
              onFilterChange(
                'isActive',
                value === '' ? undefined : value === 'true'
              );
            }}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
};