'use client';

import { Icon } from '@iconify/react';

import type { Service } from '../types/service.type';

interface ServiceCardProps {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export function ServiceCard({ service, onEdit, onDelete, isAdmin }: ServiceCardProps) {
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Contact us';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
  };

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Icon icon="mdi:tooth-outline" className="text-2xl text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {service.serviceName}
            </h3>
            <span className="text-xs text-gray-500">{service.serviceCode}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
              >
                <Icon icon="mdi:pencil" className="text-base" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Icon icon="mdi:trash-can-outline" className="text-base" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-3">
        {service.description && (
          <p className="mb-3 text-xs text-gray-600 line-clamp-2">{service.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Icon icon="mdi:clock-outline" className="shrink-0 text-sm" />
            <span>{service.durationMinutes} minutes</span>
          </div>

          {service.specialty && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Icon icon="mdi:medical-bag" className="shrink-0 text-sm" />
              <span>{service.specialty.specialtyName}</span>
            </div>
          )}

          {service.requiresAppointment && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Icon icon="mdi:calendar-check" className="shrink-0 text-sm" />
              <span>Appointment required</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <span className="text-sm font-semibold text-blue-700">
          {formatPrice(service.basePrice, service.currency)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            service.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
