import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  DentalImage,
  ImageCategory,
  ImageAnnotation,
  AIAnalysisResult,
  UploadImageRequest,
  BatchUploadRequest,
  UpdateImageRequest,
  CreateCategoryRequest,
  CreateAnnotationRequest,
  ImageListParams,
} from '../types/dental-image.type';

export const dentalImageApi = {
  // Image Upload
  uploadImage: async (
    request: UploadImageRequest,
  ): Promise<BaseResponse<DentalImage>> => {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('patientId', request.patientId);
    formData.append('categoryId', request.categoryId);

    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.toothNumbers) {
      formData.append('toothNumbers', JSON.stringify(request.toothNumbers));
    }
    if (request.tags) {
      formData.append('tags', JSON.stringify(request.tags));
    }

    const { data } = await apiClient.post<BaseResponse<DentalImage>>(
      API_ENDPOINTS.DENTAL_IMAGE.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
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
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<DentalImage>>
    >(API_ENDPOINTS.DENTAL_IMAGE.BY_PATIENT(patientId), { params });
    return data;
  },

  getImageById: async (imageId: string): Promise<BaseResponse<DentalImage>> => {
    const { data } = await apiClient.get<BaseResponse<DentalImage>>(
      API_ENDPOINTS.DENTAL_IMAGE.DETAIL(imageId),
    );
    return data;
  },

  getImagesByCategory: async (
    categoryId: string,
    patientId?: string,
  ): Promise<BaseResponse<DentalImage[]>> => {
    const { data } = await apiClient.get<BaseResponse<DentalImage[]>>(
      API_ENDPOINTS.DENTAL_IMAGE.BY_CATEGORY(categoryId),
      {
        params: { patientId },
      },
    );
    return data;
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
    const { data } = await apiClient.put<BaseResponse<DentalImage>>(
      API_ENDPOINTS.DENTAL_IMAGE.UPDATE(imageId),
      request,
    );
    return data;
  },

  deleteImage: async (imageId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.DENTAL_IMAGE.DELETE(imageId),
    );
    return data;
  },

  // Category Management
  getCategories: async (): Promise<BaseResponse<ImageCategory[]>> => {
    const { data } = await apiClient.get<BaseResponse<ImageCategory[]>>(
      API_ENDPOINTS.IMAGE_CATEGORY.LIST,
    );
    return data;
  },

  createCategory: async (
    request: CreateCategoryRequest,
  ): Promise<BaseResponse<ImageCategory>> => {
    const { data } = await apiClient.post<BaseResponse<ImageCategory>>(
      API_ENDPOINTS.IMAGE_CATEGORY.CREATE,
      request,
    );
    return data;
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
