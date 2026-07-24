'use client';

import { Icon } from '@iconify/react';

import { AppointmentStatus } from '../constants/appointment.constant';

interface FiltersState {
  status: AppointmentStatus | 'ALL';
  startDate: string;
  endDate: string;
  search: string;
}

interface AppointmentFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: AppointmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: AppointmentStatus.SCHEDULED, label: 'Scheduled' },
  { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
  { value: AppointmentStatus.COMPLETED, label: 'Completed' },
  { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
  { value: AppointmentStatus.NO_SHOW, label: 'No Show' },
];

export function AppointmentFilters({ filters, onFilterChange, onReset }: AppointmentFiltersProps) {
  const set = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) =>
    onFilterChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={16} />
          <input
            type="text"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="Code, patient, doctor, clinic..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <div className="min-w-[150px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          value={filters.status}
          onChange={e => set('status', e.target.value as AppointmentStatus | 'ALL')}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={e => set('startDate', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={e => set('endDate', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Icon icon="mdi:refresh" width={16} />
        Reset
      </button>
    </div>
  );
}
