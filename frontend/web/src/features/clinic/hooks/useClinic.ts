"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicApi } from "../api/clinic";
import { toast } from "@/shared/lib/toast";
import type {
  CreateClinicRequest,
  UpdateClinicRequest,
} from "../types/clinic.type";

export const CLINIC_QUERY_KEY = "clinic";

export function useClinic() {
  const queryClient = useQueryClient();

  const useClinics = (params?: { page?: number; size?: number }) => {
    return useQuery({
      queryKey: [CLINIC_QUERY_KEY, "list", params],
      queryFn: () => clinicApi.getClinics(params),
    });
  };

  const useClinicById = (clinicId: string | null) => {
    return useQuery({
      queryKey: [CLINIC_QUERY_KEY, "detail", clinicId],
      queryFn: () => clinicApi.getClinicById(clinicId!),
      enabled: !!clinicId,
    });
  };

  const useSearchClinics = (params: {
    name?: string;
    city?: string;
    status?: string;
    page?: number;
    size?: number;
  }) => {
    return useQuery({
      queryKey: [CLINIC_QUERY_KEY, "search", params],
      queryFn: () => clinicApi.searchClinics(params),
      enabled: Object.keys(params).length > 0,
    });
  };

  const createClinicMutation = useMutation({
    mutationFn: (request: CreateClinicRequest) =>
      clinicApi.createClinic(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLINIC_QUERY_KEY] });
      toast.success("Tạo phòng khám thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Tạo phòng khám thất bại");
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: ({
      clinicId,
      request,
    }: {
      clinicId: string;
      request: UpdateClinicRequest;
    }) => clinicApi.updateClinic(clinicId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLINIC_QUERY_KEY] });
      toast.success("Cập nhật phòng khám thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Cập nhật phòng khám thất bại");
    },
  });

  const deleteClinicMutation = useMutation({
    mutationFn: (clinicId: string) => clinicApi.deleteClinic(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLINIC_QUERY_KEY] });
      toast.success("Xóa phòng khám thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Xóa phòng khám thất bại");
    },
  });

  return {
    useClinics,
    useClinicById,
    useSearchClinics,
    createClinic: createClinicMutation.mutateAsync,
    updateClinic: updateClinicMutation.mutateAsync,
    deleteClinic: deleteClinicMutation.mutateAsync,
    isCreatingClinic: createClinicMutation.isPending,
    isUpdatingClinic: updateClinicMutation.isPending,
    isDeletingClinic: deleteClinicMutation.isPending,
  };
}
