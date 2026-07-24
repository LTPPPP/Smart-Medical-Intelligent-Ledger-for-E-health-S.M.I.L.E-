'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { patientApi } from '../api/patient.api';

const PATIENT_KEY = 'patients';
const RECORD_KEY = 'medical-records';
const HISTORY_KEY = 'medical-history';
const TREATMENT_KEY = 'treatment-history';

export function usePatient() {
  const qc = useQueryClient();

  const invalidatePatients = () => qc.invalidateQueries({ queryKey: [PATIENT_KEY] });
  const invalidateRecords = (patientId?: string) =>
    qc.invalidateQueries({ queryKey: [RECORD_KEY, patientId].filter(Boolean) });

  const usePatients = (params?: Record<string, unknown>) =>
    useQuery({
      queryKey: [PATIENT_KEY, 'list', params],
      queryFn: () => patientApi.getPatients(params),
    });

  const usePatientById = (id: string) =>
    useQuery({
      queryKey: [PATIENT_KEY, id],
      queryFn: () => patientApi.getPatientById(id),
      enabled: !!id,
    });

  const useMedicalRecordsByPatient = (patientId: string) =>
    useQuery({
      queryKey: [RECORD_KEY, patientId, 'list'],
      queryFn: () => patientApi.getMedicalRecordsByPatient(patientId),
      enabled: !!patientId,
    });

  const useMedicalRecordById = (id: string) =>
    useQuery({
      queryKey: [RECORD_KEY, 'detail', id],
      queryFn: () => patientApi.getMedicalRecordById(id),
      enabled: !!id,
    });

  const useMedicalHistory = (patientId: string) =>
    useQuery({
      queryKey: [HISTORY_KEY, patientId],
      queryFn: () => patientApi.getMedicalHistoryByPatient(patientId),
      enabled: !!patientId,
    });

  const useTreatmentHistory = (patientId: string) =>
    useQuery({
      queryKey: [TREATMENT_KEY, patientId],
      queryFn: () => patientApi.getTreatmentHistoryByPatient(patientId),
      enabled: !!patientId,
    });

  const createPatientMutation = useMutation({
    mutationFn: (body: Partial<Record<string, unknown>>) => patientApi.createPatient(body),
    onSuccess: invalidatePatients,
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Record<string, unknown>> }) =>
      patientApi.updatePatient(id, body),
    onSuccess: invalidatePatients,
  });

  const createRecordMutation = useMutation({
    mutationFn: (body: Partial<Record<string, unknown>>) => patientApi.createMedicalRecord(body),
    onSuccess: (_, body) => invalidateRecords(body.patient_id as string | undefined),
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Record<string, unknown>> }) =>
      patientApi.updateMedicalRecord(id, body),
    onSuccess: () => invalidateRecords(),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => patientApi.finalizeMedicalRecord(id),
    onSuccess: () => invalidateRecords(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientApi.deleteMedicalRecord(id),
    onSuccess: () => invalidateRecords(),
  });

  return {
    usePatients,
    usePatientById,
    useMedicalRecordsByPatient,
    useMedicalRecordById,
    useMedicalHistory,
    useTreatmentHistory,

    createPatient: createPatientMutation.mutateAsync,
    updatePatient: updatePatientMutation.mutateAsync,
    isCreatingPatient: createPatientMutation.isPending,
    isUpdatingPatient: updatePatientMutation.isPending,

    createMedicalRecord: createRecordMutation.mutateAsync,
    updateMedicalRecord: updateRecordMutation.mutateAsync,
    finalizeMedicalRecord: finalizeMutation.mutateAsync,
    deleteMedicalRecord: deleteMutation.mutateAsync,
    isCreatingMedicalRecord: createRecordMutation.isPending,
    isUpdatingMedicalRecord: updateRecordMutation.isPending,
    isFinalizingMedicalRecord: finalizeMutation.isPending,
    isDeletingMedicalRecord: deleteMutation.isPending,
  };
}
