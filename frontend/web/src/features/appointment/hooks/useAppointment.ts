'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/shared/lib/toast';

import { appointmentApi } from '../api/appointment.api';
import type {
  AppointmentListParams,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  SendReminderRequest,
  CreatePaymentRequest,
  RefundPaymentRequest,
} from '../types/appointment.type';

export function useAppointment() {
  const queryClient = useQueryClient();

  const useAppointmentsList = (params?: Record<string, unknown>) =>
    useQuery({
      queryKey: ['appointments', 'list', params],
      queryFn: () => appointmentApi.getAll(params),
    });

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
    mutationFn: (appointmentId: string) => appointmentApi.confirm(appointmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: updateAppointment, isPending: isUpdating } = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: UpdateAppointmentRequest }) =>
      appointmentApi.update(appointmentId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { mutateAsync: sendReminder, isPending: isSendingReminder } = useMutation({
    mutationFn: (request: SendReminderRequest) => appointmentApi.sendReminder(request),
  });

  const { mutateAsync: createPayment, isPending: isCreatingPayment } = useMutation({
    mutationFn: (request: CreatePaymentRequest) => appointmentApi.createPayment(request),
  });

  const usePaymentsByAppointment = (appointmentId: string | null) =>
    useQuery({
      queryKey: ['payments', 'appointment', appointmentId],
      queryFn: () => appointmentApi.getPaymentsByAppointment(appointmentId!),
      enabled: !!appointmentId,
    });

  const { mutateAsync: refundPayment, isPending: isRefunding } = useMutation({
    mutationFn: ({ paymentId, request }: { paymentId: string; request: RefundPaymentRequest }) =>
      appointmentApi.refundPayment(paymentId, request),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => toast.apiError(error, 'Failed to process refund'),
  });

  return {
    useAppointmentsList,
    useAppointmentsByPatient,
    useAppointmentById,
    cancelAppointment,
    isCancelling,
    confirmAppointment,
    isConfirming,
    updateAppointment,
    isUpdating,
    sendReminder,
    isSendingReminder,
    createPayment,
    isCreatingPayment,
    usePaymentsByAppointment,
    refundPayment,
    isRefunding,
  };
}
