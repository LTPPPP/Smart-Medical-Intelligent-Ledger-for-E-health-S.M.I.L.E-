'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import type { DentalImage } from '@/features/dental-image/types/dental-image.type';
import { useDentalImage } from '@/features/dental-image/hooks/useDentalImage';

interface ImageGalleryProps {
  images: DentalImage[];
  onImageSelect?: (image: DentalImage) => void;
  onDeleteSuccess?: () => void;
}

export const ImageGallery = ({
  images,
  onImageSelect,
  onDeleteSuccess,
}: ImageGalleryProps) => {
  const { deleteImage, isDeleting, downloadImage, analyzeImage, isAnalyzing } =
    useDentalImage();
  const [selectedImage, setSelectedImage] = useState<DentalImage | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleImageClick = (image: DentalImage) => {
    setSelectedImage(image);
    setShowLightbox(true);
    onImageSelect?.(image);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteImage(imageId);
      setShowLightbox(false);
      setSelectedImage(null);
      onDeleteSuccess?.();
    } catch (error) {
      alert('Failed to delete image');
    }
  };

  const handleDownload = async (image: DentalImage) => {
    try {
      await downloadImage(image.id, image.originalFilename);
    } catch (error) {
      alert('Failed to download image');
    }
  };

  const handleAnalyze = async (imageId: string) => {
    try {
      await analyzeImage(imageId);
      alert('Image sent for AI analysis. Results will be available shortly.');
    } catch (error) {
      alert('Failed to start analysis');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Icon
          icon="mdi:image-off"
          className="mx-auto mb-3 text-gray-300"
          width={64}
        />
        <p>No images found</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleImageClick(image)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={image.thumbnailUrl}
                alt={image.description || image.filename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Icon icon="mdi:eye" className="text-white" width={32} />
              </div>

              {/* Category Badge */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  {image.categoryName}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium truncate">
                {image.description || image.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(image.uploadedAt)}
              </p>
              {image.tags && image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {image.tags.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-gray-100 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {image.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{image.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="max-w-5xl w-full bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold">
                  {selectedImage.description || selectedImage.filename}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedImage.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => setShowLightbox(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>

            {/* Image */}
            <div className="relative bg-gray-100" style={{ height: '60vh' }}>
              <Image
                src={selectedImage.url}
                alt={selectedImage.description || selectedImage.filename}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-2 justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="mdi:download" width={20} />
                  Download
                </button>
                <button
                  onClick={() => handleAnalyze(selectedImage.id)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isAnalyzing && (
                    <Icon icon="line-md:loading-twotone-loop" width={20} />
                  )}
                  <Icon icon="mdi:brain" width={20} />
                  AI Analysis
                </button>
              </div>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting && (
                  <Icon icon="line-md:loading-twotone-loop" width={20} />
                )}
                <Icon icon="mdi:delete" width={20} />
                Delete
              </button>
            </div>

            {/* Metadata */}
            <div className="p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium">{selectedImage.categoryName}</p>
              </div>
              <div>
                <p className="text-gray-500">File Size</p>
                <p className="font-medium">
                  {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dimensions</p>
                <p className="font-medium">
                  {selectedImage.width} × {selectedImage.height}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Uploaded By</p>
                <p className="font-medium">{selectedImage.uploadedBy}</p>
              </div>
            </div>

            {/* Tags */}
            {selectedImage.tags && selectedImage.tags.length > 0 && (
              <div className="p-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
