'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';
import type { ServiceListParams, SpecialtyListParams } from '../types/service.type';

const SERVICES_KEY = 'services';
const SPECIALTIES_KEY = 'specialties';

export function useServices(params: ServiceListParams = {}) {
  return useQuery({
    queryKey: [SERVICES_KEY, params],
    queryFn: () => serviceApi.getServices(params),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: [SERVICES_KEY, id],
    queryFn: () => serviceApi.getService(id),
    enabled: !!id,
  });
}

export function useSpecialties(params: SpecialtyListParams = {}) {
  return useQuery({
    queryKey: [SPECIALTIES_KEY, params],
    queryFn: () => serviceApi.getSpecialties(params),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}
