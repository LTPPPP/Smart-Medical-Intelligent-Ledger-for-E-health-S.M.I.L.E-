import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/features/service/api/service';
import { toast } from '@/shared/lib/toast';
import type {
  SpecialtyListParams,
  CreateSpecialtyRequest,
  UpdateSpecialtyRequest,
  ServiceListParams,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '@/features/service/types/service.type';

// Query Keys
export const SERVICE_QUERY_KEY = 'service';
export const SPECIALTY_QUERY_KEY = 'specialty';
export const CATEGORY_QUERY_KEY = 'category';
export const CLINIC_SERVICE_QUERY_KEY = 'clinic-service';

// SPECIALTY HOOKS
export const useSpecialties = (params?: SpecialtyListParams) => {
  return useQuery({
    queryKey: [SPECIALTY_QUERY_KEY, params],
    queryFn: () => serviceApi.getSpecialties(params),
    select: (response) => response.data.content,
  });
};

export const useSpecialtyById = (specialtyId: string) => {
  return useQuery({
    queryKey: [SPECIALTY_QUERY_KEY, specialtyId],
    queryFn: () => serviceApi.getSpecialtyById(specialtyId),
    select: (response) => response.data,
    enabled: !!specialtyId,
  });
};

export const useCreateSpecialty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecialtyRequest) => serviceApi.createSpecialty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPECIALTY_QUERY_KEY] });
      toast.success('Tạo chuyên khoa thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo chuyên khoa thất bại');
    },
  });
};

export const useUpdateSpecialty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      specialtyId,
      data,
    }: {
      specialtyId: string;
      data: UpdateSpecialtyRequest;
    }) => serviceApi.updateSpecialty(specialtyId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: [SPECIALTY_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SPECIALTY_QUERY_KEY, variables.specialtyId],
      });
      toast.success('Cập nhật chuyên khoa thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật chuyên khoa thất bại');
    },
  });
};

export const useDeleteSpecialty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (specialtyId: string) => serviceApi.deleteSpecialty(specialtyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPECIALTY_QUERY_KEY] });
      toast.success('Xóa chuyên khoa thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa chuyên khoa thất bại');
    },
  });
};

// SERVICE HOOKS
export const useServices = (params?: ServiceListParams) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEY, params],
    queryFn: () => serviceApi.getServices(params),
    select: (response) => response.data,
  });
};

export const useServiceById = (serviceId: string) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEY, serviceId],
    queryFn: () => serviceApi.getServiceById(serviceId),
    select: (response) => response.data,
    enabled: !!serviceId,
  });
};

export const useServicesBySpecialty = (specialtyId: string) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEY, 'specialty', specialtyId],
    queryFn: () => serviceApi.getServicesBySpecialty(specialtyId),
    select: (response) => response.data,
    enabled: !!specialtyId,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequest) => serviceApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_QUERY_KEY] });
      toast.success('Tạo dịch vụ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo dịch vụ thất bại');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: UpdateServiceRequest;
    }) => serviceApi.updateService(serviceId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SERVICE_QUERY_KEY, variables.serviceId],
      });
      toast.success('Cập nhật dịch vụ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật dịch vụ thất bại');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => serviceApi.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_QUERY_KEY] });
      toast.success('Xóa dịch vụ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa dịch vụ thất bại');
    },
  });
};

// CATEGORY HOOKS
export const useCategories = () => {
  return useQuery({
    queryKey: [CATEGORY_QUERY_KEY],
    queryFn: serviceApi.getCategories,
    select: (response) => response.data,
  });
};
