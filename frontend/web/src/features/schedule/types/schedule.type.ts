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
