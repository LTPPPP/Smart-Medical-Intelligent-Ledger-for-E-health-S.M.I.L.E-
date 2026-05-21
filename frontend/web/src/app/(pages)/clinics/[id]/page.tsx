'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@iconify/react';

import { useClinic } from '@/features/clinic/hooks/useClinic';

import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { TreatmentRoomsList } from '@/features/clinic/components/TreatmentRoomsList';

export default function ClinicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clinicId = params?.id as string;

  const { useClinicById } = useClinic();
  const { data, isLoading, error, refetch } = useClinicById(clinicId);

  const [activeTab, setActiveTab] = useState<'info' | 'rooms'>('info');

  if (isLoading) return <Loading fullScreen text="Loading clinic details..." />;
  if (error) return <ErrorMessage message="Failed to load clinic" onRetry={refetch} />;

  const clinic = data?.data;
  if (!clinic) return <ErrorMessage message="Clinic not found" />;

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Back to Clinics
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{clinic.clinicName}</h1>
              <p className="text-gray-600 mt-1">Code: {clinic.clinicCode}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(clinic.status)}`}>
                {clinic.status}
              </span>
              <button
                onClick={() => router.push(`/clinics/${clinicId}/edit`)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
              >
                <Icon icon="mdi:pencil" width={20} />
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Clinic Information
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'rooms'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Treatment Rooms
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Icon icon="mdi:information" className="text-blue-600" width={24} />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon icon="mdi:phone" className="text-gray-400" width={20} />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{clinic.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon icon="mdi:email" className="text-gray-400" width={20} />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{clinic.email || 'N/A'}</p>
                      </div>
                    </div>
                    {clinic.website && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <Icon icon="mdi:web" className="text-gray-400" width={20} />
                        <div>
                          <p className="text-xs text-gray-500">Website</p>
                          <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            {clinic.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Icon icon="mdi:map-marker" className="text-green-600" width={24} />
                    Address
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{clinic.address}</p>
                    {clinic.ward && <p className="text-sm text-gray-600 mt-1">Ward: {clinic.ward}</p>}
                    {clinic.district && <p className="text-sm text-gray-600">District: {clinic.district}</p>}
                    {clinic.city && <p className="text-sm text-gray-600">City: {clinic.city}</p>}
                  </div>
                </div>

                {/* Operating Hours */}
                {clinic.operatingHours && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Icon icon="mdi:clock-outline" className="text-purple-600" width={24} />
                      Operating Hours
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(clinic.operatingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="capitalize font-medium">{day}</span>
                          <span className="text-gray-600">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* License */}
                {(clinic.licenseNumber || clinic.licenseExpiry) && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Icon icon="mdi:certificate" className="text-orange-600" width={24} />
                      License Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clinic.licenseNumber && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">License Number</p>
                          <p className="font-medium">{clinic.licenseNumber}</p>
                        </div>
                      )}
                      {clinic.licenseExpiry && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Expiry Date</p>
                          <p className="font-medium">{new Date(clinic.licenseExpiry).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rooms' && (
              <TreatmentRoomsList clinicId={clinicId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}