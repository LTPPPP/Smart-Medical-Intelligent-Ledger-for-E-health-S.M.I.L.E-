'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { SpecialtyCard } from '@/features/service/components/SpecialtyCard';
import { SpecialtyForm } from '@/features/service/components/SpecialtyForm';
import {
  useSpecialties,
  useCreateSpecialty,
  useUpdateSpecialty,
  useDeleteSpecialty,
} from '@/features/service/hooks/useService';
import type {
  Specialty,
  CreateSpecialtyRequest,
  UpdateSpecialtyRequest,
} from '@/features/service/types/service.type';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function SpecialtiesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  // Fetch specialties
  const { data: specialties, isLoading } = useSpecialties();

  // Mutations
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const deleteSpecialty = useDeleteSpecialty();

  const handleOpenModal = (specialty?: Specialty) => {
    setEditingSpecialty(specialty || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSpecialty(null);
  };

  const handleSubmit = async (data: CreateSpecialtyRequest | UpdateSpecialtyRequest) => {
    try {
      if (editingSpecialty) {
        await updateSpecialty.mutateAsync({
          specialtyId: editingSpecialty.specialtyId,
          data: data as UpdateSpecialtyRequest,
        });
      } else {
        await createSpecialty.mutateAsync(data as CreateSpecialtyRequest);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save specialty:', error);
    }
  };

  const handleDelete = async (specialtyId: string) => {
    if (window.confirm('Are you sure you want to delete this specialty?')) {
      try {
        await deleteSpecialty.mutateAsync(specialtyId);
      } catch (error) {
        console.error('Failed to delete specialty:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dental Specialties</h1>
            <p className="mt-2 text-gray-600">
              Manage dental specialty categories
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              <Icon icon="mdi:plus" className="text-xl" />
              Add Specialty
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Icon icon="mdi:loading" className="animate-spin text-5xl text-blue-600" />
          </div>
        ) : !specialties || specialties.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Icon icon="mdi:tag-multiple" className="mx-auto text-6xl text-gray-300" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              No specialties found
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating your first specialty
            </p>
            {isAdmin && (
              <button
                onClick={() => handleOpenModal()}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                <Icon icon="mdi:plus" className="text-xl" />
                Add Specialty
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {specialties.map((specialty) => (
              <SpecialtyCard
                key={specialty.specialtyId}
                specialty={specialty}
                onEdit={isAdmin ? () => handleOpenModal(specialty) : undefined}
                onDelete={isAdmin ? () => handleDelete(specialty.specialtyId) : undefined}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSpecialty ? 'Edit Specialty' : 'Add New Specialty'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>

              <SpecialtyForm
                specialty={editingSpecialty || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
                isPending={createSpecialty.isPending || updateSpecialty.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}