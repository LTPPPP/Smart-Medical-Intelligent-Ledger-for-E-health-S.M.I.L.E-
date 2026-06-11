'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patient';
import { toast } from '@/shared/lib/toast';

import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchParams,
  CreateMedicalHistoryRequest,
  UpdateMedicalHistoryRequest,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchParams,
  CreateTreatmentHistoryRequest,
  UpdateTreatmentHistoryRequest,
  TreatmentHistorySearchParams,
  ExportRecordRequest,
} from '../types/patient.type';

export const PATIENT_QUERY_KEY = 'patient';

export function usePatient() {
  const queryClient = useQueryClient();

  // PATIENT QUERIES

  const usePatients = (params?: PatientSearchParams) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'list', params],
      queryFn: () => patientApi.getPatients(params),
    });
  };

  const usePatientById = (patientId: string | null) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'detail', patientId],
      queryFn: () => patientApi.getPatientById(patientId!),
      enabled: !!patientId,
    });
  };

  // PATIENT MUTATIONS

  const createPatientMutation = useMutation({
    mutationFn: (request: CreatePatientRequest) =>
      patientApi.createPatient(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENT_QUERY_KEY, 'list'] });
      toast.success('Thêm bệnh nhân thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Thêm bệnh nhân thất bại');
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({
      patientId,
      request,
    }: {
      patientId: string;
      request: UpdatePatientRequest;
    }) => patientApi.updatePatient(patientId, request),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'detail', patientId],
      });
      queryClient.invalidateQueries({ queryKey: [PATIENT_QUERY_KEY, 'list'] });
      toast.success('Cập nhật bệnh nhân thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật bệnh nhân thất bại');
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: (patientId: string) => patientApi.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENT_QUERY_KEY] });
      toast.success('Xóa bệnh nhân thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa bệnh nhân thất bại');
    },
  });

  // MEDICAL HISTORY QUERIES

  const useMedicalHistory = (patientId: string | null) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'medical-history', patientId],
      queryFn: () => patientApi.getMedicalHistoryByPatient(patientId!),
      enabled: !!patientId,
    });
  };

  // MEDICAL HISTORY MUTATIONS

  const createMedicalHistoryMutation = useMutation({
    mutationFn: (request: CreateMedicalHistoryRequest) =>
      patientApi.createMedicalHistory(request),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-history', patientId],
      });
      toast.success('Thêm tiền sử bệnh thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Thêm tiền sử bệnh thất bại');
    },
  });

  const updateMedicalHistoryMutation = useMutation({
    mutationFn: ({
      historyId,
      request,
    }: {
      historyId: string;
      request: UpdateMedicalHistoryRequest;
    }) => patientApi.updateMedicalHistory(historyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-history'],
      });
      toast.success('Cập nhật tiền sử bệnh thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật tiền sử bệnh thất bại');
    },
  });

  const deleteMedicalHistoryMutation = useMutation({
    mutationFn: (historyId: string) =>
      patientApi.deleteMedicalHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-history'],
      });
      toast.success('Xóa tiền sử bệnh thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa tiền sử bệnh thất bại');
    },
  });

  // MEDICAL RECORD QUERIES

  const useMedicalRecords = (
    patientId: string | null,
    params?: MedicalRecordSearchParams,
  ) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'medical-records', patientId, params],
      queryFn: () =>
        patientApi.getMedicalRecordsListByPatient(patientId!, params),
      enabled: !!patientId,
    });
  };

  const useMedicalRecordById = (recordId: string | null) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'medical-record', recordId],
      queryFn: () => patientApi.getMedicalRecordById(recordId!),
      enabled: !!recordId,
    });
  };

  // MEDICAL RECORD MUTATIONS

  const createMedicalRecordMutation = useMutation({
    mutationFn: (request: CreateMedicalRecordRequest) =>
      patientApi.createMedicalRecord(request),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-records', patientId],
      });
      toast.success('Tạo hồ sơ bệnh án thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Tạo hồ sơ bệnh án thất bại');
    },
  });

  const updateMedicalRecordMutation = useMutation({
    mutationFn: ({
      recordId,
      request,
    }: {
      recordId: string;
      request: UpdateMedicalRecordRequest;
    }) => patientApi.updateMedicalRecord(recordId, request),
    onSuccess: (_, { recordId }) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-record', recordId],
      });
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-records'],
      });
      toast.success('Cập nhật hồ sơ bệnh án thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật hồ sơ bệnh án thất bại');
    },
  });

  const finalizeMedicalRecordMutation = useMutation({
    mutationFn: (recordId: string) =>
      patientApi.finalizeMedicalRecord(recordId),
    onSuccess: (_, recordId) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-record', recordId],
      });
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-records'],
      });
      toast.success('Hoàn tất hồ sơ bệnh án thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Hoàn tất hồ sơ bệnh án thất bại');
    },
  });

  const deleteMedicalRecordMutation = useMutation({
    mutationFn: (recordId: string) => patientApi.deleteMedicalRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'medical-records'],
      });
      toast.success('Xóa hồ sơ bệnh án thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa hồ sơ bệnh án thất bại');
    },
  });

  // TREATMENT HISTORY QUERIES

  const useTreatmentHistory = (
    patientId: string | null,
    params?: TreatmentHistorySearchParams,
  ) => {
    return useQuery({
      queryKey: [PATIENT_QUERY_KEY, 'treatment-history', patientId, params],
      queryFn: () =>
        patientApi.getTreatmentHistoryByPatient(patientId!, params),
      enabled: !!patientId,
    });
  };

  // TREATMENT HISTORY MUTATIONS

  const createTreatmentHistoryMutation = useMutation({
    mutationFn: (request: CreateTreatmentHistoryRequest) =>
      patientApi.createTreatmentHistory(request),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'treatment-history', patientId],
      });
      toast.success('Thêm lịch sử điều trị thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Thêm lịch sử điều trị thất bại');
    },
  });

  const updateTreatmentHistoryMutation = useMutation({
    mutationFn: ({
      treatmentId,
      request,
    }: {
      treatmentId: string;
      request: UpdateTreatmentHistoryRequest;
    }) => patientApi.updateTreatmentHistory(treatmentId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'treatment-history'],
      });
      toast.success('Cập nhật lịch sử điều trị thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Cập nhật lịch sử điều trị thất bại');
    },
  });

  const deleteTreatmentHistoryMutation = useMutation({
    mutationFn: (treatmentId: string) =>
      patientApi.deleteTreatmentHistory(treatmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PATIENT_QUERY_KEY, 'treatment-history'],
      });
      toast.success('Xóa lịch sử điều trị thành công!');
    },
    onError: (error) => {
      toast.apiError(error, 'Xóa lịch sử điều trị thất bại');
    },
  });

  // EXPORT MUTATIONS

  const exportRecordsMutation = useMutation({
    mutationFn: (request: ExportRecordRequest) =>
      patientApi.exportRecordsToPdf(request),
  });

  const downloadPdfMutation = useMutation({
    mutationFn: (fileName: string) => patientApi.downloadPdf(fileName),
  });

  return {
    // Queries
    usePatients,
    usePatientById,
    useMedicalHistory,
    useMedicalRecords,
    useMedicalRecordById,
    useTreatmentHistory,

    // Patient Mutations
    createPatient: createPatientMutation.mutateAsync,
    updatePatient: updatePatientMutation.mutateAsync,
    deletePatient: deletePatientMutation.mutateAsync,

    // Medical History Mutations
    createMedicalHistory: createMedicalHistoryMutation.mutateAsync,
    updateMedicalHistory: updateMedicalHistoryMutation.mutateAsync,
    deleteMedicalHistory: deleteMedicalHistoryMutation.mutateAsync,

    // Medical Record Mutations
    createMedicalRecord: createMedicalRecordMutation.mutateAsync,
    updateMedicalRecord: updateMedicalRecordMutation.mutateAsync,
    finalizeMedicalRecord: finalizeMedicalRecordMutation.mutateAsync,
    deleteMedicalRecord: deleteMedicalRecordMutation.mutateAsync,

    // Treatment History Mutations
    createTreatmentHistory: createTreatmentHistoryMutation.mutateAsync,
    updateTreatmentHistory: updateTreatmentHistoryMutation.mutateAsync,
    deleteTreatmentHistory: deleteTreatmentHistoryMutation.mutateAsync,

    // Export Mutations
    exportRecords: exportRecordsMutation.mutateAsync,
    downloadPdf: downloadPdfMutation.mutateAsync,

    // Loading States
    isCreatingPatient: createPatientMutation.isPending,
    isUpdatingPatient: updatePatientMutation.isPending,
    isDeletingPatient: deletePatientMutation.isPending,

    isCreatingMedicalHistory: createMedicalHistoryMutation.isPending,
    isUpdatingMedicalHistory: updateMedicalHistoryMutation.isPending,
    isDeletingMedicalHistory: deleteMedicalHistoryMutation.isPending,

    isCreatingMedicalRecord: createMedicalRecordMutation.isPending,
    isUpdatingMedicalRecord: updateMedicalRecordMutation.isPending,
    isFinalizingMedicalRecord: finalizeMedicalRecordMutation.isPending,
    isDeletingMedicalRecord: deleteMedicalRecordMutation.isPending,

    isCreatingTreatmentHistory: createTreatmentHistoryMutation.isPending,
    isUpdatingTreatmentHistory: updateTreatmentHistoryMutation.isPending,
    isDeletingTreatmentHistory: deleteTreatmentHistoryMutation.isPending,

    isExportingRecords: exportRecordsMutation.isPending,
    isDownloadingPdf: downloadPdfMutation.isPending,
  };
}
