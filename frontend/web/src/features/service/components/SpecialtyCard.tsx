'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/shared/lib/utils';
import type { Specialty } from '@/features/service/types/service.type';
import { SERVICE_STATUS_COLORS } from '@/features/service/constants/service.constant';

interface SpecialtyCardProps {
  specialty: Specialty;
  onEdit?: (specialty: Specialty) => void;
  onDelete?: (specialtyId: string) => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const SpecialtyCard = ({
  specialty,
  onEdit,
  onDelete,
  isAdmin = false,
  isSelected = false,
  onClick,
}: SpecialtyCardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md',
        isSelected && 'border-blue-500 bg-blue-50',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header with Icon and Status */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {specialty.iconUrl && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Icon icon={specialty.iconUrl} className="text-2xl text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {specialty.specialtyName}
            </h3>
            <p className="text-sm text-gray-500">{specialty.specialtyCode}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            specialty.isActive
              ? SERVICE_STATUS_COLORS.ACTIVE
              : SERVICE_STATUS_COLORS.INACTIVE
          )}
        >
          {specialty.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Description */}
      {specialty.description && (
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
          {specialty.description}
        </p>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex gap-2 border-t pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(specialty);
            }}
            className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
          >
            <Icon icon="mdi:pencil" className="text-lg" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(specialty.specialtyId);
            }}
            className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Icon icon="mdi:delete" className="text-lg" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};