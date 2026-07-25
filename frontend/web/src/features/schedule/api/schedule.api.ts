import { apiClient as api } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

import type {
  DoctorSchedule,
  DoctorLeave,
  DoctorScheduleParams,
  DoctorLeaveParams,
  PaginatedResponse,
  ScheduleRaw,
  LeaveRaw,
  PaginatedRaw,
} from '../types/schedule.type';

function mapSchedule(raw: ScheduleRaw): DoctorSchedule {
  return {
    doctorScheduleId: raw.schedule_id ?? raw.doctorScheduleId ?? '',
    doctorId: raw.doctor_id ?? raw.doctorId ?? '',
    clinicId: raw.clinic_id ?? raw.clinicId ?? '',
    shiftId: raw.shift_id ?? raw.shiftId ?? null,
    workDate: raw.work_date ?? raw.workDate ?? '',
    roomId: raw.room_id ?? raw.roomId ?? null,
    maxPatients: raw.max_patients ?? raw.maxPatients ?? 20,
    status: (raw.status ?? 'SCHEDULED').toUpperCase() as DoctorSchedule['status'],
    notes: raw.notes ?? null,
    doctorName: raw.doctor?.full_name ?? raw.doctorName,
    clinicName: raw.clinic?.clinic_name ?? raw.clinicName,
    shiftName: raw.shift?.shift_name ?? raw.shiftName,
    shiftStartTime: raw.shift?.start_time ?? raw.shiftStartTime,
    shiftEndTime: raw.shift?.end_time ?? raw.shiftEndTime,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

function mapLeave(raw: LeaveRaw): DoctorLeave {
  return {
    doctorLeaveId: raw.leave_id ?? raw.doctorLeaveId ?? '',
    doctorId: raw.doctor_id ?? raw.doctorId ?? '',
    leaveType: raw.leave_type ?? raw.leaveType ?? null,
    startDate: raw.start_date ?? raw.startDate ?? '',
    endDate: raw.end_date ?? raw.endDate ?? '',
    reason: raw.reason ?? null,
    status: (raw.status ?? 'PENDING').toUpperCase() as DoctorLeave['status'],
    approvedBy: raw.approved_by ?? raw.approvedBy ?? null,
    doctorName: raw.doctor?.full_name ?? raw.doctorName,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

function normalizePaginated<R, O>(
  res: PaginatedRaw<R>,
  mapper: (r: R) => O,
  pageSize: number,
): PaginatedResponse<O> {
  const rawItems: R[] =
    (res.data as R[] | undefined) ??
    (Array.isArray(res.data)
      ? (res.data as R[])
      : ((res.data as { content?: R[] })?.content ?? [])) ??
    res.content ??
    res.items ??
    [];
  const total: number = res.total ?? res.totalElements ?? rawItems.length;
  return {
    data: {
      content: (Array.isArray(rawItems) ? rawItems : []).map(mapper),
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      total,
    },
  };
}

export const scheduleApi = {
  getDoctorSchedules: async (
    params?: DoctorScheduleParams,
  ): Promise<PaginatedResponse<DoctorSchedule>> => {
    const queryParams = {
      // Read normalizes to uppercase for display; the API enums are lowercase.
      ...(params?.status && { status: params.status.toLowerCase() }),
      ...(params?.doctorId && { doctor_id: params.doctorId }),
      ...(params?.clinicId && { clinic_id: params.clinicId }),
      ...(params?.workDate && { work_date: params.workDate }),
      ...(params?.dateFrom && { date_from: params.dateFrom }),
      ...(params?.dateTo && { date_to: params.dateTo }),
      ...(params?.page !== undefined && { page: params.page + 1 }),
      ...(params?.size !== undefined && { limit: params.size }),
    };
    const res = await api.get(API_ENDPOINTS.SCHEDULE.LIST, { params: queryParams }).then((r) => r.data);
    return normalizePaginated(res, mapSchedule, params?.size ?? 20);
  },

  getDoctorScheduleById: async (id: string): Promise<DoctorSchedule> => {
    const res = await api.get(API_ENDPOINTS.SCHEDULE.DETAIL(id)).then((r) => r.data);
    return mapSchedule(res.data ?? res);
  },

  createDoctorSchedule: async (data: Record<string, unknown>): Promise<DoctorSchedule> => {
    const res = await api.post(API_ENDPOINTS.SCHEDULE.CREATE, data).then((r) => r.data);
    return mapSchedule(res.data ?? res);
  },

  updateDoctorSchedule: async (
    id: string,
    data: Record<string, unknown>,
  ): Promise<DoctorSchedule> => {
    const res = await api.patch(API_ENDPOINTS.SCHEDULE.UPDATE(id), data).then((r) => r.data);
    return mapSchedule(res.data ?? res);
  },

  cancelDoctorSchedule: async (id: string): Promise<DoctorSchedule> => {
    const res = await api.patch(API_ENDPOINTS.SCHEDULE.CANCEL(id), {}).then((r) => r.data);
    return mapSchedule(res.data ?? res);
  },

  completeDoctorSchedule: async (id: string): Promise<DoctorSchedule> => {
    const res = await api.patch(API_ENDPOINTS.SCHEDULE.COMPLETE(id), {}).then((r) => r.data);
    return mapSchedule(res.data ?? res);
  },

  transferShift: async (
    scheduleId: string,
    data: { to_doctor_id: string; transferred_by: string; reason: string; notes?: string },
  ): Promise<unknown> => {
    const res = await api
      .post(`${API_ENDPOINTS.SCHEDULE.DETAIL(scheduleId)}/transfer`, data)
      .then((r) => r.data);
    return res;
  },

  createLeave: async (data: {
    doctorId: string;
    leaveType?: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<DoctorLeave> => {
    const res = await api
      .post(API_ENDPOINTS.DOCTOR_LEAVE.CREATE, {
        doctor_id: data.doctorId,
        leave_type: data.leaveType,
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason,
      })
      .then((r) => r.data);
    return mapLeave(res.data ?? res);
  },

  getDoctorLeaves: async (
    params?: DoctorLeaveParams,
  ): Promise<PaginatedResponse<DoctorLeave>> => {
    const queryParams = {
      // Read normalizes to uppercase for display; the API enums are lowercase.
      ...(params?.status && { status: params.status.toLowerCase() }),
      ...(params?.doctorId && { doctor_id: params.doctorId }),
      ...(params?.page !== undefined && { page: params.page + 1 }),
      ...(params?.size !== undefined && { limit: params.size }),
    };
    const res = await api.get(API_ENDPOINTS.DOCTOR_LEAVE.LIST, { params: queryParams }).then((r) => r.data);
    return normalizePaginated(res, mapLeave, params?.size ?? 12);
  },

  approveLeave: async (leaveId: string, data: { approvedBy: string }): Promise<DoctorLeave> => {
    const res = await api
      .patch(API_ENDPOINTS.DOCTOR_LEAVE.DETAIL(leaveId), { status: 'approved', approved_by: data.approvedBy })
      .then((r) => r.data);
    return mapLeave(res.data ?? res);
  },

  rejectLeave: async (leaveId: string, data: { rejectionReason: string }): Promise<DoctorLeave> => {
    const res = await api
      .patch(API_ENDPOINTS.DOCTOR_LEAVE.DETAIL(leaveId), { status: 'rejected', reason: data.rejectionReason })
      .then((r) => r.data);
    return mapLeave(res.data ?? res);
  },
};
