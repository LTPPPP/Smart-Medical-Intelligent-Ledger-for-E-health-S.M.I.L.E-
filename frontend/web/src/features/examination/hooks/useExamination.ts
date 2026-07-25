"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/shared/lib/toast";

import { examinationApi } from "../api/examination";
import type {
	CreateExaminationSessionRequest,
	UpdateExaminationSessionRequest,
	CreateDiagnosisRequest,
	UpdateDiagnosisRequest,
	CreatePrescriptionRequest,
	UpdatePrescriptionRequest,
	CreateTreatmentPlanRequest,
	UpdateTreatmentPlanRequest,
	CreateImagingOrderRequest,
	CreateLabOrderRequest,
	ExaminationListParams,
	DiagnosisListParams,
	PrescriptionListParams,
	OrderListParams,
} from "../types/examination.type";

export const EXAMINATION_QUERY_KEY = "examination";

export function useExamination() {
	const queryClient = useQueryClient();

	// Examination Session Queries

	const useSessionByAppointment = (appointmentId: string | null) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "appointment", appointmentId],
			queryFn: () => examinationApi.getSessionsByAppointment(appointmentId!),
			enabled: !!appointmentId,
		});
	};

	const useSessionsByPatient = (
		patientId: string,
		params?: ExaminationListParams,
	) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "patient", patientId, params],
			queryFn: () => examinationApi.getSessionsByPatient(patientId, params),
			enabled: !!patientId,
		});
	};

	const useSessionById = (sessionId: string | null) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "session", sessionId],
			queryFn: () => examinationApi.getSessionById(sessionId!),
			enabled: !!sessionId,
		});
	};

	// Examination Session Mutations
	const createSessionMutation = useMutation({
		mutationFn: (request: CreateExaminationSessionRequest) =>
			examinationApi.createSession(request),
		onSuccess: (_, variables) => {
			if (variables.patientId) {
				queryClient.invalidateQueries({
					queryKey: [EXAMINATION_QUERY_KEY, "patient", variables.patientId],
				});
			}
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"appointment",
					variables.appointmentId,
				],
			});
			toast.success("Examination session created successfully!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to create examination session");
		},
	});

	const updateSessionMutation = useMutation({
		mutationFn: ({
			sessionId,
			request,
		}: {
			sessionId: string;
			request: UpdateExaminationSessionRequest;
		}) => examinationApi.updateSession(sessionId, request),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "session", data.data.id],
			});
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "patient", data.data.patientId],
			});
			toast.success("Examination session updated successfully!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to update examination session");
		},
	});

	const deleteSessionMutation = useMutation({
		mutationFn: (sessionId: string) => examinationApi.deleteSession(sessionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [EXAMINATION_QUERY_KEY] });
			toast.success("Examination session deleted successfully!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to delete examination session");
		},
	});

	const completeSessionMutation = useMutation({
		mutationFn: (sessionId: string) =>
			examinationApi.completeSession(sessionId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "session", data.data.id],
			});
			toast.success("Examination session completed successfully!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to complete examination session");
		},
	});

	const cancelSessionMutation = useMutation({
		mutationFn: (sessionId: string) => examinationApi.cancelSession(sessionId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "session", data.data.id],
			});
			toast.success("Examination session cancelled successfully!");
		},
		onError: (error) => {
			toast.apiError(error, "Failed to cancel examination session");
		},
	});

	// Diagnosis Queries

	const useDiagnosesBySession = (sessionId: string | null) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "diagnoses", "session", sessionId],
			queryFn: () => examinationApi.getDiagnosesBySession(sessionId!),
			enabled: !!sessionId,
		});
	};

	const useDiagnosesByPatient = (
		patientId: string,
		params?: DiagnosisListParams,
	) => {
		return useQuery({
			queryKey: [
				EXAMINATION_QUERY_KEY,
				"diagnoses",
				"patient",
				patientId,
				params,
			],
			queryFn: () => examinationApi.getDiagnosesByPatient(patientId, params),
			enabled: !!patientId,
		});
	};

	// Diagnosis Mutations
	const createDiagnosisMutation = useMutation({
		mutationFn: (request: CreateDiagnosisRequest) =>
			examinationApi.createDiagnosis(request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"diagnoses",
					"session",
					variables.sessionId,
				],
			});
		},
	});

	const updateDiagnosisMutation = useMutation({
		mutationFn: ({
			diagnosisId,
			request,
		}: {
			diagnosisId: string;
			request: UpdateDiagnosisRequest;
		}) => examinationApi.updateDiagnosis(diagnosisId, request),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"diagnoses",
					"session",
					data.data.sessionId,
				],
			});
		},
	});

	const deleteDiagnosisMutation = useMutation({
		mutationFn: (diagnosisId: string) =>
			examinationApi.deleteDiagnosis(diagnosisId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "diagnoses"],
			});
		},
	});

	// Prescription Queries

	const usePrescriptionBySession = (sessionId: string | null) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "prescription", "session", sessionId],
			queryFn: () => examinationApi.getPrescriptionsBySession(sessionId!),
			enabled: !!sessionId,
		});
	};

	const usePrescriptionsByPatient = (
		patientId: string,
		params?: PrescriptionListParams,
	) => {
		return useQuery({
			queryKey: [
				EXAMINATION_QUERY_KEY,
				"prescriptions",
				"patient",
				patientId,
				params,
			],
			queryFn: () =>
				examinationApi.getPrescriptionsByPatient(patientId, params),
			enabled: !!patientId,
		});
	};

	// Prescription Mutations
	const createPrescriptionMutation = useMutation({
		mutationFn: (request: CreatePrescriptionRequest) =>
			examinationApi.createPrescription(request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"prescription",
					"session",
					variables.sessionId,
				],
			});
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"prescriptions",
					"patient",
					variables.patientId,
				],
			});
		},
	});

	const updatePrescriptionMutation = useMutation({
		mutationFn: ({
			prescriptionId,
			request,
		}: {
			prescriptionId: string;
			request: UpdatePrescriptionRequest;
		}) => examinationApi.updatePrescription(prescriptionId, request),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"prescription",
					"session",
					data.data.sessionId,
				],
			});
		},
	});

	const dispensePrescriptionMutation = useMutation({
		mutationFn: (prescriptionId: string) =>
			examinationApi.dispensePrescription(prescriptionId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"prescriptions",
					"patient",
					data.data.patientId,
				],
			});
		},
	});

	const cancelPrescriptionMutation = useMutation({
		mutationFn: (prescriptionId: string) =>
			examinationApi.cancelPrescription(prescriptionId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"prescriptions",
					"patient",
					data.data.patientId,
				],
			});
		},
	});

	// Treatment Plan Queries

	const useTreatmentPlansByPatient = (patientId: string) => {
		return useQuery({
			queryKey: [
				EXAMINATION_QUERY_KEY,
				"treatment-plans",
				"patient",
				patientId,
			],
			queryFn: () => examinationApi.getTreatmentPlansByPatient(patientId),
			enabled: !!patientId,
		});
	};

	const useTreatmentPlanById = (planId: string | null) => {
		return useQuery({
			queryKey: [EXAMINATION_QUERY_KEY, "treatment-plan", planId],
			queryFn: () => examinationApi.getTreatmentPlanById(planId!),
			enabled: !!planId,
		});
	};

	// Treatment Plan Mutations
	const createTreatmentPlanMutation = useMutation({
		mutationFn: (request: CreateTreatmentPlanRequest) =>
			examinationApi.createTreatmentPlan(request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"treatment-plans",
					"patient",
					variables.patientId,
				],
			});
		},
	});

	const updateTreatmentPlanMutation = useMutation({
		mutationFn: ({
			planId,
			request,
		}: {
			planId: string;
			request: UpdateTreatmentPlanRequest;
		}) => examinationApi.updateTreatmentPlan(planId, request),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "treatment-plan", data.data.id],
			});
		},
	});

	const completeTreatmentPlanMutation = useMutation({
		mutationFn: (planId: string) =>
			examinationApi.completeTreatmentPlan(planId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [EXAMINATION_QUERY_KEY, "treatment-plan", data.data.id],
			});
		},
	});

	// Imaging Order Mutations

	const useImagingOrdersByPatient = (
		patientId: string,
		params?: OrderListParams,
	) => {
		return useQuery({
			queryKey: [
				EXAMINATION_QUERY_KEY,
				"imaging-orders",
				"patient",
				patientId,
				params,
			],
			queryFn: () =>
				examinationApi.getImagingOrdersByPatient(patientId, params),
			enabled: !!patientId,
		});
	};

	const createImagingOrderMutation = useMutation({
		mutationFn: (request: CreateImagingOrderRequest) =>
			examinationApi.createImagingOrder(request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"imaging-orders",
					"patient",
					variables.patientId,
				],
			});
		},
	});

	// Lab Order Mutations

	const useLabOrdersByPatient = (
		patientId: string,
		params?: OrderListParams,
	) => {
		return useQuery({
			queryKey: [
				EXAMINATION_QUERY_KEY,
				"lab-orders",
				"patient",
				patientId,
				params,
			],
			queryFn: () => examinationApi.getLabOrdersByPatient(patientId, params),
			enabled: !!patientId,
		});
	};

	const createLabOrderMutation = useMutation({
		mutationFn: (request: CreateLabOrderRequest) =>
			examinationApi.createLabOrder(request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					EXAMINATION_QUERY_KEY,
					"lab-orders",
					"patient",
					variables.patientId,
				],
			});
		},
	});

	return {
		// Session Queries
		useSessionByAppointment,
		useSessionsByPatient,
		useSessionById,

		// Session Mutations
		createSession: createSessionMutation.mutateAsync,
		updateSession: updateSessionMutation.mutateAsync,
		deleteSession: deleteSessionMutation.mutateAsync,
		completeSession: completeSessionMutation.mutateAsync,
		cancelSession: cancelSessionMutation.mutateAsync,

		// Diagnosis Queries
		useDiagnosesBySession,
		useDiagnosesByPatient,

		// Diagnosis Mutations
		createDiagnosis: createDiagnosisMutation.mutateAsync,
		updateDiagnosis: updateDiagnosisMutation.mutateAsync,
		deleteDiagnosis: deleteDiagnosisMutation.mutateAsync,

		// Prescription Queries
		usePrescriptionBySession,
		usePrescriptionsByPatient,

		// Prescription Mutations
		createPrescription: createPrescriptionMutation.mutateAsync,
		updatePrescription: updatePrescriptionMutation.mutateAsync,
		dispensePrescription: dispensePrescriptionMutation.mutateAsync,
		cancelPrescription: cancelPrescriptionMutation.mutateAsync,

		// Treatment Plan Queries
		useTreatmentPlansByPatient,
		useTreatmentPlanById,

		// Treatment Plan Mutations
		createTreatmentPlan: createTreatmentPlanMutation.mutateAsync,
		updateTreatmentPlan: updateTreatmentPlanMutation.mutateAsync,
		completeTreatmentPlan: completeTreatmentPlanMutation.mutateAsync,

		// Imaging Order Queries & Mutations
		useImagingOrdersByPatient,
		createImagingOrder: createImagingOrderMutation.mutateAsync,

		// Lab Order Queries & Mutations
		useLabOrdersByPatient,
		createLabOrder: createLabOrderMutation.mutateAsync,

		// Loading States
		isCreatingSession: createSessionMutation.isPending,
		isUpdatingSession: updateSessionMutation.isPending,
		isCreatingDiagnosis: createDiagnosisMutation.isPending,
		isCreatingPrescription: createPrescriptionMutation.isPending,
		isCreatingTreatmentPlan: createTreatmentPlanMutation.isPending,
		isCreatingImagingOrder: createImagingOrderMutation.isPending,
		isCreatingLabOrder: createLabOrderMutation.isPending,
	};
}
