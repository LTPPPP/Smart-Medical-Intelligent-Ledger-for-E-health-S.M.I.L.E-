import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";
import type { AxiosError } from "axios";

interface ApiErrorData {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export function extractApiError(
  error: unknown,
  fallback = "Đã có lỗi xảy ra",
): string {
  if (!error) return fallback;

  const axiosErr = error as AxiosError<ApiErrorData>;
  if (axiosErr.isAxiosError) {
    const data = axiosErr.response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    switch (axiosErr.response?.status) {
      case 400:
        return data?.message ?? "Yêu cầu không hợp lệ";
      case 401:
        return "Phiên đăng nhập đã hết hạn";
      case 403:
        return "Bạn không có quyền thực hiện thao tác này";
      case 404:
        return "Không tìm thấy dữ liệu";
      case 409:
        return data?.message ?? "Dữ liệu đã tồn tại";
      case 422:
        return data?.message ?? "Dữ liệu không hợp lệ";
      case 500:
        return "Lỗi máy chủ, vui lòng thử lại sau";
      case 503:
        return "Dịch vụ tạm thời không khả dụng";
    }

    if (axiosErr.message) return axiosErr.message;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export const toast = {
  success: (message: string, options?: ExternalToast) =>
    sonnerToast.success(message, options),

  error: (message: string, options?: ExternalToast) =>
    sonnerToast.error(message, options),

  warning: (message: string, options?: ExternalToast) =>
    sonnerToast.warning(message, options),

  info: (message: string, options?: ExternalToast) =>
    sonnerToast.info(message, options),

  /** Use in mutation onError — automatically extracts server error message */
  apiError: (error: unknown, fallback?: string) => {
    const message = extractApiError(error, fallback);
    return sonnerToast.error(message);
  },

  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
};
