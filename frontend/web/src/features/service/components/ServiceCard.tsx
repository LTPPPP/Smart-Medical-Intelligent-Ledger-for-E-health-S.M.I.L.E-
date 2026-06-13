'use client';

import { Icon } from '@iconify/react';

import { SERVICE_STATUS_COLORS } from '@/features/service/constants/service.constant';
import type { Service } from '@/features/service/types/service.type';
import { cn } from '@/shared/lib/utils';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (serviceId: string) => void;
  isAdmin?: boolean;
  onClick?: () => void;
}

export const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  isAdmin = false,
  onClick,
}: ServiceCardProps) => {
  // Format price with currency
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'VND') {
      return `${price.toLocaleString('vi-VN')} ₫`;
    }
    return `$${price.toLocaleString('en-US')}`;
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-[0_4px_16px_rgba(65,126,170,0.08)]',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-smile-primary-dark">
            {service.serviceName}
          </h3>
          <p className="text-sm text-smile-description">{service.serviceCode}</p>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            service.isActive
              ? SERVICE_STATUS_COLORS.ACTIVE
              : SERVICE_STATUS_COLORS.INACTIVE
          )}
        >
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Specialty Badge */}
      {service.specialtyName && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-smile-primary/10 px-3 py-1 text-xs font-medium text-smile-primary-dark">
            <Icon icon="mdi:tag" className="text-sm" />
            {service.specialtyName}
          </span>
        </div>
      )}

      {/* Description */}
      {service.description && (
        <p className="mb-4 text-sm text-smile-title line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Service Details */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* Duration */}
        <div className="flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="text-smile-description" />
          <span className="text-sm text-smile-title">
            {service.durationMinutes} mins
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <Icon icon="mdi:cash" className="text-smile-description" />
          <span className="text-sm font-semibold text-smile-primary-dark">
            {formatPrice(service.basePrice, service.currency)}
          </span>
        </div>
      </div>

      {/* Preparation Instructions Preview */}
      {service.preparationInstructions && (
        <div className="mb-4 rounded-md bg-orange-50 p-3">
          <div className="flex items-start gap-2">
            <Icon
              icon="mdi:information-outline"
              className="mt-0.5 text-orange-600"
            />
            <p className="text-xs text-orange-700 line-clamp-2">
              {service.preparationInstructions}
            </p>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex gap-2 border-t pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(service);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-smile-primary/5 px-3 py-2 text-sm font-medium text-smile-primary hover:bg-smile-primary/10"
          >
            <Icon icon="mdi:pencil" className="text-lg" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(service.serviceId);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Icon icon="mdi:delete" className="text-lg" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};