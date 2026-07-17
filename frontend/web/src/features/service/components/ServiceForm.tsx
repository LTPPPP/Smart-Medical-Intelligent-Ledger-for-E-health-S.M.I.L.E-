'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import {
  CURRENCY_OPTIONS,
  DURATION_OPTIONS,
  DEFAULT_SERVICE_VALUES,
} from '@/features/service/constants/service.constant';
import { useSpecialties } from '@/features/service/hooks/useService';
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '@/features/service/types/service.type';

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ServiceForm = ({
  service,
  onSubmit,
  onCancel,
  isPending = false,
}: ServiceFormProps) => {
  const isEditMode = !!service;

  // Fetch specialties for dropdown
  const { data: specialties, isLoading: isLoadingSpecialties } =
    useSpecialties({ isActive: true });

  const [formData, setFormData] = useState<CreateServiceRequest>({
    serviceName: service?.serviceName || '',
    serviceCode: service?.serviceCode || '',
    categoryId: service?.categoryId || '',
    specialtyId: service?.specialtyId || '',
    description: service?.description || '',
    durationMinutes: service?.durationMinutes || DEFAULT_SERVICE_VALUES.durationMinutes,
    basePrice: service?.basePrice || 0,
    currency: service?.currency || DEFAULT_SERVICE_VALUES.currency,
    requiresAppointment:
      service?.requiresAppointment ?? DEFAULT_SERVICE_VALUES.requiresAppointment,
    preparationInstructions: service?.preparationInstructions || '',
  });

  const [isActive, setIsActive] = useState(service?.isActive ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceName?.trim()) {
      newErrors.serviceName = 'Service name is required';
    }

    if (!isEditMode && !formData.serviceCode?.trim()) {
      newErrors.serviceCode = 'Service code is required';
    }

    if (!formData.specialtyId) {
      newErrors.specialtyId = 'Specialty is required';
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (isEditMode) {
      const updateData = { ...formData };
      delete updateData.serviceCode;
      delete updateData.currency;
      onSubmit({
        ...updateData,
        isActive,
      } as UpdateServiceRequest);
    } else {
      // When creating, send the full payload
      onSubmit(formData);
    }
  };

  const handleChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    const currency = CURRENCY_OPTIONS.find(
      (c) => c.value === formData.currency
    );
    return currency?.symbol || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Service Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceName || ''}
          onChange={(e) => handleChange('serviceName', e.target.value)}
          className={`w-full rounded-md border px-4 py-2 focus:border-blue-500 focus:outline-none ${
            errors.serviceName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g. Metal Braces"
        />
        {errors.serviceName && (
          <p className="mt-1 text-sm text-red-500">{errors.serviceName}</p>
        )}
      </div>

      {/* Service Code */}
      {!isEditMode && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Service Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.serviceCode || ''}
            onChange={(e) =>
              handleChange('serviceCode', e.target.value.toUpperCase())
            }
            className={`w-full rounded-md border px-4 py-2 font-mono uppercase focus:border-blue-500 focus:outline-none ${
              errors.serviceCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. SVC-001"
            maxLength={20}
          />
          {errors.serviceCode && (
            <p className="mt-1 text-sm text-red-500">{errors.serviceCode}</p>
          )}
        </div>
      )}

      {/* Specialty Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Specialty <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.specialtyId || ''}
          onChange={(e) => handleChange('specialtyId', e.target.value)}
          className={`w-full rounded-md border px-4 py-2 focus:border-blue-500 focus:outline-none ${
            errors.specialtyId ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoadingSpecialties}
        >
          <option value="">Select specialty...</option>
          {specialties?.map((specialty) => (
            <option key={specialty.specialtyId} value={specialty.specialtyId}>
              {specialty.specialtyName}
            </option>
          ))}
        </select>
        {errors.specialtyId && (
          <p className="mt-1 text-sm text-red-500">{errors.specialtyId}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="Brief description of the service..."
        />
      </div>

      {/* Duration and Price Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Duration
          </label>
          <select
            value={formData.durationMinutes || DEFAULT_SERVICE_VALUES.durationMinutes}
            onChange={(e) =>
              handleChange('durationMinutes', parseInt(e.target.value))
            }
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            value={formData.currency || DEFAULT_SERVICE_VALUES.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Base Price <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            {getCurrencySymbol()}
          </span>
          <input
            type="number"
            value={formData.basePrice || ''}
            onChange={(e) =>
              handleChange('basePrice', parseFloat(e.target.value))
            }
            className={`w-full rounded-md border py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none ${
              errors.basePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min={0}
            step={formData.currency === 'VND' ? 1000 : 0.01}
          />
        </div>
        {errors.basePrice && (
          <p className="mt-1 text-sm text-red-500">{errors.basePrice}</p>
        )}
      </div>

      {/* Preparation Instructions */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Preparation Instructions
        </label>
        <textarea
          value={formData.preparationInstructions || ''}
          onChange={(e) =>
            handleChange('preparationInstructions', e.target.value)
          }
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="e.g. No eating 2 hours before appointment"
        />
      </div>

      {/* Requires Appointment Checkbox */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="requiresAppointment"
          checked={
            formData.requiresAppointment ??
            DEFAULT_SERVICE_VALUES.requiresAppointment
          }
          onChange={(e) =>
            handleChange('requiresAppointment', e.target.checked)
          }
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor="requiresAppointment"
          className="text-sm font-medium text-gray-700"
        >
          Requires Appointment
        </label>
      </div>

      {/* Active Status (Edit mode only) */}
      {isEditMode && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 border-t pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin text-lg" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditMode ? 'Update Service' : 'Create Service'}</span>
          )}
        </button>
      </div>
    </form>
  );
};
