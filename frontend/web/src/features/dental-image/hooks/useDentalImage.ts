'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dentalImageApi } from '../api/dental-image';
import { toast } from '@/shared/lib/toast';
import type {
  UploadImageRequest,
  BatchUploadRequest,
  UpdateImageRequest,
  CreateCategoryRequest,
  ImageListParams,
} from '../types/dental-image.type';

export const DENTAL_IMAGE_QUERY_KEY = 'dental-image';

export function useDentalImage() {
  const queryClient = useQueryClient();

  // Image Queries
  const useImagesByPatient = (patientId: string, params?: ImageListParams) => {
    return useQuery({
      queryKey: [DENTAL_IMAGE_QUERY_KEY, 'patient', patientId, params],
      queryFn: () => dentalImageApi.getImagesByPatient(patientId, params),
      enabled: !!patientId,
    });
  };

  const useImageById = (imageId: string | null) => {
    return useQuery({
      queryKey: [DENTAL_IMAGE_QUERY_KEY, 'image', imageId],
      queryFn: () => dentalImageApi.getImageById(imageId!),
      enabled: !!imageId,
    });
  };

  const useImagesByCategory = (categoryId: string, patientId?: string) => {
    return useQuery({
      queryKey: [
        DENTAL_IMAGE_QUERY_KEY,
        'category',
        categoryId,
        'patient',
        patientId,
      ],
      queryFn: () => dentalImageApi.getImagesByCategory(categoryId, patientId),
      enabled: !!categoryId,
    });
  };

  // Category Queries
  const useCategories = () => {
    return useQuery({
      queryKey: [DENTAL_IMAGE_QUERY_KEY, 'categories'],
      queryFn: () => dentalImageApi.getCategories(),
    });
  };

  // Image Upload Mutations
  const uploadImageMutation = useMutation({
    mutationFn: (request: UploadImageRequest) =>
      dentalImageApi.uploadImage(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [DENTAL_IMAGE_QUERY_KEY, 'patient', variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          DENTAL_IMAGE_QUERY_KEY,
          'category',
          variables.categoryId,
          'patient',
          variables.patientId,
        ],
      });
      toast.success('X-ray image uploaded successfully!');
    },
    onError: (error) => {
      toast.apiError(error, 'Failed to upload X-ray image');
    },
  });

  const uploadBatchMutation = useMutation({
    mutationFn: (request: BatchUploadRequest) =>
      dentalImageApi.uploadBatch(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [DENTAL_IMAGE_QUERY_KEY, 'patient', variables.patientId],
      });
      toast.success('Batch upload successful!');
    },
    onError: (error) => {
      toast.apiError(error, 'Failed to upload image');
    },
  });

  // Image Management Mutations
  const updateImageMutation = useMutation({
    mutationFn: ({
      imageId,
      request,
    }: {
      imageId: string;
      request: UpdateImageRequest;
    }) => dentalImageApi.updateImage(imageId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [DENTAL_IMAGE_QUERY_KEY, 'patient', data.data.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: [DENTAL_IMAGE_QUERY_KEY, 'image', data.data.id],
      });
      toast.success('Image updated successfully!');
    },
    onError: (error) => {
      toast.apiError(error, 'Failed to update image');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => dentalImageApi.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DENTAL_IMAGE_QUERY_KEY] });
      toast.success('Image deleted successfully!');
    },
    onError: (error) => {
      toast.apiError(error, 'Failed to delete image');
    },
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (request: CreateCategoryRequest) =>
      dentalImageApi.createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [DENTAL_IMAGE_QUERY_KEY, 'categories'],
      });
      toast.success('Image category created successfully!');
    },
    onError: (error) => {
      toast.apiError(error, 'Failed to create image category');
    },
  });

  // AI Analysis Mutations
  const analyzeImageMutation = useMutation({
    mutationFn: (imageId: string) => dentalImageApi.analyzeImage(imageId),
    onSuccess: () => {
      toast.success('AI analysis request sent!');
    },
    onError: (error) => {
      toast.apiError(error, 'AI analysis failed');
    },
  });

  const useAnalysisResult = (imageId: string | null) => {
    return useQuery({
      queryKey: [DENTAL_IMAGE_QUERY_KEY, 'analysis', imageId],
      queryFn: () => dentalImageApi.getAnalysisResult(imageId!),
      enabled: !!imageId,
      refetchInterval: (query) => {
        if (query.state.data?.data?.status === 'PROCESSING') {
          return 3000;
        }
        return false;
      },
    });
  };

  // Download helper
  const downloadImage = async (imageId: string, filename: string) => {
    try {
      const blob = await dentalImageApi.downloadImage(imageId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.apiError(error, 'Failed to upload image');
      throw error;
    }
  };

  return {
    // Queries
    useImagesByPatient,
    useImageById,
    useImagesByCategory,
    useCategories,
    useAnalysisResult,

    // Mutations
    uploadImage: uploadImageMutation.mutateAsync,
    uploadBatch: uploadBatchMutation.mutateAsync,
    updateImage: updateImageMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    createCategory: createCategoryMutation.mutateAsync,
    analyzeImage: analyzeImageMutation.mutateAsync,

    // Helpers
    downloadImage,

    // Loading States
    isUploading: uploadImageMutation.isPending,
    isBatchUploading: uploadBatchMutation.isPending,
    isUpdating: updateImageMutation.isPending,
    isDeleting: deleteImageMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
    isAnalyzing: analyzeImageMutation.isPending,

    // Errors
    uploadError: uploadImageMutation.error,
    batchUploadError: uploadBatchMutation.error,
    updateError: updateImageMutation.error,
    deleteError: deleteImageMutation.error,
  };
}
