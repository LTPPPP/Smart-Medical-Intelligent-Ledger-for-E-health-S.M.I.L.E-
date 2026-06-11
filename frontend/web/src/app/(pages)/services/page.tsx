'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { ServiceCard } from '@/features/service/components/ServiceCard';
import { ServiceFilters } from '@/features/service/components/ServiceFilters';
import { SpecialtyCard } from '@/features/service/components/SpecialtyCard';
import {
  useServices,
  useSpecialties,
  useDeleteService,
} from '@/features/service/hooks/useService';
import type { ServiceListParams } from '@/features/service/types/service.type';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [filters, setFilters] = useState<ServiceListParams>({
    page: 0,
    size: 12,
  });

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>();

  // Fetch services
  const { data: servicesData, isLoading: isLoadingServices } = useServices(filters);
  const services = servicesData?.content || [];
  const totalPages = servicesData?.totalPages || 0;

  // Fetch specialties for sidebar
  const { data: specialties, isLoading: isLoadingSpecialties } = useSpecialties({
    isActive: true,
  });

  // Delete mutation
  const deleteService = useDeleteService();

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 0, // Reset to first page on filter change
    }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 0, size: 12 });
    setSelectedSpecialty(undefined);
  };

  const handleSpecialtySelect = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
    setFilters((prev) => ({
      ...prev,
      specialtyId,
      page: 0,
    }));
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/services/${serviceId}/edit`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService.mutateAsync(serviceId);
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dental Services</h1>
            <p className="mt-2 text-gray-600">
              Browse our comprehensive dental services
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => router.push('/services/new')}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              <Icon icon="mdi:plus" className="text-xl" />
              Add Service
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar - Specialties & Filters */}
          <div className="space-y-6 lg:col-span-1">
            {/* Specialties */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Specialties
              </h3>
              {isLoadingSpecialties ? (
                <div className="flex justify-center py-8">
                  <Icon icon="mdi:loading" className="animate-spin text-3xl text-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* All Services Option */}
                  <button
                    onClick={() => {
                      setSelectedSpecialty(undefined);
                      setFilters((prev) => {
                        const { specialtyId, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      !selectedSpecialty
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">All Services</span>
                      <Icon icon="mdi:dental" className="text-xl text-gray-400" />
                    </div>
                  </button>

                  {specialties?.map((specialty) => (
                    <button
                      key={specialty.specialtyId}
                      onClick={() => handleSpecialtySelect(specialty.specialtyId)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedSpecialty === specialty.specialtyId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {specialty.iconUrl && (
                          <Icon icon={specialty.iconUrl} className="text-2xl text-blue-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {specialty.specialtyName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <ServiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content - Services Grid */}
          <div className="lg:col-span-3">
            {isLoadingServices ? (
              <div className="flex justify-center py-20">
                <Icon icon="mdi:loading" className="animate-spin text-5xl text-blue-600" />
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <Icon icon="mdi:package-variant" className="mx-auto text-6xl text-gray-300" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  No services found
                </h3>
                <p className="mt-2 text-gray-600">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {services.length} of {servicesData?.totalElements || 0} services
                  </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.serviceId}
                      service={service}
                      onEdit={isAdmin ? () => handleEditService(service.serviceId) : undefined}
                      onDelete={isAdmin ? () => handleDeleteService(service.serviceId) : undefined}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 0}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon icon="mdi:chevron-left" className="text-xl" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                          filters.page === i
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages - 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon icon="mdi:chevron-right" className="text-xl" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}