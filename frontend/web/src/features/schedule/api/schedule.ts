import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  WorkShift,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  DoctorSchedule,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  DoctorScheduleQueryParams,
  DoctorLeave,
  CreateDoctorLeaveRequest,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  DoctorLeaveQueryParams,
  ScheduleChange,
  CreateScheduleChangeRequest,
  ApproveChangeRequest,
  RejectChangeRequest,
  ScheduleNotification,
  SendNotificationRequest,
  ScheduleStatistics,
  LeaveStatistics,
} from '../types/schedule.type';

export const scheduleApi = {
  // WORK SHIFT APIs
  getWorkShifts: async (): Promise<BaseResponse<WorkShift[]>> => {
    const { data } = await apiClient.get<BaseResponse<WorkShift[]>>(
      API_ENDPOINTS.WORK_SHIFT.LIST,
    );
    return data;
  },

  getWorkShiftById: async (
    shiftId: string,
  ): Promise<BaseResponse<WorkShift>> => {
    const { data } = await apiClient.get<BaseResponse<WorkShift>>(
      API_ENDPOINTS.WORK_SHIFT.DETAIL(shiftId),
    );
    return data;
  },

  createWorkShift: async (
    request: CreateWorkShiftRequest,
  ): Promise<BaseResponse<WorkShift>> => {
    const { data } = await apiClient.post<BaseResponse<WorkShift>>(
      API_ENDPOINTS.WORK_SHIFT.CREATE,
      request,
    );
    return data;
  },

  updateWorkShift: async (
    shiftId: string,
    request: UpdateWorkShiftRequest,
  ): Promise<BaseResponse<WorkShift>> => {
    const { data } = await apiClient.put<BaseResponse<WorkShift>>(
      API_ENDPOINTS.WORK_SHIFT.UPDATE(shiftId),
      request,
    );
    return data;
  },

  deleteWorkShift: async (shiftId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.WORK_SHIFT.DELETE(shiftId),
    );
    return data;
  },

  // DOCTOR SCHEDULE APIs
  getDoctorSchedules: async (
    params?: DoctorScheduleQueryParams,
  ): Promise<BaseResponse<PaginatedResponse<DoctorSchedule>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<DoctorSchedule>>
    >(API_ENDPOINTS.SCHEDULE.LIST, { params });
    return data;
  },

  getDoctorScheduleById: async (
    scheduleId: string,
  ): Promise<BaseResponse<DoctorSchedule>> => {
    const { data } = await apiClient.get<BaseResponse<DoctorSchedule>>(
      API_ENDPOINTS.SCHEDULE.DETAIL(scheduleId),
    );
    return data;
  },

  getSchedulesByDoctor: async (
    doctorId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<BaseResponse<DoctorSchedule[]>> => {
    const { data } = await apiClient.get<BaseResponse<DoctorSchedule[]>>(
      API_ENDPOINTS.SCHEDULE.BY_DOCTOR(doctorId),
      { params },
    );
    return data;
  },

  getSchedulesByClinic: async (
    clinicId: string,
    params?: { date?: string; startDate?: string; endDate?: string },
  ): Promise<BaseResponse<DoctorSchedule[]>> => {
    const { data } = await apiClient.get<BaseResponse<DoctorSchedule[]>>(
      API_ENDPOINTS.SCHEDULE.BY_CLINIC(clinicId),
      { params },
    );
    return data;
  },

  createDoctorSchedule: async (
    request: CreateDoctorScheduleRequest,
  ): Promise<BaseResponse<DoctorSchedule>> => {
    const { data } = await apiClient.post<BaseResponse<DoctorSchedule>>(
      API_ENDPOINTS.SCHEDULE.CREATE,
      request,
    );
    return data;
  },

  updateDoctorSchedule: async (
    scheduleId: string,
    request: UpdateDoctorScheduleRequest,
  ): Promise<BaseResponse<DoctorSchedule>> => {
    const { data } = await apiClient.put<BaseResponse<DoctorSchedule>>(
      API_ENDPOINTS.SCHEDULE.UPDATE(scheduleId),
      request,
    );
    return data;
  },

  cancelDoctorSchedule: async (
    scheduleId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE.CANCEL(scheduleId),
    );
    return data;
  },

  completeDoctorSchedule: async (
    scheduleId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE.COMPLETE(scheduleId),
    );
    return data;
  },

  deleteDoctorSchedule: async (
    scheduleId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE.DELETE(scheduleId),
    );
    return data;
  },

  // DOCTOR LEAVE APIs
  getDoctorLeaves: async (
    params?: DoctorLeaveQueryParams,
  ): Promise<BaseResponse<PaginatedResponse<DoctorLeave>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<DoctorLeave>>
    >(API_ENDPOINTS.DOCTOR_LEAVE.LIST, { params });
    return data;
  },

  getDoctorLeaveById: async (
    leaveId: string,
  ): Promise<BaseResponse<DoctorLeave>> => {
    const { data } = await apiClient.get<BaseResponse<DoctorLeave>>(
      API_ENDPOINTS.DOCTOR_LEAVE.DETAIL(leaveId),
    );
    return data;
  },

  getLeavesByDoctor: async (
    doctorId: string,
    params?: { year?: number; status?: string },
  ): Promise<BaseResponse<DoctorLeave[]>> => {
    const { data } = await apiClient.get<BaseResponse<DoctorLeave[]>>(
      API_ENDPOINTS.DOCTOR_LEAVE.BY_DOCTOR(doctorId),
      { params },
    );
    return data;
  },

  createDoctorLeave: async (
    request: CreateDoctorLeaveRequest,
  ): Promise<BaseResponse<DoctorLeave>> => {
    const { data } = await apiClient.post<BaseResponse<DoctorLeave>>(
      API_ENDPOINTS.DOCTOR_LEAVE.CREATE,
      request,
    );
    return data;
  },

  approveLeave: async (
    leaveId: string,
    request: ApproveLeaveRequest,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.DOCTOR_LEAVE.APPROVE(leaveId),
      request,
    );
    return data;
  },

  rejectLeave: async (
    leaveId: string,
    request: RejectLeaveRequest,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.DOCTOR_LEAVE.REJECT(leaveId),
      request,
    );
    return data;
  },

  deleteLeave: async (leaveId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.DOCTOR_LEAVE.DELETE(leaveId),
    );
    return data;
  },

  // SCHEDULE CHANGE APIs
  getScheduleChanges: async (params?: {
    status?: string;
    doctorId?: string;
  }): Promise<BaseResponse<PaginatedResponse<ScheduleChange>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<ScheduleChange>>
    >(API_ENDPOINTS.SCHEDULE_CHANGE.LIST, { params });
    return data;
  },

  getScheduleChangeById: async (
    changeId: string,
  ): Promise<BaseResponse<ScheduleChange>> => {
    const { data } = await apiClient.get<BaseResponse<ScheduleChange>>(
      API_ENDPOINTS.SCHEDULE_CHANGE.DETAIL(changeId),
    );
    return data;
  },

  createScheduleChange: async (
    request: CreateScheduleChangeRequest,
  ): Promise<BaseResponse<ScheduleChange>> => {
    const { data } = await apiClient.post<BaseResponse<ScheduleChange>>(
      API_ENDPOINTS.SCHEDULE_CHANGE.CREATE,
      request,
    );
    return data;
  },

  approveScheduleChange: async (
    changeId: string,
    request: ApproveChangeRequest,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE_CHANGE.APPROVE(changeId),
      request,
    );
    return data;
  },

  rejectScheduleChange: async (
    changeId: string,
    request: RejectChangeRequest,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE_CHANGE.REJECT(changeId),
      request,
    );
    return data;
  },

  // NOTIFICATION APIs
  getNotifications: async (
    recipientId: string,
    params?: { unreadOnly?: boolean },
  ): Promise<BaseResponse<ScheduleNotification[]>> => {
    const { data } = await apiClient.get<BaseResponse<ScheduleNotification[]>>(
      API_ENDPOINTS.SCHEDULE_NOTIFICATION.BY_RECIPIENT(recipientId),
      { params },
    );
    return data;
  },

  sendNotification: async (
    request: SendNotificationRequest,
  ): Promise<BaseResponse<ScheduleNotification>> => {
    const { data } = await apiClient.post<BaseResponse<ScheduleNotification>>(
      API_ENDPOINTS.SCHEDULE_NOTIFICATION.SEND,
      request,
    );
    return data;
  },

  markNotificationAsRead: async (
    notificationId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.SCHEDULE_NOTIFICATION.MARK_READ(notificationId),
    );
    return data;
  },

  // STATISTICS APIs
  getScheduleStatistics: async (params?: {
    doctorId?: string;
    clinicId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BaseResponse<ScheduleStatistics>> => {
    const { data } = await apiClient.get<BaseResponse<ScheduleStatistics>>(
      API_ENDPOINTS.SCHEDULE.STATISTICS,
      { params },
    );
    return data;
  },

  getLeaveStatistics: async (params?: {
    doctorId?: string;
    year?: number;
  }): Promise<BaseResponse<LeaveStatistics>> => {
    const { data } = await apiClient.get<BaseResponse<LeaveStatistics>>(
      API_ENDPOINTS.DOCTOR_LEAVE.STATISTICS,
      { params },
    );
    return data;
  },
};
