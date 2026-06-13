'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ServiceCard } from '@/features/service/components/ServiceCard';
import { ServiceFilters } from '@/features/service/components/ServiceFilters';
import {
  useServices,
  useSpecialties,
  useDeleteService,
} from '@/features/service/hooks/useService';
import type { ServiceListParams } from '@/features/service/types/service.type';
import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoServices, demoSpecialties } from '@/shared/data/clinicalDemoData';

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const canManageServices = !!user;

  const [filters, setFilters] = useState<ServiceListParams>({
    page: 0,
    size: 12,
  });

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>();

  // Fetch services
  const { data: servicesData, isLoading: isLoadingServices } = useServices(filters);
  const services = servicesData?.content?.length ? servicesData.content : demoServices;
  const totalPages = servicesData?.totalPages || 1;

  // Fetch specialties for sidebar
  const { data: specialties, isLoading: isLoadingSpecialties } = useSpecialties({
    isActive: true,
  });
  const specialtyList = specialties?.length ? specialties : demoSpecialties;

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
    <OperationsLayout
      title="Services"
      description="Maintain the dental service catalog, specialty grouping, duration, pricing, and appointment eligibility."
      icon="lucide:briefcase-medical"
      actions={[
        ...(canManageServices
          ? [{ label: 'Add service', href: ROUTES.SERVICE_NEW, icon: 'lucide:plus', variant: 'primary' as const }]
          : []),
        { label: 'Specialties', href: ROUTES.SPECIALTIES, icon: 'lucide:stethoscope' },
        { label: 'Clinics', href: ROUTES.CLINICS, icon: 'lucide:hospital' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Services" value={services.length} detail="Visible catalog items" tone="brand" />
        <MetricCard label="Specialties" value={specialtyList.length} detail="Active groups" tone="blue" />
        <MetricCard label="Bookable" value={services.filter((service) => service.requiresAppointment).length} detail="Requires appointment" tone="green" />
        <MetricCard label="From" value={`${Math.min(...services.map((service) => service.basePrice)).toLocaleString()} VND`} detail="Base price" />
      </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Sidebar - Specialties & Filters */}
          <div className="space-y-6 lg:col-span-1">
            {/* Specialties */}
            <div className="border border-smile-border/50 bg-white p-5">
              <h3 className="mb-4 text-lg font-semibold text-smile-primary-dark">
                Specialties
              </h3>
              {isLoadingSpecialties ? (
                <div className="flex justify-center py-8">
                  <Icon icon="mdi:loading" className="animate-spin text-3xl text-smile-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* All Services Option */}
                  <button
                    onClick={() => {
                      setSelectedSpecialty(undefined);
                      setFilters((prev) => {
                        const next = { ...prev };
                        delete next.specialtyId;
                        return next;
                      });
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      !selectedSpecialty
                        ? 'border-smile-primary bg-smile-primary/5'
                        : 'border-smile-border/50 bg-white hover:border-smile-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-smile-primary-dark">All Services</span>
                      <Icon icon="mdi:dental" className="text-xl text-smile-description" />
                    </div>
                  </button>

                  {specialtyList.map((specialty) => (
                    <button
                      key={specialty.specialtyId}
                      onClick={() => handleSpecialtySelect(specialty.specialtyId)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedSpecialty === specialty.specialtyId
                          ? 'border-smile-primary bg-smile-primary/5'
                          : 'border-smile-border/50 bg-white hover:border-smile-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {specialty.iconUrl && (
                          <Icon icon={specialty.iconUrl} className="text-2xl text-smile-primary" />
                        )}
                        <span className="font-medium text-smile-primary-dark">
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
                <Icon icon="mdi:loading" className="animate-spin text-5xl text-smile-primary" />
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-lg border border-smile-border/50 bg-white p-12 text-center">
                <Icon icon="mdi:package-variant" className="mx-auto text-6xl text-smile-description/50" />
                <h3 className="mt-4 text-xl font-semibold text-smile-primary-dark">
                  No services found
                </h3>
                <p className="mt-2 text-smile-title">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-smile-title">
                    Showing {services.length} of {servicesData?.totalElements || 0} services
                  </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.serviceId}
                      service={service}
                      onEdit={canManageServices ? () => handleEditService(service.serviceId) : undefined}
                      onDelete={canManageServices ? () => handleDeleteService(service.serviceId) : undefined}
                      isAdmin={canManageServices}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 0}
                      className="rounded-lg border border-smile-border px-4 py-2 text-sm font-medium text-smile-title hover:bg-smile-footer-bg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon icon="mdi:chevron-left" className="text-xl" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                          filters.page === i
                            ? 'border-smile-primary bg-smile-primary text-white'
                            : 'border-smile-border text-smile-title hover:bg-smile-footer-bg'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages - 1}
                      className="rounded-lg border border-smile-border px-4 py-2 text-sm font-medium text-smile-title hover:bg-smile-footer-bg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon icon="mdi:chevron-right" className="text-xl" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </OperationsLayout>
  );
}
