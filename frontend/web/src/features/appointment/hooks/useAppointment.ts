'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appointmentApi,
  CancelAppointmentRequest,
  UpdateAppointmentRequest,
  CreatePaymentRequest,
  SendReminderRequest,
} from '../api/appointment.api';

const APPOINTMENT_KEY = 'appointment';

export function useAppointment() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: [APPOINTMENT_KEY] });

  const useAppointmentById = (id: string) =>
    useQuery({
      queryKey: [APPOINTMENT_KEY, 'detail', id],
      queryFn: () => appointmentApi.getById(id),
      enabled: !!id,
    });

  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: UpdateAppointmentRequest }) =>
      appointmentApi.update(appointmentId, request),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: CancelAppointmentRequest }) =>
      appointmentApi.cancel(appointmentId, request),
    onSuccess: invalidate,
  });

  const confirmMutation = useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.confirm(appointmentId),
    onSuccess: invalidate,
  });

  const createByClinicMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => appointmentApi.createByClinic(data),
    onSuccess: invalidate,
  });

  const createBySpecialtyMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => appointmentApi.createBySpecialty(data),
    onSuccess: invalidate,
  });

  const createByDoctorMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => appointmentApi.createByDoctor(data),
    onSuccess: invalidate,
  });

  const createOutsideHoursMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => appointmentApi.createOutsideHours(data),
    onSuccess: invalidate,
  });

  const createPaymentMutation = useMutation({
    mutationFn: (request: CreatePaymentRequest) => appointmentApi.createPayment(request),
  });

  const sendReminderMutation = useMutation({
    mutationFn: (request: SendReminderRequest) => appointmentApi.sendReminder(request),
  });

  return {
    useAppointmentById,

    updateAppointment: updateMutation.mutateAsync,
    cancelAppointment: cancelMutation.mutateAsync,
    confirmAppointment: confirmMutation.mutateAsync,
    createByClinic: createByClinicMutation.mutateAsync,
    createBySpecialty: createBySpecialtyMutation.mutateAsync,
    createByDoctor: createByDoctorMutation.mutateAsync,
    createOutsideHours: createOutsideHoursMutation.mutateAsync,
    createPayment: createPaymentMutation.mutateAsync,
    sendReminder: sendReminderMutation.mutateAsync,

    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isConfirming: confirmMutation.isPending,
    isCreatingByClinic: createByClinicMutation.isPending,
    isCreatingBySpecialty: createBySpecialtyMutation.isPending,
    isCreatingByDoctor: createByDoctorMutation.isPending,
    isCreatingOutsideHours: createOutsideHoursMutation.isPending,
    isCreatingPayment: createPaymentMutation.isPending,
    isSendingReminder: sendReminderMutation.isPending,
  };
}
