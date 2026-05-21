'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useDentalImage } from '@/features/dental-image/hooks/useDentalImage';
import { ImageUpload } from '@/features/dental-image/components/ImageUpload';
import { ImageGallery } from '@/features/dental-image/components/ImageGallery';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

interface PatientImagesPageProps {
  patientId: string;
}

export default function PatientImagesPage({
  patientId,
}: PatientImagesPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'upload'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const { useImagesByPatient, useCategories } = useDentalImage();

  const {
    data: imagesData,
    isLoading: isLoadingImages,
    error: imagesError,
    refetch: refetchImages,
  } = useImagesByPatient(patientId, {
    page,
    size,
    categoryId: selectedCategory || undefined,
  });

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();

  const images = imagesData?.data?.content || [];
  const categories = categoriesData || [];
  const totalPages = imagesData?.data?.totalPages || 0;
  const totalElements = imagesData?.data?.totalElements || 0;

  if (isLoadingCategories) {
    return <Loading fullScreen text="Loading categories..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dental Images</h1>
            <p className="text-gray-600 mt-1">
              Manage patient dental images and records
            </p>
          </div>
          <button
            onClick={() => refetchImages()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-white transition-colors"
          >
            <Icon icon="mdi:refresh" width={20} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon
                  icon="mdi:image-multiple"
                  className="text-blue-600"
                  width={24}
                />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalElements}</div>
                <div className="text-sm text-gray-500">Total Images</div>
              </div>
            </div>
          </div>

          {categories.slice(0, 3).map((category) => {
            const categoryImages = images.filter(
              (img) => img.categoryId === category.id,
            );
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-md p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon
                      icon="mdi:folder-image"
                      className="text-green-600"
                      width={24}
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {categoryImages.length}
                    </div>
                    <div className="text-sm text-gray-500">{category.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon icon="mdi:image-multiple" width={20} />
                All Images ({totalElements})
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon icon="mdi:upload" width={20} />
                Upload New
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'upload' ? (
              <ImageUpload
                patientId={patientId}
                categories={categories}
                onUploadSuccess={() => {
                  setActiveTab('all');
                  refetchImages();
                }}
              />
            ) : (
              <>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setPage(0);
                      }}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Images Grid */}
                {isLoadingImages ? (
                  <Loading text="Loading images..." />
                ) : imagesError ? (
                  <ErrorMessage
                    message="Failed to load images"
                    onRetry={refetchImages}
                  />
                ) : (
                  <>
                    <ImageGallery
                      images={images}
                      onDeleteSuccess={refetchImages}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <div className="text-sm text-gray-600">
                          Showing <strong>{images.length}</strong> of{' '}
                          <strong>{totalElements}</strong> images
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <span className="px-4 py-2 font-medium">
                            Page {page + 1} of {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setPage((p) => Math.min(totalPages - 1, p + 1))
                            }
                            disabled={page >= totalPages - 1}
                            className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
