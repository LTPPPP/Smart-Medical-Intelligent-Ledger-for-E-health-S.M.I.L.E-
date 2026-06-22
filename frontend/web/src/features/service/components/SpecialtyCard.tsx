'use client';

import { Icon } from '@iconify/react';
import type { Specialty } from '../types/service.type';

interface SpecialtyCardProps {
  specialty: Specialty;
  selected?: boolean;
  onClick?: () => void;
}

export function SpecialtyCard({ specialty, selected, onClick }: SpecialtyCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-3">
        {specialty.iconUrl ? (
          <Icon icon={specialty.iconUrl} className="shrink-0 text-2xl text-blue-600" />
        ) : (
          <Icon icon="mdi:medical-bag" className="shrink-0 text-2xl text-blue-400" />
        )}
        <span className="font-medium text-gray-900">{specialty.specialtyName}</span>
      </div>
    </button>
  );
}
