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
  fallback = "An error occurred",
): string {
  if (!error) return fallback;

  const axiosErr = error as AxiosError<ApiErrorData>;
  if (axiosErr.isAxiosError) {
    const data = axiosErr.response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    switch (axiosErr.response?.status) {
      case 400:
        return data?.message ?? "Invalid request";
      case 401:
        return "Your session has expired";
      case 403:
        return "You don't have permission to perform this action";
      case 404:
        return "Data not found";
      case 409:
        return data?.message ?? "Data already exists";
      case 422:
        return data?.message ?? "Invalid data";
      case 500:
        return "Server error, please try again later";
      case 503:
        return "Service temporarily unavailable";
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
