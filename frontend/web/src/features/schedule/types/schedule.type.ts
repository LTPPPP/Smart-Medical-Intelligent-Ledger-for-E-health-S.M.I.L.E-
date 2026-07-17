export type ScheduleStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface DoctorSchedule {
  doctorScheduleId: string;
  doctorId: string;
  clinicId: string;
  shiftId: string | null;
  workDate: string;
  roomId: string | null;
  maxPatients: number;
  status: ScheduleStatus;
  notes: string | null;
  doctorName?: string;
  clinicName?: string;
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorLeave {
  doctorLeaveId: string;
  doctorId: string;
  leaveType: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  approvedBy: string | null;
  doctorName?: string;
  createdAt?: string;
}

export interface WorkShift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface ScheduleChange {
  changeId: string;
  scheduleId: string;
  changedBy: string;
  changeType: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  reason: string | null;
  approvalStatus: string;
  createdAt: string;
}

export interface DoctorScheduleParams {
  status?: ScheduleStatus;
  doctorId?: string;
  clinicId?: string;
  workDate?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface DoctorLeaveParams {
  status?: LeaveStatus;
  doctorId?: string;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  data: {
    content: T[];
    totalPages: number;
    total: number;
  };
}

export interface ScheduleRaw {
  schedule_id?: string;
  doctorScheduleId?: string;
  doctor_id?: string;
  doctorId?: string;
  clinic_id?: string;
  clinicId?: string;
  shift_id?: string | null;
  shiftId?: string | null;
  work_date?: string;
  workDate?: string;
  room_id?: string | null;
  roomId?: string | null;
  max_patients?: number;
  maxPatients?: number;
  status?: string;
  notes?: string | null;
  doctor?: { full_name?: string };
  doctorName?: string;
  clinic?: { clinic_name?: string };
  clinicName?: string;
  shift?: { shift_name?: string; start_time?: string; end_time?: string };
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface LeaveRaw {
  leave_id?: string;
  doctorLeaveId?: string;
  doctor_id?: string;
  doctorId?: string;
  leave_type?: string | null;
  leaveType?: string | null;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  reason?: string | null;
  status?: string;
  approved_by?: string | null;
  approvedBy?: string | null;
  doctor?: { full_name?: string };
  doctorName?: string;
  created_at?: string;
  createdAt?: string;
}

export interface PaginatedRaw<T> {
  data?: T[] | { content?: T[]; total?: number };
  content?: T[];
  items?: T[];
  total?: number;
  totalElements?: number;
}
