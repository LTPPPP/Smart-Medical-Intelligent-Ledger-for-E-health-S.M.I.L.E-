'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../api/schedule.api';
import type { DoctorScheduleParams, DoctorLeaveParams } from '../types/schedule.type';

const SCHEDULE_KEY = 'doctor-schedules';
const LEAVE_KEY = 'doctor-leaves';

export function useSchedule() {
  const qc = useQueryClient();

  const invalidateSchedules = () => qc.invalidateQueries({ queryKey: [SCHEDULE_KEY] });
  const invalidateLeaves = () => qc.invalidateQueries({ queryKey: [LEAVE_KEY] });

  const useDoctorSchedules = (params?: DoctorScheduleParams) =>
    useQuery({
      queryKey: [SCHEDULE_KEY, 'list', params],
      queryFn: () => scheduleApi.getDoctorSchedules(params),
    });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.cancelDoctorSchedule(id),
    onSuccess: invalidateSchedules,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.completeDoctorSchedule(id),
    onSuccess: invalidateSchedules,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => scheduleApi.createDoctorSchedule(data),
    onSuccess: invalidateSchedules,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      scheduleApi.updateDoctorSchedule(id, data),
    onSuccess: invalidateSchedules,
  });

  const transferMutation = useMutation({
    mutationFn: ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: { to_doctor_id: string; transferred_by: string; reason: string; notes?: string };
    }) => scheduleApi.transferShift(scheduleId, data),
    onSuccess: invalidateSchedules,
  });

  const useDoctorLeaves = (params?: DoctorLeaveParams) =>
    useQuery({
      queryKey: [LEAVE_KEY, 'list', params],
      queryFn: () => scheduleApi.getDoctorLeaves(params),
    });

  const createLeaveMutation = useMutation({
    mutationFn: (data: {
      doctorId: string;
      leaveType?: string;
      startDate: string;
      endDate: string;
      reason?: string;
    }) => scheduleApi.createLeave(data),
    onSuccess: invalidateLeaves,
  });

  const approveMutation = useMutation({
    mutationFn: ({ leaveId, request }: { leaveId: string; request: { approvedBy: string } }) =>
      scheduleApi.approveLeave(leaveId, request),
    onSuccess: invalidateLeaves,
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      leaveId,
      request,
    }: {
      leaveId: string;
      request: { rejectionReason: string };
    }) => scheduleApi.rejectLeave(leaveId, request),
    onSuccess: invalidateLeaves,
  });

  return {
    useDoctorSchedules,
    cancelDoctorSchedule: cancelMutation.mutateAsync,
    completeDoctorSchedule: completeMutation.mutateAsync,
    createDoctorSchedule: createMutation.mutateAsync,
    updateDoctorSchedule: updateMutation.mutateAsync,
    transferShift: transferMutation.mutateAsync,
    isCancellingSchedule: cancelMutation.isPending,
    isCompletingSchedule: completeMutation.isPending,
    isCreatingSchedule: createMutation.isPending,
    isUpdatingSchedule: updateMutation.isPending,
    isTransferringShift: transferMutation.isPending,

    useDoctorLeaves,
    createLeave: createLeaveMutation.mutateAsync,
    approveLeave: approveMutation.mutateAsync,
    rejectLeave: rejectMutation.mutateAsync,
    isCreatingLeave: createLeaveMutation.isPending,
    isApprovingLeave: approveMutation.isPending,
    isRejectingLeave: rejectMutation.isPending,
  };
}
