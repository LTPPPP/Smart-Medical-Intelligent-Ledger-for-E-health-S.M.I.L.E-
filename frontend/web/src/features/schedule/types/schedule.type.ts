// WORK SHIFT TYPES
export interface WorkShift {
  workShiftId: string;
  shiftName: string;
  startTime: string; // HH:mm format
  endTime: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkShiftRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface UpdateWorkShiftRequest {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isActive?: boolean;
}

// DOCTOR SCHEDULE TYPES
export type ScheduleStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface DoctorSchedule {
  doctorScheduleId: string;
  doctorId: string;
  clinicId: string;
  workShiftId: string;
  workDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  maxAppointments: number;
  bookedAppointments: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields (if included)
  doctorName?: string;
  clinicName?: string;
  shiftName?: string;
}

export interface CreateDoctorScheduleRequest {
  doctorId: string;
  clinicId: string;
  workShiftId: string;
  workDate: string;
  maxAppointments?: number;
  notes?: string;
}

export interface UpdateDoctorScheduleRequest {
  workShiftId?: string;
  workDate?: string;
  maxAppointments?: number;
  notes?: string;
  status?: ScheduleStatus;
}

export interface DoctorScheduleQueryParams {
  doctorId?: string;
  clinicId?: string;
  startDate?: string;
  endDate?: string;
  status?: ScheduleStatus;
  page?: number;
  size?: number;
}

// DOCTOR LEAVE TYPES
export type LeaveType = 'ANNUAL' | 'SICK' | 'EMERGENCY' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface DoctorLeave {
  doctorLeaveId: string;
  doctorId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  doctorName?: string;
  approverName?: string;
}

export interface CreateDoctorLeaveRequest {
  doctorId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ApproveLeaveRequest {
  approvedBy: string;
}

export interface RejectLeaveRequest {
  rejectionReason: string;
}

export interface DoctorLeaveQueryParams {
  doctorId?: string;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

// SCHEDULE CHANGE TYPES
export type ChangeType = 'RESCHEDULE' | 'SWAP' | 'CANCEL' | 'UPDATE';
export type ChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ScheduleChange {
  scheduleChangeId: string;
  originalScheduleId: string;
  changeType: ChangeType;
  requestedBy: string;
  targetDoctorId?: string; // For SWAP
  targetScheduleId?: string; // For SWAP
  newWorkDate?: string;
  newWorkShiftId?: string;
  reason: string;
  status: ChangeStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  requestedByName?: string;
  targetDoctorName?: string;
  approverName?: string;
}

export interface CreateScheduleChangeRequest {
  originalScheduleId: string;
  changeType: ChangeType;
  requestedBy: string;
  targetDoctorId?: string;
  targetScheduleId?: string;
  newWorkDate?: string;
  newWorkShiftId?: string;
  reason: string;
}

export interface ApproveChangeRequest {
  approvedBy: string;
}

export interface RejectChangeRequest {
  rejectionReason: string;
}

// SCHEDULE NOTIFICATION TYPES
export type NotificationType =
  | 'SCHEDULE_REMINDER'
  | 'SCHEDULE_CHANGE'
  | 'LEAVE_APPROVAL'
  | 'SHIFT_SWAP';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface ScheduleNotification {
  notificationId: string;
  recipientId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  status: NotificationStatus;
  sentAt?: string;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SendNotificationRequest {
  recipientId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
}

// CALENDAR VIEW TYPES
export interface ScheduleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  status: ScheduleStatus;
  color: string;
  appointments?: number;
  maxAppointments?: number;
}

export interface CalendarViewParams {
  doctorId?: string;
  clinicId?: string;
  startDate: string;
  endDate: string;
  view: 'day' | 'week' | 'month';
}

// STATISTICS TYPES
export interface ScheduleStatistics {
  totalSchedules: number;
  activeSchedules: number;
  completedSchedules: number;
  cancelledSchedules: number;
  utilizationRate: number; // %
  averageAppointmentsPerSchedule: number;
}

export interface LeaveStatistics {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  byType: Record<LeaveType, number>;
}
