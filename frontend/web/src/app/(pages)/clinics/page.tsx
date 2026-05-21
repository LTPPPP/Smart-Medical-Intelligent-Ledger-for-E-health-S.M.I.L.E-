'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

import { Clinic } from '@/features/clinic/types/clinic.type';

import { useClinic } from '@/features/clinic/hooks/useClinic';

import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

export default function ClinicsPage() {
  const { useClinics, deleteClinic, isDeletingClinic } = useClinic();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, error, refetch } = useClinics({ page, size });

  const handleDeleteClinic = async (clinic: Clinic) => {
    if (!confirm(`Are you sure you want to delete "${clinic.clinicName}"?`)) return;

    try {
      await deleteClinic(clinic.clinicId);
    } catch{
      alert('Failed to delete clinic');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <Loading fullScreen text="Loading clinics..." />;
  if (error) return <ErrorMessage message="Failed to load clinics" onRetry={refetch} />;

  const clinics = data?.data || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Clinic Management</h1>
            <p className="text-gray-600 mt-1">Manage dental clinics and facilities</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => refetch()}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200"
            >
              <Icon icon="mdi:refresh" width={20} />
              Refresh
            </button>
            <Link 
              href="/clinics/new"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Icon icon="mdi:plus" width={20} />
              New Clinic
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic: Clinic) => (
            <div key={clinic.clinicId} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{clinic.clinicName}</h3>
                    <p className="text-sm text-gray-500">{clinic.clinicCode}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadge(clinic.status)}`}>
                    {clinic.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Icon icon="mdi:map-marker" className="text-gray-400 flex-shrink-0 mt-0.5" width={16} />
                    <span className="text-gray-600">{clinic.address}</span>
                  </div>
                  {clinic.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon icon="mdi:phone" className="text-gray-400" width={16} />
                      <span className="text-gray-600">{clinic.phone}</span>
                    </div>
                  )}
                  {clinic.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon icon="mdi:email" className="text-gray-400" width={16} />
                      <span className="text-gray-600">{clinic.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Link
                    href={`/clinics/${clinic.clinicId}`}
                    className="flex-1 text-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/clinics/${clinic.clinicId}/edit`}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Icon icon="mdi:pencil" width={20} />
                  </Link>
                  <button
                    onClick={() => handleDeleteClinic(clinic)}
                    disabled={isDeletingClinic}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Icon icon="mdi:delete" width={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {clinics.length === 0 && (
          <div className="text-center py-12">
            <Icon icon="mdi:hospital-building" className="mx-auto text-gray-300 mb-4" width={64} />
            <p className="text-gray-500">No clinics found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}