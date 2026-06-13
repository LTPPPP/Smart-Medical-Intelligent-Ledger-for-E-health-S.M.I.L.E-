'use client';

import React from 'react';

import { Icon } from '@iconify/react';

import { APPOINTMENT_STATUS, AppointmentStatus } from '@/features/appointment/constants/appointment.constant';
import { Input } from '@/shared/components/common/Input';


interface AppointmentFiltersProps {
  filters: AppointmentFilterValues;
  onFilterChange: (filters: AppointmentFilterValues) => void;
  onReset: () => void;
}

interface AppointmentFilterValues {
    status: AppointmentStatus | 'ALL';
    startDate: string;
    endDate: string;
    search: string;
}

export const AppointmentFilters = ({
  filters,
  onFilterChange,
  onReset,
}: AppointmentFiltersProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-smile-title flex items-center gap-2">
          <Icon icon="mdi:filter" width={20} />
          Filters
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-smile-primary hover:text-smile-primary text-sm font-medium"
        >
          {isExpanded ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => onFilterChange({ ...filters, status: 'ALL' })}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filters.status === 'ALL'
              ? 'bg-smile-primary text-white'
              : 'bg-smile-primary/10 text-smile-title hover:bg-smile-border/50'
          }`}
        >
          All
        </button>
        {Object.values(APPOINTMENT_STATUS).map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange({ ...filters, status })}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filters.status === status
                ? 'bg-smile-primary text-white'
                : 'bg-smile-primary/10 text-smile-title hover:bg-smile-border/50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          {/* Search */}
          <div>
            <Input
              label="Search"
              placeholder="Search by code, patient name, doctor..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg text-sm font-medium"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-smile-primary text-white rounded-lg hover:bg-smile-primary/90 text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

