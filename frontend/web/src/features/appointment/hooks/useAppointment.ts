'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../api/appointment';
import { toast } from '@/shared/lib/toast';
import type {
  CreateAppointmentByClinicRequest,
  CreateAppointmentBySpecialtyRequest,
  CreateAppointmentByDoctorRequest,
  CreateAppointmentOutsideHoursRequest,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  CreatePaymentRequest,
  SendReminderRequest,
  AppointmentListParams,
  AvailabilityCheckParams,
} from '../types/appointment.type';

export const APPOINTMENT_QUERY_KEY = 'appointment';

export function useAppointment() {
  const queryClient = useQueryClient();

  // QUERIES
  const useAppointmentsByClinic = (clinicId: string | null, params?: AppointmentListParams) => {
    return useQuery({
      queryKey: [APPOINTMENT_QUERY_KEY, 'clinic', clinicId, params],
      queryFn: () => appointmentApi.getByClinic(clinicId!, params),
      enabled: !!clinicId,
    });
  };

  const useAppointmentsByDoctor = (doctorId: string | null, params?: AppointmentListParams) => {
    return useQuery({
      queryKey: [APPOINTMENT_QUERY_KEY, 'doctor', doctorId, params],
      queryFn: () => appointmentApi.getByDoctor(doctorId!, params),
      enabled: !!doctorId,
    });
  };

  const useAppointmentsByPatient = (patientId: string | null, params?: AppointmentListParams) => {
    return useQuery({
      queryKey: [APPOINTMENT_QUERY_KEY, 'patient', patientId, params],
      queryFn: () => appointmentApi.getByPatient(patientId!, params),
      enabled: !!patientId,
    });
  };

  const useAppointmentById = (appointmentId: string | null) => {
    return useQuery({
      queryKey: [APPOINTMENT_QUERY_KEY, 'detail', appointmentId],
      queryFn: () => appointmentApi.getById(appointmentId!),
      enabled: !!appointmentId,
    });
  };

  // MUTATIONS
  const createByClinicMutation = useMutation({
    mutationFn: (request: CreateAppointmentByClinicRequest) =>
      appointmentApi.createByClinic(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Đặt lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Đặt lịch hẹn thất bại');
    },
  });

  const createBySpecialtyMutation = useMutation({
    mutationFn: (request: CreateAppointmentBySpecialtyRequest) =>
      appointmentApi.createBySpecialty(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Đặt lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Đặt lịch hẹn thất bại');
    },
  });

  const createByDoctorMutation = useMutation({
    mutationFn: (request: CreateAppointmentByDoctorRequest) =>
      appointmentApi.createByDoctor(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Đặt lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Đặt lịch hẹn thất bại');
    },
  });

  const createOutsideHoursMutation = useMutation({
    mutationFn: (request: CreateAppointmentOutsideHoursRequest) =>
      appointmentApi.createOutsideHours(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Đặt lịch hẹn ngoài giờ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Đặt lịch hẹn thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: UpdateAppointmentRequest }) =>
      appointmentApi.update(appointmentId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Cập nhật lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật lịch hẹn thất bại');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ appointmentId, request }: { appointmentId: string; request: CancelAppointmentRequest }) =>
      appointmentApi.cancel(appointmentId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Hủy lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Hủy lịch hẹn thất bại');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.confirm(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_QUERY_KEY] });
      toast.success('Xác nhận lịch hẹn thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xác nhận lịch hẹn thất bại');
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (request: CreatePaymentRequest) => appointmentApi.createPayment(request),
    onSuccess: () => {
      toast.success('Tạo thanh toán thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo thanh toán thất bại');
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: (request: SendReminderRequest) => appointmentApi.sendReminder(request),
    onSuccess: () => {
      toast.success('Đã gửi nhắc nhở thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Gửi nhắc nhở thất bại');
    },
  });

  return {
    // Queries
    useAppointmentsByClinic,
    useAppointmentsByDoctor,
    useAppointmentsByPatient,
    useAppointmentById,

    // Mutations
    createByClinic: createByClinicMutation.mutateAsync,
    createBySpecialty: createBySpecialtyMutation.mutateAsync,
    createByDoctor: createByDoctorMutation.mutateAsync,
    createOutsideHours: createOutsideHoursMutation.mutateAsync,
    updateAppointment: updateMutation.mutateAsync,
    cancelAppointment: cancelMutation.mutateAsync,
    confirmAppointment: confirmMutation.mutateAsync,
    createPayment: createPaymentMutation.mutateAsync,
    sendReminder: sendReminderMutation.mutateAsync,

    // Loading states
    isCreatingByClinic: createByClinicMutation.isPending,
    isCreatingBySpecialty: createBySpecialtyMutation.isPending,
    isCreatingByDoctor: createByDoctorMutation.isPending,
    isCreatingOutsideHours: createOutsideHoursMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isConfirming: confirmMutation.isPending,
    isCreatingPayment: createPaymentMutation.isPending,
    isSendingReminder: sendReminderMutation.isPending,
  };
}