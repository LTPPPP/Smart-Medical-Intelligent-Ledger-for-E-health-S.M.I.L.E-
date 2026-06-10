"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicApi } from "../api/clinic";
import { toast } from "@/shared/lib/toast";
import type {
  CreateClinicRequest,
  UpdateClinicRequest,
  CreateTreatmentRoomRequest,
  UpdateTreatmentRoomRequest,
} from "../types/clinic.type";

export const CLINIC_QUERY_KEY = "clinic";

export function useClinic() {
  const queryClient = useQueryClient();

  // Clinic Queries
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

  // Clinic Mutations
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

  // Treatment Room Queries
  const useTreatmentRooms = (
    clinicId: string | null,
    params?: { page?: number; size?: number },
  ) => {
    return useQuery({
      queryKey: [CLINIC_QUERY_KEY, "rooms", clinicId, params],
      queryFn: () => clinicApi.getTreatmentRooms(clinicId!, params),
      enabled: !!clinicId,
    });
  };

  const useTreatmentRoomById = (
    clinicId: string | null,
    roomId: string | null,
  ) => {
    return useQuery({
      queryKey: [CLINIC_QUERY_KEY, "rooms", clinicId, roomId],
      queryFn: () => clinicApi.getTreatmentRoomById(clinicId!, roomId!),
      enabled: !!clinicId && !!roomId,
    });
  };

  // Treatment Room Mutations
  const createRoomMutation = useMutation({
    mutationFn: ({
      clinicId,
      request,
    }: {
      clinicId: string;
      request: CreateTreatmentRoomRequest;
    }) => clinicApi.createTreatmentRoom(clinicId, request),
    onSuccess: (_, { clinicId }) => {
      queryClient.invalidateQueries({
        queryKey: [CLINIC_QUERY_KEY, "rooms", clinicId],
      });
      toast.success("Tạo phòng điều trị thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Tạo phòng điều trị thất bại");
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({
      clinicId,
      roomId,
      request,
    }: {
      clinicId: string;
      roomId: string;
      request: UpdateTreatmentRoomRequest;
    }) => clinicApi.updateTreatmentRoom(clinicId, roomId, request),
    onSuccess: (_, { clinicId }) => {
      queryClient.invalidateQueries({
        queryKey: [CLINIC_QUERY_KEY, "rooms", clinicId],
      });
      toast.success("Cập nhật phòng điều trị thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Cập nhật phòng điều trị thất bại");
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: ({ clinicId, roomId }: { clinicId: string; roomId: string }) =>
      clinicApi.deleteTreatmentRoom(clinicId, roomId),
    onSuccess: (_, { clinicId }) => {
      queryClient.invalidateQueries({
        queryKey: [CLINIC_QUERY_KEY, "rooms", clinicId],
      });
      toast.success("Xóa phòng điều trị thành công!");
    },
    onError: (error) => {
      toast.apiError(error, "Xóa phòng điều trị thất bại");
    },
  });

  return {
    // Queries
    useClinics,
    useClinicById,
    useSearchClinics,
    useTreatmentRooms,
    useTreatmentRoomById,

    // Mutations
    createClinic: createClinicMutation.mutateAsync,
    updateClinic: updateClinicMutation.mutateAsync,
    deleteClinic: deleteClinicMutation.mutateAsync,
    createRoom: createRoomMutation.mutateAsync,
    updateRoom: updateRoomMutation.mutateAsync,
    deleteRoom: deleteRoomMutation.mutateAsync,

    // Loading states
    isCreatingClinic: createClinicMutation.isPending,
    isUpdatingClinic: updateClinicMutation.isPending,
    isDeletingClinic: deleteClinicMutation.isPending,
    isCreatingRoom: createRoomMutation.isPending,
    isUpdatingRoom: updateRoomMutation.isPending,
    isDeletingRoom: deleteRoomMutation.isPending,
  };
}
