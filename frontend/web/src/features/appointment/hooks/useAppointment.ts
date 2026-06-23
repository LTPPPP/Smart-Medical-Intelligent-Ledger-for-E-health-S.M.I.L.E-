'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentApi } from '../api/appointment.api';
import type {
  AppointmentListParams,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  SendReminderRequest,
  CreatePaymentRequest,
  CreateAppointmentRequest,
} from '../types/appointment.type';

export function useAppointment() {
  const queryClient = useQueryClient();

  const useAppointmentsByPatient = (patientId: string | null, params: AppointmentListParams) =>
    useQuery({
      queryKey: ['appointments', 'patient', patientId, params],
      queryFn: () => appointmentApi.getByPatient(patientId!, params),
      enabled: !!patientId,
    });

  const useAppointmentById = (id: string) =>
    useQuery({
      queryKey: ['appointments', id],
      queryFn: () => appointmentApi.getById(id),
      enabled: !!id,
    });

  const { mutateAsync: cancelAppointment, isPending: isCancelling } = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: CancelAppointmentRequest }) =>
      appointmentApi.cancel(appointmentId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: confirmAppointment, isPending: isConfirming } = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: ConfirmAppointmentRequest }) =>
      appointmentApi.confirm(appointmentId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: updateAppointment, isPending: isUpdating } = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: UpdateAppointmentRequest }) =>
      appointmentApi.update(appointmentId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: createByClinic, isPending: isCreatingByClinic } = useMutation({
    mutationFn: (request: CreateAppointmentRequest) => appointmentApi.createByClinic(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: createBySpecialty, isPending: isCreatingBySpecialty } = useMutation({
    mutationFn: (request: CreateAppointmentRequest) => appointmentApi.createBySpecialty(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: createByDoctor, isPending: isCreatingByDoctor } = useMutation({
    mutationFn: (request: CreateAppointmentRequest) => appointmentApi.createByDoctor(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: createOutsideHours, isPending: isCreatingOutsideHours } = useMutation({
    mutationFn: (request: CreateAppointmentRequest) => appointmentApi.createOutsideHours(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: sendReminder, isPending: isSendingReminder } = useMutation({
    mutationFn: (request: SendReminderRequest) => appointmentApi.sendReminder(request),
  });

  const { mutateAsync: createPayment, isPending: isCreatingPayment } = useMutation({
    mutationFn: (request: CreatePaymentRequest) => appointmentApi.createPayment(request),
  });

  return {
    useAppointmentsByPatient,
    useAppointmentById,
    cancelAppointment,
    isCancelling,
    confirmAppointment,
    isConfirming,
    updateAppointment,
    isUpdating,
    createByClinic,
    isCreatingByClinic,
    createBySpecialty,
    isCreatingBySpecialty,
    createByDoctor,
    isCreatingByDoctor,
    createOutsideHours,
    isCreatingOutsideHours,
    sendReminder,
    isSendingReminder,
    createPayment,
    isCreatingPayment,
  };
}
