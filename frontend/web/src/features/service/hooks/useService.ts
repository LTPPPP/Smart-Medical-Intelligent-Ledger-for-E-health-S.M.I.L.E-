"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { serviceApi as managementServiceApi } from "../api/service";
import { serviceApi } from "../api/service.api";
import type {
	CreateServiceRequest,
	CreateSpecialtyRequest,
	ServiceListParams,
	SpecialtyListParams,
	UpdateServiceRequest,
	UpdateSpecialtyRequest,
} from "../types/service.type";

const SERVICES_KEY = "services";
const SPECIALTIES_KEY = "specialties";

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

export const useServiceById = useService;

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

export function useCreateService() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (request: CreateServiceRequest) =>
			managementServiceApi.createService(request),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] }),
	});
}

export function useUpdateService() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			serviceId,
			data,
		}: { serviceId: string; data: UpdateServiceRequest }) =>
			managementServiceApi.updateService(serviceId, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] }),
	});
}

export function useCreateSpecialty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (request: CreateSpecialtyRequest) =>
			managementServiceApi.createSpecialty(request),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
	});
}

export function useUpdateSpecialty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			specialtyId,
			data,
		}: { specialtyId: string; data: UpdateSpecialtyRequest }) =>
			managementServiceApi.updateSpecialty(specialtyId, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
	});
}

export function useDeleteSpecialty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (specialtyId: string) =>
			managementServiceApi.deleteSpecialty(specialtyId),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [SPECIALTIES_KEY] }),
	});
}
