export interface DentalImage {
  id: string;
  filename: string;
  originalFilename: string;
  patientId: string;
  categoryId: string;
  categoryName: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  toothNumbers?: number[];
  metadata?: Record<string, any>;
}

export interface ImageCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  allowedFormats: string[];
  isActive: boolean;
}

export interface ImageAnnotation {
  id: string;
  imageId: string;
  type: 'LINE' | 'CIRCLE' | 'ARROW' | 'TEXT' | 'MEASUREMENT';
  data: Record<string, any>;
  createdBy: string;
  createdAt: string;
}

export interface AIAnalysisResult {
  imageId: string;
  analysisId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  predictions?: {
    condition: string;
    confidence: number;
    location?: string;
    severity?: string;
  }[];
  analyzedAt?: string;
  estimatedTime?: number;
  message?: string;
}

// Request Types
export interface UploadImageRequest {
  file: File;
  patientId: string;
  categoryId: string;
  description?: string;
  toothNumbers?: number[];
  tags?: string[];
}

export interface BatchUploadRequest {
  files: File[];
  patientId: string;
  categoryId: string;
}

export interface UpdateImageRequest {
  description?: string;
  tags?: string[];
  toothNumbers?: number[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  allowedFormats: string[];
}

export interface CreateAnnotationRequest {
  imageId: string;
  type: 'LINE' | 'CIRCLE' | 'ARROW' | 'TEXT' | 'MEASUREMENT';
  data: Record<string, any>;
}

// Query Params
export interface ImageListParams {
  page?: number;
  size?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  sort?: string[];
}
