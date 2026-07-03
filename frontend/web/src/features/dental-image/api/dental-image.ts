import { useAuthStore } from '@/features/auth/store/authStore';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  DentalImage,
  ImageCategory,
  AIAnalysisResult,
  UploadImageRequest,
  BatchUploadRequest,
  UpdateImageRequest,
  CreateCategoryRequest,
  ImageListParams,
} from '../types/dental-image.type';

interface RawDentalImage {
  image_id: string;
  patient_id: string;
  record_id?: string | null;
  category_id?: string | null;
  category?: { category_name?: string | null } | null;
  image_type: string;
  image_url: string;
  thumbnail_url?: string | null;
  file_size_kb?: number | null;
  file_format?: string | null;
  tooth_numbers?: number[] | null;
  description?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  uploaded_by: string;
  created_at?: string;
  updated_at?: string;
}

interface RawImageCategory {
  category_id: string;
  category_name: string;
  description?: string | null;
}

const unwrap = <T>(payload: T | { data?: T }): T =>
  payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data: T }).data
    : (payload as T);

const mapImage = (raw: RawDentalImage): DentalImage => ({
  id: raw.image_id,
  filename: raw.image_url.split('/').pop() || raw.image_id,
  originalFilename: raw.image_url.split('/').pop() || raw.image_id,
  patientId: raw.patient_id,
  categoryId: raw.category_id ?? '',
  categoryName: raw.category?.category_name ?? raw.image_type,
  description: raw.description ?? undefined,
  url: raw.image_url,
  thumbnailUrl: raw.thumbnail_url || raw.image_url,
  fileSize: (raw.file_size_kb ?? 0) * 1024,
  mimeType: raw.file_format ? `image/${raw.file_format}` : 'image/*',
  width: Number(raw.metadata?.width ?? 0),
  height: Number(raw.metadata?.height ?? 0),
  uploadedBy: raw.uploaded_by,
  uploadedAt: raw.created_at ?? raw.updated_at ?? new Date().toISOString(),
  tags: raw.tags ?? undefined,
  toothNumbers: raw.tooth_numbers ?? undefined,
  metadata: raw.metadata ?? undefined,
});

const mapCategory = (raw: RawImageCategory): ImageCategory => ({
  categoryId: raw.category_id,
  categoryName: raw.category_name,
  description: raw.description ?? '',
  allowedFormats: [],
  isActive: true,
});

const pageOf = <T>(
  content: T[],
  params?: ImageListParams,
): PaginatedResponse<T> => ({
  content,
  totalPages: 1,
  totalElements: content.length,
  number: params?.page ?? 0,
  size: params?.size ?? content.length,
  first: true,
  last: true,
  empty: content.length === 0,
  numberOfElements: content.length,
});

export const dentalImageApi = {
  // Image Upload
  uploadImage: async (
    request: UploadImageRequest,
  ): Promise<BaseResponse<DentalImage>> => {
    const actorId = useAuthStore.getState().user?.userId;
    if (!actorId) {
      throw new Error('A signed-in user is required to create image metadata.');
    }
    const storageKey = `dental-images/${request.patientId}/${Date.now()}-${request.file.name}`;
    const { data } = await apiClient.post<RawDentalImage>(
      API_ENDPOINTS.DENTAL_IMAGE.UPLOAD,
      {
        patient_id: request.patientId,
        category_id: request.categoryId || undefined,
        image_type: 'dental',
        image_url: storageKey,
        thumbnail_url: storageKey,
        file_size_kb: Math.max(1, Math.round(request.file.size / 1024)),
        file_format: request.file.type.split('/')[1] || 'image',
        description: request.description,
        tooth_numbers: request.toothNumbers,
        tags: request.tags,
        uploaded_by: actorId,
      },
    );
    return { success: true, message: 'Image metadata created', data: mapImage(unwrap(data)) };
  },

  uploadBatch: async (
    request: BatchUploadRequest,
  ): Promise<BaseResponse<DentalImage[]>> => {
    const formData = new FormData();

    request.files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('patientId', request.patientId);
    formData.append('categoryId', request.categoryId);

    const { data } = await apiClient.post<BaseResponse<DentalImage[]>>(
      API_ENDPOINTS.DENTAL_IMAGE.UPLOAD_BATCH,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
  },

  // Image Retrieval
  getImagesByPatient: async (
    patientId: string,
    params?: ImageListParams,
  ): Promise<BaseResponse<PaginatedResponse<DentalImage>>> => {
    const { data } = await apiClient.get<RawDentalImage[]>(
      API_ENDPOINTS.DENTAL_IMAGE.BY_PATIENT(patientId),
      { params },
    );
    const images = unwrap(data).map(mapImage);
    return {
      success: true,
      message: 'Images loaded',
      data: pageOf(images, params),
    };
  },

  getImageById: async (imageId: string): Promise<BaseResponse<DentalImage>> => {
    const { data } = await apiClient.get<RawDentalImage>(
      API_ENDPOINTS.DENTAL_IMAGE.DETAIL(imageId),
    );
    return { success: true, message: 'Image loaded', data: mapImage(unwrap(data)) };
  },

  getImagesByCategory: async (
    categoryId: string,
    patientId?: string,
  ): Promise<BaseResponse<DentalImage[]>> => {
    const { data } = await apiClient.get<RawDentalImage[]>(
      API_ENDPOINTS.DENTAL_IMAGE.BY_CATEGORY(categoryId),
      {
        params: { patientId },
      },
    );
    return { success: true, message: 'Images loaded', data: unwrap(data).map(mapImage) };
  },

  downloadImage: async (imageId: string): Promise<Blob> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.DENTAL_IMAGE.DOWNLOAD(imageId),
      {
        responseType: 'blob',
      },
    );
    return data;
  },

  // Image Management
  updateImage: async (
    imageId: string,
    request: UpdateImageRequest,
  ): Promise<BaseResponse<DentalImage>> => {
    const { data } = await apiClient.patch<RawDentalImage>(
      API_ENDPOINTS.DENTAL_IMAGE.UPDATE(imageId),
      {
        description: request.description,
        tags: request.tags,
        tooth_numbers: request.toothNumbers,
      },
    );
    return { success: true, message: 'Image updated', data: mapImage(unwrap(data)) };
  },

  deleteImage: async (imageId: string): Promise<BaseResponse<void>> => {
    await apiClient.delete(
      API_ENDPOINTS.DENTAL_IMAGE.DELETE(imageId),
    );
    return { success: true, message: 'Image deleted', data: undefined };
  },

  // Category Management
  getCategories: async (): Promise<BaseResponse<ImageCategory[]>> => {
    const { data } = await apiClient.get<RawImageCategory[]>(
      API_ENDPOINTS.IMAGE_CATEGORY.LIST,
    );
    return { success: true, message: 'Categories loaded', data: unwrap(data).map(mapCategory) };
  },

  createCategory: async (
    request: CreateCategoryRequest,
  ): Promise<BaseResponse<ImageCategory>> => {
    const { data } = await apiClient.post<RawImageCategory>(
      API_ENDPOINTS.IMAGE_CATEGORY.CREATE,
      {
        category_name: request.name,
        description: request.description,
      },
    );
    return { success: true, message: 'Category created', data: mapCategory(unwrap(data)) };
  },

  // AI Analysis
  analyzeImage: async (
    imageId: string,
  ): Promise<BaseResponse<AIAnalysisResult>> => {
    const { data } = await apiClient.post<BaseResponse<AIAnalysisResult>>(
      API_ENDPOINTS.DENTAL_IMAGE.ANALYZE(imageId),
    );
    return data;
  },

  getAnalysisResult: async (
    imageId: string,
  ): Promise<BaseResponse<AIAnalysisResult>> => {
    const { data } = await apiClient.get<BaseResponse<AIAnalysisResult>>(
      API_ENDPOINTS.DENTAL_IMAGE.ANALYSIS_RESULT(imageId),
    );
    return data;
  },
};
