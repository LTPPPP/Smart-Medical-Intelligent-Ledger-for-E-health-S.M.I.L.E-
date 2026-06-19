import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { api } from '@/shared/lib/api';
import type {
  DoctorSchedule,
  DoctorLeave,
  DoctorScheduleParams,
  DoctorLeaveParams,
  PaginatedResponse,
} from '../types/schedule.type';

function mapSchedule(raw: Record<string, any>): DoctorSchedule {
  return {
    doctorScheduleId: raw.schedule_id ?? raw.doctorScheduleId ?? '',
    doctorId: raw.doctor_id ?? raw.doctorId ?? '',
    clinicId: raw.clinic_id ?? raw.clinicId ?? '',
    shiftId: raw.shift_id ?? raw.shiftId ?? null,
    workDate: raw.work_date ?? raw.workDate ?? '',
    roomId: raw.room_id ?? raw.roomId ?? null,
    maxPatients: raw.max_patients ?? raw.maxPatients ?? 20,
    status: (raw.status ?? 'SCHEDULED').toUpperCase(),
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

function mapLeave(raw: Record<string, any>): DoctorLeave {
  return {
    doctorLeaveId: raw.leave_id ?? raw.doctorLeaveId ?? '',
    doctorId: raw.doctor_id ?? raw.doctorId ?? '',
    leaveType: raw.leave_type ?? raw.leaveType ?? null,
    startDate: raw.start_date ?? raw.startDate ?? '',
    endDate: raw.end_date ?? raw.endDate ?? '',
    reason: raw.reason ?? null,
    status: (raw.status ?? 'PENDING').toUpperCase(),
    approvedBy: raw.approved_by ?? raw.approvedBy ?? null,
    doctorName: raw.doctor?.full_name ?? raw.doctorName,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

function normalizePaginated<T>(
  res: Record<string, any>,
  mapper: (r: Record<string, any>) => T,
  pageSize: number,
): PaginatedResponse<T> {
  const rawItems: Record<string, any>[] = res.data ?? res.content ?? res.items ?? res ?? [];
  const total: number = res.total ?? res.totalElements ?? rawItems.length ?? 0;
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
      ...(params?.status && { status: params.status }),
      ...(params?.doctorId && { doctor_id: params.doctorId }),
      ...(params?.clinicId && { clinic_id: params.clinicId }),
      ...(params?.workDate && { work_date: params.workDate }),
      ...(params?.dateFrom && { date_from: params.dateFrom }),
      ...(params?.dateTo && { date_to: params.dateTo }),
      ...(params?.page !== undefined && { page: params.page }),
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

  getDoctorLeaves: async (
    params?: DoctorLeaveParams,
  ): Promise<PaginatedResponse<DoctorLeave>> => {
    const queryParams = {
      ...(params?.status && { status: params.status }),
      ...(params?.doctorId && { doctor_id: params.doctorId }),
      ...(params?.page !== undefined && { page: params.page }),
      ...(params?.size !== undefined && { limit: params.size }),
    };
    const res = await api.get(API_ENDPOINTS.DOCTOR_LEAVE.LIST, { params: queryParams }).then((r) => r.data);
    return normalizePaginated(res, mapLeave, params?.size ?? 12);
  },

  approveLeave: async (leaveId: string, data: { approvedBy: string }): Promise<DoctorLeave> => {
    const res = await api
      .patch(API_ENDPOINTS.DOCTOR_LEAVE.APPROVE(leaveId), { approved_by: data.approvedBy })
      .then((r) => r.data);
    return mapLeave(res.data ?? res);
  },

  rejectLeave: async (leaveId: string, data: { rejectionReason: string }): Promise<DoctorLeave> => {
    const res = await api
      .patch(API_ENDPOINTS.DOCTOR_LEAVE.REJECT(leaveId), { rejection_reason: data.rejectionReason })
      .then((r) => r.data);
    return mapLeave(res.data ?? res);
  },
};
