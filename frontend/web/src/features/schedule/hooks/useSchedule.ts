'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../api/schedule';
import { toast } from '@/shared/lib/toast';
import type {
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  DoctorScheduleQueryParams,
  CreateDoctorLeaveRequest,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  DoctorLeaveQueryParams,
  CreateScheduleChangeRequest,
  ApproveChangeRequest,
  RejectChangeRequest,
  SendNotificationRequest,
} from '../types/schedule.type';

export const SCHEDULE_QUERY_KEY = 'schedule';

export function useSchedule() {
  const queryClient = useQueryClient();

  // WORK SHIFT QUERIES
  const useWorkShifts = () => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'work-shifts'],
      queryFn: () => scheduleApi.getWorkShifts(),
    });
  };

  const useWorkShiftById = (shiftId: string | null) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'work-shifts', shiftId],
      queryFn: () => scheduleApi.getWorkShiftById(shiftId!),
      enabled: !!shiftId,
    });
  };

  // WORK SHIFT MUTATIONS
  const createWorkShiftMutation = useMutation({
    mutationFn: (request: CreateWorkShiftRequest) =>
      scheduleApi.createWorkShift(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'work-shifts'],
      });
      toast.success('Tạo ca làm việc thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo ca làm việc thất bại');
    },
  });

  const updateWorkShiftMutation = useMutation({
    mutationFn: ({
      shiftId,
      request,
    }: {
      shiftId: string;
      request: UpdateWorkShiftRequest;
    }) => scheduleApi.updateWorkShift(shiftId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'work-shifts'],
      });
      toast.success('Cập nhật ca làm việc thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật ca làm việc thất bại');
    },
  });

  const deleteWorkShiftMutation = useMutation({
    mutationFn: (shiftId: string) => scheduleApi.deleteWorkShift(shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'work-shifts'],
      });
      toast.success('Xóa ca làm việc thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa ca làm việc thất bại');
    },
  });

  // DOCTOR SCHEDULE QUERIES
  const useDoctorSchedules = (params?: DoctorScheduleQueryParams) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules', params],
      queryFn: () => scheduleApi.getDoctorSchedules(params),
    });
  };

  const useDoctorScheduleById = (scheduleId: string | null) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules', scheduleId],
      queryFn: () => scheduleApi.getDoctorScheduleById(scheduleId!),
      enabled: !!scheduleId,
    });
  };

  const useSchedulesByDoctor = (
    doctorId: string | null,
    params?: { startDate?: string; endDate?: string },
  ) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'by-doctor', doctorId, params],
      queryFn: () => scheduleApi.getSchedulesByDoctor(doctorId!, params),
      enabled: !!doctorId,
    });
  };

  const useSchedulesByClinic = (
    clinicId: string | null,
    params?: { date?: string; startDate?: string; endDate?: string },
  ) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'by-clinic', clinicId, params],
      queryFn: () => scheduleApi.getSchedulesByClinic(clinicId!, params),
      enabled: !!clinicId,
    });
  };

  // DOCTOR SCHEDULE MUTATIONS
  const createDoctorScheduleMutation = useMutation({
    mutationFn: (request: CreateDoctorScheduleRequest) =>
      scheduleApi.createDoctorSchedule(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules'],
      });
      toast.success('Tạo lịch bác sĩ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo lịch bác sĩ thất bại');
    },
  });

  const updateDoctorScheduleMutation = useMutation({
    mutationFn: ({
      scheduleId,
      request,
    }: {
      scheduleId: string;
      request: UpdateDoctorScheduleRequest;
    }) => scheduleApi.updateDoctorSchedule(scheduleId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules'],
      });
      toast.success('Cập nhật lịch bác sĩ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật lịch bác sĩ thất bại');
    },
  });

  const cancelDoctorScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      scheduleApi.cancelDoctorSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules'],
      });
      toast.success('Hủy lịch bác sĩ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Hủy lịch bác sĩ thất bại');
    },
  });

  const completeDoctorScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      scheduleApi.completeDoctorSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules'],
      });
      toast.success('Hoàn tất lịch bác sĩ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Hoàn tất lịch bác sĩ thất bại');
    },
  });

  const deleteDoctorScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      scheduleApi.deleteDoctorSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-schedules'],
      });
      toast.success('Xóa lịch bác sĩ thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa lịch bác sĩ thất bại');
    },
  });

  // DOCTOR LEAVE QUERIES
  const useDoctorLeaves = (params?: DoctorLeaveQueryParams) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves', params],
      queryFn: () => scheduleApi.getDoctorLeaves(params),
    });
  };

  const useDoctorLeaveById = (leaveId: string | null) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves', leaveId],
      queryFn: () => scheduleApi.getDoctorLeaveById(leaveId!),
      enabled: !!leaveId,
    });
  };

  const useLeavesByDoctor = (
    doctorId: string | null,
    params?: { year?: number; status?: string },
  ) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'leaves-by-doctor', doctorId, params],
      queryFn: () => scheduleApi.getLeavesByDoctor(doctorId!, params),
      enabled: !!doctorId,
    });
  };

  // DOCTOR LEAVE MUTATIONS
  const createDoctorLeaveMutation = useMutation({
    mutationFn: (request: CreateDoctorLeaveRequest) =>
      scheduleApi.createDoctorLeave(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves'],
      });
      toast.success('Tạo đơn nghỉ phép thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo đơn nghỉ phép thất bại');
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({
      leaveId,
      request,
    }: {
      leaveId: string;
      request: ApproveLeaveRequest;
    }) => scheduleApi.approveLeave(leaveId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves'],
      });
      toast.success('Duyệt đơn nghỉ phép thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Duyệt đơn nghỉ phép thất bại');
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({
      leaveId,
      request,
    }: {
      leaveId: string;
      request: RejectLeaveRequest;
    }) => scheduleApi.rejectLeave(leaveId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves'],
      });
      toast.success('Đã từ chối đơn nghỉ phép!');
    },
    onError: (error) => {
      toast.apiError(error, 'Từ chối đơn nghỉ phép thất bại');
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (leaveId: string) => scheduleApi.deleteLeave(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'doctor-leaves'],
      });
      toast.success('Xóa đơn nghỉ phép thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa đơn nghỉ phép thất bại');
    },
  });

  // SCHEDULE CHANGE QUERIES & MUTATIONS
  const useScheduleChanges = (params?: {
    status?: string;
    doctorId?: string;
  }) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'schedule-changes', params],
      queryFn: () => scheduleApi.getScheduleChanges(params),
    });
  };

  const createScheduleChangeMutation = useMutation({
    mutationFn: (request: CreateScheduleChangeRequest) =>
      scheduleApi.createScheduleChange(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'schedule-changes'],
      });
      toast.success('Tạo yêu cầu thay đổi lịch thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo yêu cầu thay đổi lịch thất bại');
    },
  });

  const approveScheduleChangeMutation = useMutation({
    mutationFn: ({
      changeId,
      request,
    }: {
      changeId: string;
      request: ApproveChangeRequest;
    }) => scheduleApi.approveScheduleChange(changeId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'schedule-changes'],
      });
      toast.success('Duyệt thay đổi lịch thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Duyệt thay đổi lịch thất bại');
    },
  });

  const rejectScheduleChangeMutation = useMutation({
    mutationFn: ({
      changeId,
      request,
    }: {
      changeId: string;
      request: RejectChangeRequest;
    }) => scheduleApi.rejectScheduleChange(changeId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'schedule-changes'],
      });
      toast.success('Đã từ chối yêu cầu thay đổi lịch!');
    },
    onError: (error) => {
      toast.apiError(error, 'Từ chối thay đổi lịch thất bại');
    },
  });

  // NOTIFICATION QUERIES & MUTATIONS
  const useNotifications = (
    recipientId: string | null,
    params?: { unreadOnly?: boolean },
  ) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'notifications', recipientId, params],
      queryFn: () => scheduleApi.getNotifications(recipientId!, params),
      enabled: !!recipientId,
    });
  };

  const sendNotificationMutation = useMutation({
    mutationFn: (request: SendNotificationRequest) =>
      scheduleApi.sendNotification(request),
  });

  const markNotificationAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      scheduleApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SCHEDULE_QUERY_KEY, 'notifications'],
      });
    },
  });

  // STATISTICS QUERIES
  const useScheduleStatistics = (params?: {
    doctorId?: string;
    clinicId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'statistics', params],
      queryFn: () => scheduleApi.getScheduleStatistics(params),
    });
  };

  const useLeaveStatistics = (params?: {
    doctorId?: string;
    year?: number;
  }) => {
    return useQuery({
      queryKey: [SCHEDULE_QUERY_KEY, 'leave-statistics', params],
      queryFn: () => scheduleApi.getLeaveStatistics(params),
    });
  };

  return {
    // Work Shift Queries
    useWorkShifts,
    useWorkShiftById,

    // Work Shift Mutations
    createWorkShift: createWorkShiftMutation.mutateAsync,
    updateWorkShift: updateWorkShiftMutation.mutateAsync,
    deleteWorkShift: deleteWorkShiftMutation.mutateAsync,

    // Doctor Schedule Queries
    useDoctorSchedules,
    useDoctorScheduleById,
    useSchedulesByDoctor,
    useSchedulesByClinic,

    // Doctor Schedule Mutations
    createDoctorSchedule: createDoctorScheduleMutation.mutateAsync,
    updateDoctorSchedule: updateDoctorScheduleMutation.mutateAsync,
    cancelDoctorSchedule: cancelDoctorScheduleMutation.mutateAsync,
    completeDoctorSchedule: completeDoctorScheduleMutation.mutateAsync,
    deleteDoctorSchedule: deleteDoctorScheduleMutation.mutateAsync,

    // Doctor Leave Queries
    useDoctorLeaves,
    useDoctorLeaveById,
    useLeavesByDoctor,

    // Doctor Leave Mutations
    createDoctorLeave: createDoctorLeaveMutation.mutateAsync,
    approveLeave: approveLeaveMutation.mutateAsync,
    rejectLeave: rejectLeaveMutation.mutateAsync,
    deleteLeave: deleteLeaveMutation.mutateAsync,

    // Schedule Change Queries & Mutations
    useScheduleChanges,
    createScheduleChange: createScheduleChangeMutation.mutateAsync,
    approveScheduleChange: approveScheduleChangeMutation.mutateAsync,
    rejectScheduleChange: rejectScheduleChangeMutation.mutateAsync,

    // Notification Queries & Mutations
    useNotifications,
    sendNotification: sendNotificationMutation.mutateAsync,
    markNotificationAsRead: markNotificationAsReadMutation.mutateAsync,

    // Statistics Queries
    useScheduleStatistics,
    useLeaveStatistics,

    // Loading States
    isCreatingWorkShift: createWorkShiftMutation.isPending,
    isUpdatingWorkShift: updateWorkShiftMutation.isPending,
    isDeletingWorkShift: deleteWorkShiftMutation.isPending,

    isCreatingSchedule: createDoctorScheduleMutation.isPending,
    isUpdatingSchedule: updateDoctorScheduleMutation.isPending,
    isCancellingSchedule: cancelDoctorScheduleMutation.isPending,
    isCompletingSchedule: completeDoctorScheduleMutation.isPending,
    isDeletingSchedule: deleteDoctorScheduleMutation.isPending,

    isCreatingLeave: createDoctorLeaveMutation.isPending,
    isApprovingLeave: approveLeaveMutation.isPending,
    isRejectingLeave: rejectLeaveMutation.isPending,
    isDeletingLeave: deleteLeaveMutation.isPending,

    isCreatingChange: createScheduleChangeMutation.isPending,
    isApprovingChange: approveScheduleChangeMutation.isPending,
    isRejectingChange: rejectScheduleChangeMutation.isPending,

    isSendingNotification: sendNotificationMutation.isPending,
  };
}
