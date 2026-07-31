"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { examinationApi } from "@/features/examination/api/examination";
import type { ClinicalOrderFormValues } from "@/features/examination/components/ClinicalOrderModal";
import type { DiagnosticOrderFormValues } from "@/features/examination/components/DiagnosticOrderModal";
import { EncounterLegalReminderPanel } from "@/features/examination/components/EncounterLegalReminderPanel";
import type {
	PrescriptionFormValues,
	PrescriptionItemFormValues,
} from "@/features/examination/components/PrescriptionModal";
import type { SymptomFormValues } from "@/features/examination/components/SymptomModal";
import type { TreatmentPlanFormValues } from "@/features/examination/components/TreatmentPlanModal";
import { COMMON_ICD_CODES } from "@/features/examination/constants/icd";
import type { Prescription } from "@/features/examination/types/examination.type";
import { getAmendmentFormBlocker } from "@/features/examination/utils/amendmentFlow";
import {
	buildClinicalAlerts,
	type ClinicalAlert,
} from "@/features/examination/utils/clinicalAlerts";
import {
	getDentalChartFormBlocker,
	normalizeDentalChartToothNumber,
} from "@/features/examination/utils/dentalChartFlow";
import { getFinalizeEncounterBlocker } from "@/features/examination/utils/encounterFinalize";
import {
	filterByAppointmentScope,
	filterByEncounterScope,
} from "@/features/examination/utils/encounterScope";
import { getFollowUpFormBlocker } from "@/features/examination/utils/followUpFlow";
import {
	type BackendPrescription,
	canCreatePrescription,
	canIssuePrescription,
	canModifyPrescriptionItems,
	formatPediatricPrescriptionSnapshot,
	normalizePrescriptionStatus,
	validatePrescriptionItemForm,
} from "@/features/examination/utils/prescriptionFlow";
import {
	getTreatmentPlanAcceptanceBlocker,
	getTreatmentPlanProposalBlocker,
	validateTreatmentPlanForm,
} from "@/features/examination/utils/treatmentPlanFlow";
import { useTranslation } from "@/features/i18n";
import { unwrapArr, unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { AppShell } from "@/shared/components/layout/AppShell";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { ENV } from "@/shared/constants/env";
import { toast } from "@/shared/lib/toast";

const TEAL = "#38BDF8";
const BLUE = "#92CDFD";
const cardBase =
	"rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-md";
const panelBase =
	"border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]";
const ghostButton =
	"border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] text-smile-title transition hover:[border-color:var(--surface-card-border)]";
const modalInputCls =
	"rounded-lg border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-3 py-2 text-sm text-smile-title outline-none transition focus:border-smile-primary/50";
const GW = ENV.SERVICES.GATEWAY;

// ── types ────────────────────────────────────────────────────────────────
interface Session {
	session_id: string;
	patient_id?: string | null;
	record_id?: string | null;
	appointment_id?: string | null;
	doctor_id?: string | null;
	clinic_id?: string | null;
	status?: string;
	chief_complaint?: string | null;
	present_illness?: string | null;
	physical_examination?: string | null;
	completed_at?: string | null;
	signed_at?: string | null;
	signed_by?: string | null;
	created_at?: string;
	session_date?: string;
}
interface Patient {
	patient_id: string;
	full_name?: string;
	patient_code?: string;
}
interface Symptom {
	symptom_id: string;
	symptom_name: string;
	body_location?: string | null;
	severity?: string | null;
	onset_date?: string | null;
	duration?: string | null;
	description?: string | null;
}
interface Diagnosis {
	diagnosis_id: string;
	icd_code?: string | null;
	diagnosis_name: string;
	diagnosis_type?: string | null;
	severity?: string | null;
	notes?: string | null;
}
interface TreatmentPlan {
	plan_id: string;
	plan_name?: string | null;
	objectives?: string | null;
	duration_weeks?: number | null;
	status?: string | null;
	sent_at?: string | null;
	session_id?: string | null;
	record_id?: string | null;
	estimated_cost?: string | number | null;
	quote_currency?: string | null;
	quote_version?: string | null;
	risk_disclosure?: string | null;
	alternative_options?: string | null;
	proposed_at?: string | null;
	accepted_at?: string | null;
	accepted_by?: string | null;
	declined_at?: string | null;
	declined_by?: string | null;
	decline_reason?: string | null;
	acceptance_scope?: string | null;
	accepted_scope_note?: string | null;
}
interface PrescriptionItem {
	item_id: string;
	medication_name: string;
	dosage?: string;
	frequency?: string;
	duration_days?: number | null;
	quantity?: number | null;
	instructions?: string | null;
	route?: string | null;
}
interface DiagnosticOrder {
	order_id: string;
	appointment_id?: string | null;
	order_code?: string;
	order_type?: string;
	description?: string | null;
	priority?: string | null;
	tooth_number?: string | null;
	area?: string | null;
	status?: string | null;
}
interface ClinicalOrder {
	order_id: string;
	session_id?: string | null;
	order_type?: string;
	test_type?: string;
	clinical_indication?: string | null;
	teeth_numbers?: number[] | null;
	urgency?: string | null;
	status?: string | null;
}
interface DentalChartEntry {
	chart_id: string;
	patient_id: string;
	record_id: string;
	tooth_number: number;
	tooth_status?: string | null;
	surfaces?: Record<string, unknown> | null;
	notes?: string | null;
}
interface FollowUpAppointment {
	appointment_id: string;
	appointment_date?: string | null;
	appointment_time?: string | null;
	duration_minutes?: number | null;
	appointment_type?: string | null;
	status?: string | null;
	notes?: string | null;
	treatment_plan_id?: string | null;
}
interface ExaminationAmendment {
	amendment_id: string;
	amendment_reason: string;
	amendment_text: string;
	amended_by?: string | null;
	created_at?: string | null;
}

const fmtDate = (d?: string | null) =>
	d ? new Date(d).toLocaleDateString() : "—";

export default function ExaminationWorkspacePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const qc = useQueryClient();
	const currentUser = useAuthStore((s) => s.user);
	const { t } = useTranslation();

	// ── session + patient ──
	const {
		data: sessRes,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["examination", id],
		queryFn: () => apiClient.get(`${GW}/examination-sessions/${id}`),
		enabled: !!id,
	});
	const session = useMemo(() => unwrapOne<Session>(sessRes), [sessRes]);
	const patientId = session?.patient_id ?? "";
	const actorId = currentUser?.userId ?? session?.doctor_id ?? "";
	const sessionDoctorLabel =
		session?.doctor_id && session.doctor_id === currentUser?.userId
			? (currentUser?.fullName ??
				currentUser?.email ??
				t("examination.detail.me", "Me"))
			: session?.doctor_id
				? `${t("examination.detail.doctorPrefix", "Doctor")} ${session.doctor_id.slice(0, 8)}`
				: "—";
	const isFinalized = ["completed", "signed"].includes(
		(session?.status ?? "").toLowerCase(),
	);

	const [notesForm, setNotesForm] = useState({
		chief_complaint: "",
		present_illness: "",
		physical_examination: "",
	});
	const [notesLoadedFor, setNotesLoadedFor] = useState<string | null>(null);
	// Seed the editable notes form from the session once, on first load — don't
	// clobber in-progress typing on background refetches.
	useEffect(() => {
		if (!session || notesLoadedFor === session.session_id) return;
		setNotesForm({
			chief_complaint: session.chief_complaint ?? "",
			present_illness: session.present_illness ?? "",
			physical_examination: session.physical_examination ?? "",
		});
		setNotesLoadedFor(session.session_id);
	}, [session, notesLoadedFor]);

	const { data: patRes } = useQuery({
		queryKey: ["patients", "list"],
		queryFn: () => apiClient.get(`${GW}/patients`),
	});
	const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
	const patient = patients.find((p) => p.patient_id === patientId);
	const patientLabel =
		patient?.full_name ??
		(patientId
			? `${t("examination.detail.patientPrefix", "Patient")} ${patientId.slice(0, 8)}`
			: "—");
	const { data: clinicalContext } = useQuery({
		queryKey: ["examination", id, "patient-clinical-context", patientId],
		queryFn: () => examinationApi.getPatientClinicalContext(patientId),
		enabled: !!id && !!patientId,
	});
	const clinicalAlerts = useMemo(
		() =>
			buildClinicalAlerts({
				patient: clinicalContext?.patient,
				medicalHistory: clinicalContext?.medicalHistory,
			}),
		[clinicalContext],
	);
	const blockTreatmentPlanAcceptanceIfNeeded = () => {
		const blocker = getTreatmentPlanAcceptanceBlocker({
			patient: clinicalContext?.patient,
		});
		if (blocker) {
			toast.warning(blocker);
			return true;
		}
		return false;
	};

	// ── symptoms (by session) ──
	const { data: sympRes } = useQuery({
		queryKey: ["examination", id, "symptoms"],
		queryFn: () => apiClient.get(`${GW}/symptoms/session/${id}`),
		enabled: !!id,
	});
	const symptoms = useMemo(() => unwrapArr<Symptom>(sympRes), [sympRes]);

	// ── diagnoses (by session) ──
	const { data: diagRes } = useQuery({
		queryKey: ["examination", id, "diagnoses"],
		queryFn: () => apiClient.get(`${GW}/diagnoses/session/${id}`),
		enabled: !!id,
	});
	const diagnoses = useMemo(() => unwrapArr<Diagnosis>(diagRes), [diagRes]);
	const finalizeBlocker = session
		? getFinalizeEncounterBlocker({
				status: session.status,
				clinicalNotes: [
					session.chief_complaint,
					session.present_illness,
					session.physical_examination,
				],
				diagnosisCount: diagnoses.length,
			})
		: t("examination.detail.sessionNotLoaded", "Session is not loaded.");

	// ── treatment plans (by session) ──
	const { data: planRes } = useQuery({
		queryKey: ["examination", id, "plans"],
		queryFn: () => examinationApi.getTreatmentPlansBySession(id),
		enabled: !!id && !!session,
	});
	const plans = useMemo(
		() =>
			filterByEncounterScope(unwrapArr<TreatmentPlan>(planRes), {
				sessionId: id,
				recordId: session?.record_id,
			}),
		[id, planRes, session?.record_id],
	);

	const { data: followUpRes } = useQuery({
		queryKey: ["examination", id, "follow-ups"],
		queryFn: () => examinationApi.getFollowUpsBySession(id),
		enabled: !!id && !!session,
	});
	const followUps = useMemo(
		() => unwrapArr<FollowUpAppointment>(followUpRes),
		[followUpRes],
	);

	const { data: amendmentRes } = useQuery({
		queryKey: ["examination", id, "amendments"],
		queryFn: () => examinationApi.getAmendmentsBySession(id),
		enabled: !!id && !!session,
	});
	const amendments = useMemo(
		() => unwrapArr<ExaminationAmendment>(amendmentRes),
		[amendmentRes],
	);

	// ── prescriptions (by session) + items of selected prescription ──
	const { data: prescRes } = useQuery({
		queryKey: ["examination", id, "prescriptions"],
		queryFn: () => examinationApi.getPrescriptionsBySession(id),
		enabled: !!id && !!session,
	});
	const prescriptions = useMemo(() => {
		// Not run through filterByEncounterScope: GET /prescriptions/session/:id already
		// scopes to this exact session server-side, and mapBackendPrescription's output uses
		// camelCase (sessionId, no record_id) — filterByEncounterScope checks snake_case
		// session_id/record_id, so it would always (wrongly) filter this out as unscoped.
		const prescription = unwrapOne<Prescription>(prescRes);
		return prescription ? [prescription] : [];
	}, [prescRes]);
	const [activePrescriptionId, setActivePrescriptionId] = useState<
		string | null
	>(null);
	const selectedPrescriptionId =
		activePrescriptionId ?? prescriptions[0]?.id ?? null;
	const selectedPrescription =
		prescriptions.find((pr) => pr.id === selectedPrescriptionId) ?? null;
	const selectedPrescriptionStatus = normalizePrescriptionStatus(
		selectedPrescription?.status,
	);
	const pediatricPrescriptionSnapshot = formatPediatricPrescriptionSnapshot(
		selectedPrescription
			? {
					minorPatientAtIssue: selectedPrescription.minorPatientAtIssue,
					patientAgeYearsAtIssue: selectedPrescription.patientAgeYearsAtIssue,
					patientAgeMonthsAtIssue: selectedPrescription.patientAgeMonthsAtIssue,
					representativeNameSnapshot:
						selectedPrescription.representativeNameSnapshot,
					representativePhoneSnapshot:
						selectedPrescription.representativePhoneSnapshot,
				}
			: null,
	);
	const canCreatePrescriptionNow = canCreatePrescription({
		isFinalized,
		patientId,
	});
	const canModifySelectedPrescriptionItems = canModifyPrescriptionItems({
		isFinalized,
		prescriptionId: selectedPrescriptionId,
		status: selectedPrescriptionStatus,
	});

	const { data: itemsRes } = useQuery({
		queryKey: ["examination", id, "prescription-items", selectedPrescriptionId],
		queryFn: () =>
			apiClient.get(
				`${GW}/prescription-items/prescription/${selectedPrescriptionId}`,
			),
		enabled: !!selectedPrescriptionId,
	});
	const items = useMemo(
		() => unwrapArr<PrescriptionItem>(itemsRes),
		[itemsRes],
	);
	const canIssueSelectedPrescription = canIssuePrescription({
		isFinalized,
		prescriptionId: selectedPrescriptionId,
		status: selectedPrescriptionStatus,
		itemCount: items.length,
	});

	const sessionAppointmentId = session?.appointment_id ?? "";

	// ── diagnostic orders (by appointment) ──
	const { data: dxRes } = useQuery({
		queryKey: ["examination", id, "diagnostic-orders"],
		queryFn: () =>
			apiClient.get(
				`${GW}/diagnostic-orders/appointment/${sessionAppointmentId}`,
			),
		enabled: !!sessionAppointmentId,
	});
	const diagnosticOrders = useMemo(
		() =>
			filterByAppointmentScope(
				unwrapArr<DiagnosticOrder>(dxRes),
				session?.appointment_id,
			),
		[dxRes, session?.appointment_id],
	);

	// ── clinical orders (by session) ──
	const { data: coRes } = useQuery({
		queryKey: ["examination", id, "clinical-orders"],
		queryFn: () => apiClient.get(`${GW}/clinical-orders/session/${id}`),
		enabled: !!id && !!session,
	});
	const clinicalOrders = useMemo(
		() =>
			filterByEncounterScope(unwrapArr<ClinicalOrder>(coRes), {
				sessionId: id,
				recordId: session?.record_id,
			}),
		[coRes, id, session?.record_id],
	);

	// ── dental chart (by record) ──
	const { data: chartRes } = useQuery({
		queryKey: ["examination", id, "dental-chart", session?.record_id],
		queryFn: () =>
			apiClient.get(`${GW}/dental-charts/record/${session?.record_id}`),
		enabled: !!session?.record_id,
	});
	const dentalChartEntries = useMemo(
		() =>
			unwrapArr<DentalChartEntry>(chartRes).toSorted(
				(a, b) => a.tooth_number - b.tooth_number,
			),
		[chartRes],
	);

	const invalidate = (key: string, extra?: string) =>
		qc.invalidateQueries({
			queryKey: extra
				? ["examination", id, key, extra]
				: ["examination", id, key],
		});

	// ── inline form state ──
	const [inlineForm, setInlineForm] = useState<InlineFormKey | null>(null);
	const [inlineError, setInlineError] = useState("");
	const [editingSymp, setEditingSymp] = useState<Symptom | null>(null);
	const [editingDiag, setEditingDiag] = useState<Diagnosis | null>(null);
	const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
	const [editingChart, setEditingChart] = useState<DentalChartEntry | null>(
		null,
	);
	const [followUpContext, setFollowUpContext] = useState<{
		title: string;
		treatmentPlanId?: string;
	}>({ title: "Schedule follow-up recall" });
	const [symptomForm, setSymptomForm] = useState<SymptomFormValues>(
		emptySymptomForm(),
	);
	const [diagnosisForm, setDiagnosisForm] = useState<DiagnosisFormValues>(
		emptyDiagnosisForm(),
	);
	const [planForm, setPlanForm] = useState<TreatmentPlanFormValues>(
		emptyTreatmentPlanForm(),
	);
	const [prescriptionForm, setPrescriptionForm] =
		useState<PrescriptionFormValues>(emptyPrescriptionForm());
	const [itemForm, setItemForm] = useState<PrescriptionItemFormValues>(
		emptyPrescriptionItemForm(),
	);
	const [diagnosticForm, setDiagnosticForm] =
		useState<DiagnosticOrderFormValues>(emptyDiagnosticOrderForm());
	const [clinicalForm, setClinicalForm] = useState<ClinicalOrderFormValues>(
		emptyClinicalOrderForm("lab_test"),
	);
	const [clinicalTeethRaw, setClinicalTeethRaw] = useState("");
	const [chartForm, setChartForm] = useState<DentalChartFormValues>(
		emptyDentalChartForm(),
	);
	const [followUpForm, setFollowUpForm] = useState<FollowUpFormValues>(
		emptyFollowUpForm(),
	);
	const [amendmentForm, setAmendmentForm] = useState<AmendmentFormValues>(
		emptyAmendmentForm(),
	);

	const closeInlineForm = () => {
		setInlineForm(null);
		setInlineError("");
		setEditingSymp(null);
		setEditingDiag(null);
		setEditingPlan(null);
		setEditingChart(null);
	};

	// ── symptom mutations ──
	const createSymp = useMutation({
		mutationFn: (v: SymptomFormValues) =>
			apiClient.post(`${GW}/symptoms`, {
				session_id: id,
				patient_id: patientId || undefined,
				recorded_by: actorId,
				...cleanDates(v),
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.symptomAdded", "Symptom added"));
			invalidate("symptoms");
			setSymptomForm(emptySymptomForm());
			closeInlineForm();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("examination.toast.symptomAddFailed", "Failed to add symptom"),
			),
	});
	const updateSymp = useMutation({
		mutationFn: ({ sid, v }: { sid: string; v: SymptomFormValues }) =>
			apiClient.patch(`${GW}/symptoms/${sid}`, cleanDates(v)),
		onSuccess: () => {
			toast.success(t("examination.toast.symptomUpdated", "Symptom updated"));
			invalidate("symptoms");
			setSymptomForm(emptySymptomForm());
			closeInlineForm();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("examination.toast.symptomUpdateFailed", "Failed to update symptom"),
			),
	});
	const deleteSymp = useMutation({
		mutationFn: (sid: string) => apiClient.delete(`${GW}/symptoms/${sid}`),
		onSuccess: () => {
			toast.success(t("examination.toast.symptomDeleted", "Symptom deleted"));
			invalidate("symptoms");
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("examination.toast.symptomDeleteFailed", "Failed to delete symptom"),
			),
	});

	// ── diagnosis mutations ──
	const createDiag = useMutation({
		mutationFn: (v: DiagnosisFormValues) =>
			apiClient.post(`${GW}/diagnoses`, {
				session_id: id,
				icd_code: v.icd_code || undefined,
				diagnosis_name: v.diagnosis_name,
				diagnosis_type: v.diagnosis_type || undefined,
				severity: v.severity || undefined,
				notes: v.notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.diagnosisAdded", "Diagnosis added"));
			invalidate("diagnoses");
			setDiagnosisForm(emptyDiagnosisForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.diagnosisAddFailed", "Failed to add diagnosis")),
	});
	const updateDiag = useMutation({
		mutationFn: ({ did, v }: { did: string; v: DiagnosisFormValues }) =>
			apiClient.patch(`${GW}/diagnoses/${did}`, {
				icd_code: v.icd_code || undefined,
				diagnosis_name: v.diagnosis_name,
				diagnosis_type: v.diagnosis_type || undefined,
				severity: v.severity || undefined,
				notes: v.notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.diagnosisUpdated", "Diagnosis updated"));
			invalidate("diagnoses");
			setDiagnosisForm(emptyDiagnosisForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.diagnosisUpdateFailed", "Failed to update diagnosis")),
	});
	const deleteDiag = useMutation({
		mutationFn: (did: string) => apiClient.delete(`${GW}/diagnoses/${did}`),
		onSuccess: () => {
			toast.success(t("examination.toast.diagnosisDeleted", "Diagnosis deleted"));
			invalidate("diagnoses");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.diagnosisDeleteFailed", "Failed to delete diagnosis")),
	});

	// ── treatment-plan mutations ──
	const createPlan = useMutation({
		mutationFn: (v: TreatmentPlanFormValues) =>
			apiClient.post(`${GW}/treatment-plans`, {
				session_id: id,
				patient_id: patientId,
				record_id: session?.record_id || undefined,
				created_by: actorId,
				plan_name: v.plan_name,
				objectives: v.objectives,
				duration_weeks: v.duration_weeks ?? undefined,
				estimated_cost: v.estimated_cost || undefined,
				quote_currency: v.quote_currency || "VND",
				quote_version: v.quote_version || undefined,
				risk_disclosure: v.risk_disclosure || undefined,
				alternative_options: v.alternative_options || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.planCreated", "Treatment plan created"));
			invalidate("plans");
			setPlanForm(emptyTreatmentPlanForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planCreateFailed", "Failed to create treatment plan")),
	});
	const updatePlan = useMutation({
		mutationFn: ({ pid, v }: { pid: string; v: TreatmentPlanFormValues }) =>
			apiClient.patch(`${GW}/treatment-plans/${pid}`, {
				plan_name: v.plan_name,
				objectives: v.objectives,
				duration_weeks: v.duration_weeks ?? undefined,
				estimated_cost: v.estimated_cost || undefined,
				quote_currency: v.quote_currency || "VND",
				quote_version: v.quote_version || undefined,
				risk_disclosure: v.risk_disclosure || undefined,
				alternative_options: v.alternative_options || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.planUpdated", "Treatment plan updated"));
			invalidate("plans");
			setPlanForm(emptyTreatmentPlanForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planUpdateFailed", "Failed to update treatment plan")),
	});
	const proposePlan = useMutation({
		mutationFn: (pid: string) =>
			apiClient.patch(`${GW}/treatment-plans/${pid}/propose`),
		onSuccess: () => {
			toast.success(t("examination.toast.planProposed", "Treatment plan proposed"));
			invalidate("plans");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planProposeFailed", "Failed to propose treatment plan")),
	});
	const acceptPlan = useMutation({
		mutationFn: ({
			pid,
			acceptanceScope = "full",
			acceptedScopeNote,
		}: {
			pid: string;
			acceptanceScope?: "full" | "partial";
			acceptedScopeNote?: string;
		}) =>
			apiClient.patch(`${GW}/treatment-plans/${pid}/accept`, {
				accepted_by: actorId,
				acceptance_scope: acceptanceScope,
				accepted_scope_note: acceptedScopeNote,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.planAccepted", "Treatment plan accepted"));
			invalidate("plans");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planAcceptFailed", "Failed to accept treatment plan")),
	});
	const declinePlan = useMutation({
		mutationFn: ({ pid, reason }: { pid: string; reason?: string }) =>
			apiClient.patch(`${GW}/treatment-plans/${pid}/decline`, {
				declined_by: actorId,
				reason,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.planDeclined", "Treatment plan declined"));
			invalidate("plans");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planDeclineFailed", "Failed to decline treatment plan")),
	});
	const deletePlan = useMutation({
		mutationFn: (pid: string) =>
			apiClient.delete(`${GW}/treatment-plans/${pid}`),
		onSuccess: () => {
			toast.success(t("examination.toast.planDeleted", "Treatment plan deleted"));
			invalidate("plans");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.planDeleteFailed", "Failed to delete treatment plan")),
	});

	// ── prescription mutations ──
	const createPresc = useMutation({
		mutationFn: (v: PrescriptionFormValues) =>
			apiClient.post(`${GW}/prescriptions`, {
				session_id: id,
				patient_id: patientId,
				doctor_id: actorId,
				record_id: session?.record_id || undefined,
				...v,
			}),
		onSuccess: (res) => {
			toast.success(t("examination.toast.prescriptionCreated", "Prescription created"));
			invalidate("prescriptions");
			const created = unwrapOne<BackendPrescription>(res);
			if (created?.prescription_id)
				setActivePrescriptionId(created.prescription_id);
			setPrescriptionForm(emptyPrescriptionForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.prescriptionCreateFailed", "Failed to create prescription")),
	});
	const addItem = useMutation({
		mutationFn: (v: PrescriptionItemFormValues) =>
			apiClient.post(`${GW}/prescription-items`, {
				prescription_id: selectedPrescriptionId,
				...v,
				duration_days: v.duration_days ?? undefined,
				quantity: v.quantity ?? undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.drugAdded", "Drug added"));
			invalidate("prescription-items", selectedPrescriptionId ?? undefined);
			setItemForm(emptyPrescriptionItemForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.drugAddFailed", "Failed to add drug")),
	});
	const deleteItem = useMutation({
		mutationFn: (itemId: string) =>
			apiClient.delete(`${GW}/prescription-items/${itemId}`),
		onSuccess: () => {
			toast.success(t("examination.toast.drugRemoved", "Drug removed"));
			invalidate("prescription-items", selectedPrescriptionId ?? undefined);
		},
		onError: (e) => toast.apiError(e, t("examination.toast.drugRemoveFailed", "Failed to remove drug")),
	});
	const [issuedPrescriptionModalOpen, setIssuedPrescriptionModalOpen] =
		useState(false);
	const issuePresc = useMutation({
		mutationFn: (prescriptionId: string) =>
			apiClient.patch(`${GW}/prescriptions/${prescriptionId}/issue`),
		onSuccess: () => {
			setIssuedPrescriptionModalOpen(true);
			invalidate("prescriptions");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.prescriptionIssueFailed", "Failed to issue prescription")),
	});
	const cancelPresc = useMutation({
		mutationFn: ({
			prescriptionId,
			reason,
		}: { prescriptionId: string; reason: string }) =>
			apiClient.patch(`${GW}/prescriptions/${prescriptionId}/cancel`, {
				reason,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.prescriptionCancelled", "Prescription cancelled"));
			invalidate("prescriptions");
		},
		onError: (e) => toast.apiError(e, t("examination.toast.prescriptionCancelFailed", "Failed to cancel prescription")),
	});

	// ── diagnostic-order mutation ──
	const createDx = useMutation({
		mutationFn: (v: DiagnosticOrderFormValues) =>
			apiClient.post(`${GW}/diagnostic-orders`, {
				appointment_id: sessionAppointmentId,
				patient_id: patientId,
				doctor_id: actorId,
				order_type: v.order_type,
				description: v.description || undefined,
				priority: v.priority || undefined,
				tooth_number: v.tooth_number || undefined,
				area: v.area || undefined,
				notes: v.notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.diagnosticOrderCreated", "Diagnostic order created"));
			invalidate("diagnostic-orders");
			setDiagnosticForm(emptyDiagnosticOrderForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.diagnosticOrderCreateFailed", "Failed to create diagnostic order")),
	});

	// ── clinical-order mutation ──
	const createCo = useMutation({
		mutationFn: (v: ClinicalOrderFormValues) =>
			apiClient.post(`${GW}/clinical-orders`, {
				session_id: id,
				patient_id: patientId,
				ordered_by: actorId,
				record_id: session?.record_id || undefined,
				order_type: v.order_type,
				test_type: v.test_type,
				clinical_indication: v.clinical_indication || undefined,
				teeth_numbers: v.teeth_numbers,
				urgency: v.urgency || undefined,
				status: v.status || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.clinicalOrderCreated", "Clinical order created"));
			invalidate("clinical-orders");
			setClinicalForm(emptyClinicalOrderForm("lab_test"));
			setClinicalTeethRaw("");
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.clinicalOrderCreateFailed", "Failed to create clinical order")),
	});

	// ── dental-chart mutations ──
	const createChart = useMutation({
		mutationFn: (v: DentalChartFormValues) =>
			apiClient.post(`${GW}/dental-charts`, {
				patient_id: patientId,
				record_id: session?.record_id,
				tooth_number: normalizeDentalChartToothNumber(v.tooth_number),
				tooth_status: v.tooth_status || undefined,
				notes: v.notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.chartAdded", "Dental chart entry added"));
			invalidate("dental-chart", session?.record_id ?? undefined);
			setChartForm(emptyDentalChartForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.chartAddFailed", "Failed to add dental chart entry")),
	});
	const updateChart = useMutation({
		mutationFn: ({
			chartId,
			v,
		}: { chartId: string; v: DentalChartFormValues }) =>
			apiClient.patch(`${GW}/dental-charts/${chartId}`, {
				tooth_status: v.tooth_status || undefined,
				notes: v.notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.chartUpdated", "Dental chart entry updated"));
			invalidate("dental-chart", session?.record_id ?? undefined);
			setChartForm(emptyDentalChartForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.chartUpdateFailed", "Failed to update dental chart entry")),
	});
	const deleteChart = useMutation({
		mutationFn: (chartId: string) =>
			apiClient.delete(`${GW}/dental-charts/${chartId}`),
		onSuccess: () => {
			toast.success(t("examination.toast.chartDeleted", "Dental chart entry deleted"));
			invalidate("dental-chart", session?.record_id ?? undefined);
		},
		onError: (e) => toast.apiError(e, t("examination.toast.chartDeleteFailed", "Failed to delete dental chart entry")),
	});

	const finalizeSession = useMutation({
		mutationFn: () =>
			apiClient.patch(`${GW}/examination-sessions/${id}/finalize`),
		onSuccess: () => {
			toast.success(t("examination.toast.encounterFinalized", "Encounter finalized"));
			qc.invalidateQueries({ queryKey: ["examination", id] });
			if (sessionAppointmentId) {
				qc.invalidateQueries({ queryKey: ["appointments"] });
			}
		},
		onError: (e) => toast.apiError(e, t("examination.toast.encounterFinalizeFailed", "Failed to finalize encounter")),
	});

	// "Finalize encounter" requires at least one of these three fields to be
	// filled (see getFinalizeEncounterBlocker) — but nothing on this page could
	// ever set them after session creation, so a session started with a blank
	// chief complaint was permanently stuck. This lets the doctor fill them in.
	const updateNotes = useMutation({
		mutationFn: (notes: {
			chief_complaint?: string;
			present_illness?: string;
			physical_examination?: string;
		}) => apiClient.patch(`${GW}/examination-sessions/${id}`, notes),
		onSuccess: () => {
			toast.success(t("examination.toast.notesSaved", "Clinical notes saved"));
			qc.invalidateQueries({ queryKey: ["examination", id] });
		},
		onError: (e) => toast.apiError(e, t("examination.toast.notesSaveFailed", "Failed to save clinical notes")),
	});

	const createFollowUp = useMutation({
		mutationFn: ({
			form,
			treatmentPlanId,
		}: {
			form: FollowUpFormValues;
			treatmentPlanId?: string;
		}) =>
			examinationApi.createFollowUp({
				sessionId: id,
				patientId,
				doctorId: session?.doctor_id ?? "",
				clinicId: session?.clinic_id ?? "",
				actorId,
				treatmentPlanId,
				form,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.followUpScheduled", "Follow-up scheduled"));
			qc.invalidateQueries({ queryKey: ["examination", id, "follow-ups"] });
			qc.invalidateQueries({ queryKey: ["appointments"] });
			setFollowUpForm(emptyFollowUpForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.followUpScheduleFailed", "Failed to schedule follow-up")),
	});

	const createAmendment = useMutation({
		mutationFn: (form: AmendmentFormValues) =>
			examinationApi.createAmendment(id, {
				amendment_reason: form.amendment_reason,
				amendment_text: form.amendment_text,
				amended_by: actorId,
			}),
		onSuccess: () => {
			toast.success(t("examination.toast.amendmentAdded", "Amendment added"));
			qc.invalidateQueries({ queryKey: ["examination", id, "amendments"] });
			setAmendmentForm(emptyAmendmentForm());
			closeInlineForm();
		},
		onError: (e) => toast.apiError(e, t("examination.toast.amendmentAddFailed", "Failed to add amendment")),
	});

	const submitSymptom = (event: React.FormEvent) => {
		event.preventDefault();
		if (!symptomForm.symptom_name.trim()) {
			setInlineError(t("examination.validation.symptomNameRequired", "Symptom name is required."));
			return;
		}
		setInlineError("");
		if (editingSymp) {
			updateSymp.mutate({ sid: editingSymp.symptom_id, v: symptomForm });
		} else {
			createSymp.mutate(symptomForm);
		}
	};

	const submitDiagnosis = (event: React.FormEvent) => {
		event.preventDefault();
		if (!diagnosisForm.diagnosis_name.trim()) {
			setInlineError(t("examination.validation.diagnosisNameRequired", "Diagnosis name is required."));
			return;
		}
		setInlineError("");
		if (editingDiag) {
			updateDiag.mutate({ did: editingDiag.diagnosis_id, v: diagnosisForm });
		} else {
			createDiag.mutate(diagnosisForm);
		}
	};

	const submitTreatmentPlan = (event: React.FormEvent) => {
		event.preventDefault();
		if (!patientId) {
			setInlineError(t("examination.validation.sessionNoPatient", "Session has no patient."));
			return;
		}
		const blocker = validateTreatmentPlanForm(planForm);
		if (blocker) {
			setInlineError(blocker);
			return;
		}
		setInlineError("");
		if (editingPlan) {
			updatePlan.mutate({ pid: editingPlan.plan_id, v: planForm });
		} else {
			createPlan.mutate(planForm);
		}
	};

	const submitPrescription = (event: React.FormEvent) => {
		event.preventDefault();
		if (!patientId) {
			setInlineError(t("examination.validation.sessionNoPatient", "Session has no patient."));
			return;
		}
		setInlineError("");
		createPresc.mutate(prescriptionForm);
	};

	const submitPrescriptionItem = (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedPrescriptionId) {
			setInlineError(t("examination.validation.selectPrescriptionRequired", "Select a prescription before adding medication."));
			return;
		}
		const validationError = validatePrescriptionItemForm(itemForm);
		if (validationError) {
			setInlineError(validationError);
			return;
		}
		setInlineError("");
		addItem.mutate(itemForm);
	};

	const submitDentalChart = (event: React.FormEvent) => {
		event.preventDefault();
		const blocker = getDentalChartFormBlocker({
			isFinalized,
			patientId,
			recordId: session?.record_id,
			toothNumber: chartForm.tooth_number,
		});
		if (blocker) {
			setInlineError(blocker);
			return;
		}
		setInlineError("");
		if (editingChart) {
			updateChart.mutate({ chartId: editingChart.chart_id, v: chartForm });
		} else {
			createChart.mutate(chartForm);
		}
	};

	const submitDiagnosticOrder = (event: React.FormEvent) => {
		event.preventDefault();
		if (!patientId) {
			setInlineError(t("examination.validation.sessionNoPatient", "Session has no patient."));
			return;
		}
		if (!sessionAppointmentId) {
			setInlineError(t("examination.validation.sessionNoAppointment", "Session has no linked appointment."));
			return;
		}
		if (!diagnosticForm.order_type) {
			setInlineError(t("examination.validation.diagnosticOrderTypeRequired", "Diagnostic order type is required."));
			return;
		}
		setInlineError("");
		createDx.mutate(diagnosticForm);
	};

	const submitClinicalOrder = (event: React.FormEvent) => {
		event.preventDefault();
		if (!patientId) {
			setInlineError(t("examination.validation.sessionNoPatient", "Session has no patient."));
			return;
		}
		if (!clinicalForm.order_type || !clinicalForm.test_type.trim()) {
			setInlineError(t("examination.validation.clinicalOrderFieldsRequired", "Order type and test type are required."));
			return;
		}
		const teeth = clinicalTeethRaw
			.split(/[,\s]+/)
			.map((tooth) => Number(tooth.trim()))
			.filter((tooth) => Number.isInteger(tooth) && tooth > 0);
		setInlineError("");
		createCo.mutate({
			...clinicalForm,
			teeth_numbers: teeth.length ? teeth : undefined,
		});
	};

	const submitFollowUp = (event: React.FormEvent) => {
		event.preventDefault();
		const blocker = getFollowUpFormBlocker({
			sessionId: id,
			patientId,
			doctorId: session?.doctor_id,
			clinicId: session?.clinic_id,
			appointmentDate: followUpForm.appointment_date,
			appointmentTime: followUpForm.appointment_time,
			durationMinutes: followUpForm.duration_minutes,
		});
		if (blocker) {
			setInlineError(blocker);
			return;
		}
		setInlineError("");
		createFollowUp.mutate({
			form: followUpForm,
			treatmentPlanId: followUpContext.treatmentPlanId,
		});
	};

	const submitAmendment = (event: React.FormEvent) => {
		event.preventDefault();
		const blocker = getAmendmentFormBlocker({
			isFinalized,
			sessionId: id,
			amendmentReason: amendmentForm.amendment_reason,
			amendmentText: amendmentForm.amendment_text,
			amendedBy: actorId,
		});
		if (blocker) {
			setInlineError(blocker);
			return;
		}
		setInlineError("");
		createAmendment.mutate(amendmentForm);
	};

	// ── render ──
	return (
		<>
		<AppShell>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push("/examinations")}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} />{" "}
					{t("examination.detail.backToExaminations", "Back to examinations")}
				</button>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-20 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("examination.detail.loadingSession", "Loading session…")}
					</div>
				)}
				{isError && !isLoading && (
					<div className={`${cardBase} p-10 text-center text-sm text-red-300`}>
						{t("examination.detail.loadFailed", "Failed to load session.")}
					</div>
				)}
				{!isLoading && !isError && !session && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t("examination.detail.sessionNotFound", "Session not found.")}
					</div>
				)}

				{session && (
					<>
						{/* Session header */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex items-start gap-4">
								<span
									className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${panelBase}`}
								>
									<Icon
										icon="lucide:clipboard-plus"
										width={24}
										style={{ color: BLUE }}
									/>
								</span>
								<div className="flex flex-1 flex-col gap-2">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<h1 className="font-poppins text-[24px] font-bold tracking-[-0.5px] text-smile-primary-dark">
											{t("examination.detail.title", "Clinical Examination")}
										</h1>
										<div className="flex flex-wrap items-center gap-2">
											{isFinalized && (
												<>
													<button
														onClick={() => {
															setAmendmentForm(emptyAmendmentForm());
															setInlineError("");
															setInlineForm("amendment");
														}}
														disabled={createAmendment.isPending}
														className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
													>
														<Icon icon="lucide:file-pen-line" width={14} />
														{t("examination.detail.addAmendment", "Add amendment")}
													</button>
													<button
														onClick={() => {
															setFollowUpContext({
																title: t(
																	"examination.detail.scheduleFollowUpRecall",
																	"Schedule follow-up recall",
																),
															});
															setFollowUpForm(emptyFollowUpForm());
															setInlineError("");
															setInlineForm("follow-up");
														}}
														disabled={createFollowUp.isPending}
														className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
													>
														<Icon icon="lucide:calendar-plus" width={14} />
														{t("examination.detail.scheduleRecall", "Schedule recall")}
													</button>
												</>
											)}
											<button
												onClick={() => {
													if (finalizeBlocker) {
														toast.warning(finalizeBlocker);
														// The blocker text names the missing section — jump the
														// doctor straight to it instead of leaving them to hunt
														// for what's incomplete.
														const targetId = finalizeBlocker
															.toLowerCase()
															.includes("diagnosis")
															? "diagnoses-section"
															: finalizeBlocker.toLowerCase().includes("clinical note")
																? "clinical-notes-section"
																: null;
														if (targetId) {
															document
																.getElementById(targetId)
																?.scrollIntoView({
																	behavior: "smooth",
																	block: "center",
																});
														}
														return;
													}
													if (
														!confirm(
															t(
																"examination.detail.finalizeConfirm",
																"Finalize this encounter? It will lock the examination note.",
															),
														)
													)
														return;
													finalizeSession.mutate();
												}}
												disabled={isFinalized || finalizeSession.isPending}
												className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
												style={{ background: TEAL }}
											>
												<Icon
													icon={
														isFinalized ? "lucide:lock" : "lucide:signature"
													}
													width={14}
												/>
												{isFinalized
													? t("examination.detail.finalized", "Finalized")
													: t(
															"examination.detail.finalizeEncounter",
															"Finalize encounter",
														)}
											</button>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2 text-sm text-smile-description">
										<span
											className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${panelBase}`}
											style={{ color: TEAL }}
										>
											{session.session_id.slice(0, 8)}
										</span>
										<span
											className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-smile-description ${panelBase}`}
										>
											{(session.status ?? "in_progress").replace(/_/g, " ")}
										</span>
									</div>
									<div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-smile-description">
										<span>
											<Icon
												icon="lucide:user"
												width={13}
												className="mb-0.5 mr-1 inline"
											/>
											{patientLabel}
										</span>
										<span>
											<Icon
												icon="lucide:stethoscope"
												width={13}
												className="mb-0.5 mr-1 inline"
											/>
											{sessionDoctorLabel}
										</span>
										<span>
											<Icon
												icon="lucide:calendar"
												width={13}
												className="mb-0.5 mr-1 inline"
											/>
											{fmtDate(session.created_at ?? session.session_date)}
										</span>
									</div>
									{session.chief_complaint && (
										<p className="text-sm text-smile-description">
											<span className="text-smile-description">
												{t("examination.detail.chiefComplaintLabel", "Chief complaint")}
												:{" "}
											</span>
											{session.chief_complaint}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Clinical notes — "Finalize encounter" requires at least one of these
                filled in; this is the only place in the app that can set them after
                the session was created. */}
						<div id="clinical-notes-section" className={`${cardBase} flex flex-col gap-3 p-6`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.clinicalNotes", "Clinical notes")}
								</h2>
								<span className="text-[11px] font-semibold uppercase tracking-[1px] text-smile-description">
									{t("examination.detail.requiredToFinalize", "Required to finalize")}
								</span>
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<label className="flex flex-col gap-1.5">
									<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
										{t("examination.detail.chiefComplaintLabel", "Chief complaint")}
									</span>
									<textarea
										className={modalInputCls}
										rows={3}
										disabled={isFinalized}
										value={notesForm.chief_complaint}
										onChange={(e) =>
											setNotesForm((f) => ({
												...f,
												chief_complaint: e.target.value,
											}))
										}
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
										{t("examination.detail.presentIllness", "Present illness")}
									</span>
									<textarea
										className={modalInputCls}
										rows={3}
										disabled={isFinalized}
										value={notesForm.present_illness}
										onChange={(e) =>
											setNotesForm((f) => ({
												...f,
												present_illness: e.target.value,
											}))
										}
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
										{t(
											"examination.detail.physicalExamination",
											"Physical examination",
										)}
									</span>
									<textarea
										className={modalInputCls}
										rows={3}
										disabled={isFinalized}
										value={notesForm.physical_examination}
										onChange={(e) =>
											setNotesForm((f) => ({
												...f,
												physical_examination: e.target.value,
											}))
										}
									/>
								</label>
							</div>
							<div className="flex justify-end">
								<button
									onClick={() => updateNotes.mutate(notesForm)}
									disabled={isFinalized || updateNotes.isPending}
									className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
								>
									{updateNotes.isPending ? (
										<Icon icon="line-md:loading-twotone-loop" width={14} />
									) : (
										<Icon icon="lucide:save" width={14} />
									)}
									{t("examination.detail.saveNotes", "Save notes")}
								</button>
							</div>
						</div>

						{/* Clinical alerts */}
						<div className={`${cardBase} flex flex-col gap-3 p-6`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.clinicalAlerts", "Clinical alerts")}
								</h2>
								<span className="text-[11px] font-semibold uppercase tracking-[1px] text-smile-description">
									{t("examination.detail.reviewBeforeTreatment", "Review before treatment")}
								</span>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								{clinicalAlerts.map((alert) => (
									<ClinicalAlertCard
										key={`${alert.label}-${alert.value}`}
										alert={alert}
									/>
								))}
							</div>
						</div>

						<EncounterLegalReminderPanel
							sessionId={id}
							patientId={patientId}
							appointmentId={sessionAppointmentId}
							actorId={actorId}
						/>

						{/* Amendments */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.amendments", "Amendments")}{" "}
									<span className="text-smile-description">
										({amendments.length})
									</span>
								</h2>
								<button
									onClick={() => {
										if (!isFinalized) {
											toast.warning(
												t(
													"examination.detail.amendmentRequiresFinalized",
													"Only finalized encounters can be amended.",
												),
											);
											return;
										}
										setAmendmentForm(emptyAmendmentForm());
										setInlineError("");
										setInlineForm("amendment");
									}}
									disabled={!isFinalized || createAmendment.isPending}
									className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
									style={{ background: TEAL }}
								>
									<Icon icon="lucide:file-pen-line" width={14} />{" "}
									{t("examination.detail.addAmendment", "Add amendment")}
								</button>
							</div>
							{inlineForm === "amendment" && (
								<InlinePanel
									title={t("examination.detail.addAmendment", "Add amendment")}
									submitLabel={t("examination.detail.addAmendment", "Add amendment")}
									submitting={createAmendment.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitAmendment}
								>
									<InlineField label={t("examination.detail.reason", "Reason")}>
										<input
											className={modalInputCls}
											value={amendmentForm.amendment_reason}
											placeholder={t(
												"examination.detail.correctTypoPlaceholder",
												"Correct typo",
											)}
											onChange={(event) =>
												setAmendmentForm((form) => ({
													...form,
													amendment_reason: event.target.value,
												}))
											}
										/>
									</InlineField>
									<InlineField label={t("examination.detail.note", "Note")}>
										<textarea
											className={modalInputCls}
											value={amendmentForm.amendment_text}
											placeholder={t(
												"examination.detail.amendmentNotePlaceholder",
												"Amendment note",
											)}
											rows={4}
											onChange={(event) =>
												setAmendmentForm((form) => ({
													...form,
													amendment_text: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{amendments.length === 0 ? (
								<p className="text-sm text-smile-description">
									{t(
										"examination.detail.noAmendments",
										"No amendments recorded for this encounter.",
									)}
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{amendments.map((amendment) => (
										<Row
											key={amendment.amendment_id}
											title={amendment.amendment_reason}
											badge={fmtDateMaybe(amendment.created_at) || undefined}
											subtitle={
												amendment.amended_by
													? `by ${amendment.amended_by.slice(0, 8)}`
													: undefined
											}
											description={amendment.amendment_text}
										/>
									))}
								</div>
							)}
						</div>

						{/* Follow-up / Recall */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.followUpRecall", "Follow-up / Recall")}{" "}
									<span className="text-smile-description">
										({followUps.length})
									</span>
								</h2>
								<button
									onClick={() => {
										if (!isFinalized) {
											toast.warning(
												t(
													"examination.detail.recallRequiresFinalized",
													"Finalize the encounter before scheduling a general recall.",
												),
											);
											return;
										}
										setFollowUpContext({
											title: t(
												"examination.detail.scheduleFollowUpRecall",
												"Schedule follow-up recall",
											),
										});
										setFollowUpForm(emptyFollowUpForm());
										setInlineError("");
										setInlineForm("follow-up");
									}}
									disabled={!isFinalized || createFollowUp.isPending}
									className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
									style={{ background: BLUE }}
								>
									<Icon icon="lucide:calendar-plus" width={14} />{" "}
									{t("examination.detail.scheduleRecall", "Schedule recall")}
								</button>
							</div>
							{inlineForm === "follow-up" && (
								<InlinePanel
									title={followUpContext.title}
									submitLabel={t(
										"examination.detail.scheduleFollowUp",
										"Schedule follow-up",
									)}
									submitting={createFollowUp.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitFollowUp}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
										<InlineField label={t("examination.detail.date", "Date")}>
											<input
												type="date"
												className={modalInputCls}
												value={followUpForm.appointment_date}
												onChange={(event) =>
													setFollowUpForm((form) => ({
														...form,
														appointment_date: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.time", "Time")}>
											<input
												type="time"
												className={modalInputCls}
												value={followUpForm.appointment_time}
												onChange={(event) =>
													setFollowUpForm((form) => ({
														...form,
														appointment_time: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.duration", "Duration")}>
											<input
												type="number"
												min={5}
												step={5}
												className={modalInputCls}
												value={followUpForm.duration_minutes}
												onChange={(event) =>
													setFollowUpForm((form) => ({
														...form,
														duration_minutes: Number(event.target.value),
													}))
												}
											/>
										</InlineField>
									</div>
									<InlineField label={t("examination.detail.notes", "Notes")}>
										<textarea
											className={modalInputCls}
											value={followUpForm.notes}
											placeholder={t(
												"examination.detail.recallReasonPlaceholder",
												"Recall reason",
											)}
											rows={3}
											onChange={(event) =>
												setFollowUpForm((form) => ({
													...form,
													notes: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{followUps.length === 0 ? (
								<p className="text-sm text-smile-description">
									{t(
										"examination.detail.noFollowUp",
										"No follow-up appointment linked to this encounter.",
									)}
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{followUps.map((appt) => (
										<Row
											key={appt.appointment_id}
											title={`${fmtDate(appt.appointment_date)} · ${(appt.appointment_time ?? "").slice(0, 5) || "—"}`}
											badge={appt.status ?? undefined}
											subtitle={[
												appt.duration_minutes
													? `${appt.duration_minutes} ${t("examination.detail.minutes", "minutes")}`
													: "",
												appt.treatment_plan_id
													? `${t("examination.detail.planPrefix", "plan")} ${appt.treatment_plan_id.slice(0, 8)}`
													: t("examination.detail.encounterRecall", "encounter recall"),
											]
												.filter(Boolean)
												.join(" · ")}
											description={appt.notes ?? undefined}
										/>
									))}
								</div>
							)}
						</div>

						{/* Symptoms */}
						<Section
							title={t("examination.detail.symptoms", "Symptoms")}
							count={symptoms.length}
							addLabel={t("examination.detail.enterSymptom", "Enter symptom")}
							onAdd={() => {
								if (isFinalized) {
									toast.warning(
										t(
											"examination.detail.finalizedLocked",
											"Finalized encounters are locked.",
										),
									);
									return;
								}
								setEditingSymp(null);
								setSymptomForm(emptySymptomForm());
								setInlineError("");
								setInlineForm("symptom");
							}}
							empty={
								symptoms.length === 0
									? t("examination.detail.noSymptoms", "No symptoms recorded.")
									: undefined
							}
						>
							{inlineForm === "symptom" && (
								<InlinePanel
									title={
										editingSymp
											? t("examination.detail.editSymptom", "Edit symptom")
											: t("examination.detail.enterSymptom", "Enter symptom")
									}
									submitLabel={
										editingSymp
											? t("examination.detail.saveSymptom", "Save symptom")
											: t("examination.detail.addSymptom", "Add symptom")
									}
									submitting={createSymp.isPending || updateSymp.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitSymptom}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InlineField
											label={t("examination.detail.symptomName", "Symptom name")}
										>
											<input
												className={modalInputCls}
												value={symptomForm.symptom_name}
												placeholder={t(
													"examination.detail.toothachePlaceholder",
													"Toothache",
												)}
												onChange={(event) =>
													setSymptomForm((form) => ({
														...form,
														symptom_name: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField
											label={t("examination.detail.bodyLocation", "Body location")}
										>
											<input
												className={modalInputCls}
												value={symptomForm.body_location ?? ""}
												placeholder={t(
													"examination.detail.lowerLeftMolarPlaceholder",
													"Lower left molar",
												)}
												onChange={(event) =>
													setSymptomForm((form) => ({
														...form,
														body_location: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.severity", "Severity")}>
											<select
												className={modalInputCls}
												value={symptomForm.severity ?? ""}
												onChange={(event) =>
													setSymptomForm((form) => ({
														...form,
														severity: event.target.value,
													}))
												}
											>
												{["", "mild", "moderate", "severe"].map((severity) => (
													<option
														key={severity || "none"}
														value={severity}
														className="[background:var(--surface-input-bg)] text-smile-title"
													>
														{severity
															? t(
																	`examination.detail.severityLevels.${severity}`,
																	severity,
																)
															: "—"}
													</option>
												))}
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.onsetDate", "Onset date")}>
											<input
												type="date"
												className={modalInputCls}
												value={symptomForm.onset_date ?? ""}
												onChange={(event) =>
													setSymptomForm((form) => ({
														...form,
														onset_date: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.duration", "Duration")}>
											<input
												className={modalInputCls}
												value={symptomForm.duration ?? ""}
												placeholder={t(
													"examination.detail.threeDaysPlaceholder",
													"3 days",
												)}
												onChange={(event) =>
													setSymptomForm((form) => ({
														...form,
														duration: event.target.value,
													}))
												}
											/>
										</InlineField>
									</div>
									<InlineField label={t("examination.detail.description", "Description")}>
										<textarea
											className={modalInputCls}
											value={symptomForm.description ?? ""}
											placeholder={t(
												"examination.detail.additionalDetailsPlaceholder",
												"Additional details",
											)}
											rows={3}
											onChange={(event) =>
												setSymptomForm((form) => ({
													...form,
													description: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{symptoms.map((s) => (
								<Row
									key={s.symptom_id}
									title={s.symptom_name}
									badge={s.severity ?? undefined}
									subtitle={[
										s.body_location,
										s.duration,
										fmtDateMaybe(s.onset_date),
									]
										.filter(Boolean)
										.join(" · ")}
									description={s.description ?? undefined}
									onEdit={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										setEditingSymp(s);
										setSymptomForm({
											symptom_name: s.symptom_name,
											body_location: s.body_location ?? "",
											severity: s.severity ?? "",
											onset_date: s.onset_date
												? String(s.onset_date).slice(0, 10)
												: "",
											duration: s.duration ?? "",
											description: s.description ?? "",
										});
										setInlineError("");
										setInlineForm("symptom");
									}}
									onDelete={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										if (
											confirm(
												`${t("examination.detail.deleteSymptomConfirm", "Delete symptom")} "${s.symptom_name}"?`,
											)
										)
											deleteSymp.mutate(s.symptom_id);
									}}
								/>
							))}
						</Section>

						{/* Diagnoses */}
						<Section
							id="diagnoses-section"
							required
							title={t("examination.detail.diagnoses", "Diagnoses")}
							count={diagnoses.length}
							addLabel={t("examination.detail.addDiagnosis", "Add diagnosis")}
							onAdd={() => {
								if (isFinalized) {
									toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
									return;
								}
								setEditingDiag(null);
								setDiagnosisForm(emptyDiagnosisForm());
								setInlineError("");
								setInlineForm("diagnosis");
							}}
							empty={
								diagnoses.length === 0
									? t("examination.detail.noDiagnoses", "No diagnoses recorded.")
									: undefined
							}
						>
							{inlineForm === "diagnosis" && (
								<InlinePanel
									title={
										editingDiag
											? t("examination.detail.editDiagnosis", "Edit diagnosis")
											: t("examination.detail.addDiagnosis", "Add diagnosis")
									}
									submitLabel={
										editingDiag
											? t("examination.detail.saveDiagnosis", "Save diagnosis")
											: t("examination.detail.addDiagnosis", "Add diagnosis")
									}
									submitting={createDiag.isPending || updateDiag.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitDiagnosis}
								>
									<InlineField
										label={t("examination.detail.diagnosisName", "Diagnosis name")}
									>
										<input
											className={modalInputCls}
											value={diagnosisForm.diagnosis_name}
											placeholder={t(
												"examination.detail.dentalCariesPlaceholder",
												"Dental caries",
											)}
											onChange={(event) =>
												setDiagnosisForm((form) => ({
													...form,
													diagnosis_name: event.target.value,
												}))
											}
										/>
									</InlineField>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
										<InlineField label={t("examination.detail.icdCode", "ICD code")}>
											<input
												list="icd-code-options"
												className={modalInputCls}
												value={diagnosisForm.icd_code}
												placeholder="K02.9"
												onChange={(event) => {
													const code = event.target.value;
													const match = COMMON_ICD_CODES.find(
														(c) => c.code === code,
													);
													setDiagnosisForm((form) => ({
														...form,
														icd_code: code,
														// Auto-fill from the catalog only while the name is still empty.
														diagnosis_name:
															match && !form.diagnosis_name.trim()
																? match.description
																: form.diagnosis_name,
													}));
												}}
											/>
											<datalist id="icd-code-options">
												{COMMON_ICD_CODES.map((c) => (
													<option key={c.code} value={c.code}>
														{c.description}
													</option>
												))}
											</datalist>
										</InlineField>
										<InlineField label={t("examination.detail.type", "Type")}>
											<input
												className={modalInputCls}
												value={diagnosisForm.diagnosis_type}
												placeholder={t(
													"examination.detail.primaryPlaceholder",
													"primary",
												)}
												onChange={(event) =>
													setDiagnosisForm((form) => ({
														...form,
														diagnosis_type: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.severity", "Severity")}>
											<select
												className={modalInputCls}
												value={diagnosisForm.severity}
												onChange={(event) =>
													setDiagnosisForm((form) => ({
														...form,
														severity: event.target.value,
													}))
												}
											>
												{["", "mild", "moderate", "severe", "critical"].map(
													(severity) => (
														<option
															key={severity || "none"}
															value={severity}
															className="[background:var(--surface-input-bg)] text-smile-title"
														>
															{severity
																? t(
																		`examination.detail.severityLevels.${severity}`,
																		severity,
																	)
																: "—"}
														</option>
													),
												)}
											</select>
										</InlineField>
									</div>
									<InlineField label={t("examination.detail.notes", "Notes")}>
										<textarea
											className={modalInputCls}
											value={diagnosisForm.notes}
											placeholder={t(
												"examination.detail.clinicalNotesPlaceholder",
												"Clinical notes",
											)}
											rows={3}
											onChange={(event) =>
												setDiagnosisForm((form) => ({
													...form,
													notes: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{diagnoses.map((d) => (
								<Row
									key={d.diagnosis_id}
									title={d.diagnosis_name}
									badge={d.severity ?? undefined}
									subtitle={[d.icd_code, d.diagnosis_type]
										.filter(Boolean)
										.join(" · ")}
									description={d.notes ?? undefined}
									onEdit={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										setEditingDiag(d);
										setDiagnosisForm({
											icd_code: d.icd_code ?? "",
											diagnosis_name: d.diagnosis_name,
											diagnosis_type: d.diagnosis_type ?? "",
											severity: d.severity ?? "",
											notes: d.notes ?? "",
										});
										setInlineError("");
										setInlineForm("diagnosis");
									}}
									onDelete={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										if (
											confirm(
												`${t("examination.detail.deleteDiagnosisConfirm", "Delete diagnosis")} "${d.diagnosis_name}"?`,
											)
										)
											deleteDiag.mutate(d.diagnosis_id);
									}}
								/>
							))}
						</Section>

						{/* Treatment Plans */}
						<Section
							title={t("examination.detail.treatmentPlans", "Treatment Plans")}
							count={plans.length}
							addLabel={t("examination.detail.createPlan", "Create plan")}
							onAdd={() => {
								if (isFinalized) {
									toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
									return;
								}
								if (!patientId) {
									toast.warning(t("examination.detail.sessionNoPatientWarning", "Session has no patient."));
									return;
								}
								setEditingPlan(null);
								setPlanForm(emptyTreatmentPlanForm());
								setInlineError("");
								setInlineForm("plan");
							}}
							empty={
								plans.length === 0
									? t("examination.detail.noPlans", "No treatment plans yet.")
									: undefined
							}
						>
							{inlineForm === "plan" && (
								<InlinePanel
									title={
										editingPlan
											? t("examination.detail.editPlan", "Edit treatment plan")
											: t("examination.detail.createPlanTitle", "Create treatment plan")
									}
									submitLabel={
										editingPlan
											? t("examination.detail.savePlan", "Save plan")
											: t("examination.detail.createPlan", "Create plan")
									}
									submitting={createPlan.isPending || updatePlan.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitTreatmentPlan}
								>
									<InlineField label={t("examination.detail.planName", "Plan name")}>
										<input
											className={modalInputCls}
											value={planForm.plan_name ?? ""}
											placeholder={t(
												"examination.detail.rootCanalPlaceholder",
												"Root canal treatment",
											)}
											onChange={(event) =>
												setPlanForm((form) => ({
													...form,
													plan_name: event.target.value,
												}))
											}
										/>
									</InlineField>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
										<InlineField
											label={t("examination.detail.durationWeeks", "Duration (weeks)")}
										>
											<input
												type="number"
												min={1}
												className={modalInputCls}
												value={planForm.duration_weeks ?? ""}
												onChange={(event) =>
													setPlanForm((form) => ({
														...form,
														duration_weeks: event.target.value
															? Number(event.target.value)
															: null,
													}))
												}
											/>
										</InlineField>
										<InlineField
											label={t("examination.detail.estimatedCost", "Estimated cost")}
										>
											<input
												className={modalInputCls}
												value={planForm.estimated_cost ?? ""}
												placeholder="1500000"
												onChange={(event) =>
													setPlanForm((form) => ({
														...form,
														estimated_cost: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.currency", "Currency")}>
											<input
												className={modalInputCls}
												value={planForm.quote_currency ?? "VND"}
												placeholder="VND"
												onChange={(event) =>
													setPlanForm((form) => ({
														...form,
														quote_currency: event.target.value.toUpperCase(),
													}))
												}
											/>
										</InlineField>
									</div>
									<InlineField
										label={t("examination.detail.quoteVersion", "Quote version")}
									>
										<input
											className={modalInputCls}
											value={planForm.quote_version ?? ""}
											placeholder="quote-v1"
											onChange={(event) =>
												setPlanForm((form) => ({
													...form,
													quote_version: event.target.value,
												}))
											}
										/>
									</InlineField>
									<InlineField label={t("examination.detail.objectives", "Objectives")}>
										<textarea
											className={modalInputCls}
											value={planForm.objectives ?? ""}
											placeholder={t(
												"examination.detail.treatmentObjectivesPlaceholder",
												"Treatment objectives",
											)}
											rows={3}
											onChange={(event) =>
												setPlanForm((form) => ({
													...form,
													objectives: event.target.value,
												}))
											}
										/>
									</InlineField>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InlineField
											label={t("examination.detail.riskDisclosure", "Risk disclosure")}
										>
											<textarea
												className={modalInputCls}
												value={planForm.risk_disclosure ?? ""}
												placeholder={t(
													"examination.detail.risksDiscussedPlaceholder",
													"Risks discussed with patient",
												)}
												rows={3}
												onChange={(event) =>
													setPlanForm((form) => ({
														...form,
														risk_disclosure: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField
											label={t(
												"examination.detail.alternativeOptions",
												"Alternative options",
											)}
										>
											<textarea
												className={modalInputCls}
												value={planForm.alternative_options ?? ""}
												placeholder={t(
													"examination.detail.alternativeOptionsPlaceholder",
													"Alternative treatment options",
												)}
												rows={3}
												onChange={(event) =>
													setPlanForm((form) => ({
														...form,
														alternative_options: event.target.value,
													}))
												}
											/>
										</InlineField>
									</div>
								</InlinePanel>
							)}
							{plans.map((p) => {
								const status = (p.status ?? "draft").toLowerCase();
								const hasQuote = Number(p.estimated_cost ?? 0) > 0;
								const editable =
									!isFinalized &&
									![
										"accepted",
										"declined",
										"in_progress",
										"completed",
										"cancelled",
									].includes(status);
								return (
									<div
										key={p.plan_id}
										className={`group flex items-start justify-between gap-3 rounded-xl p-4 ${panelBase}`}
									>
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-smile-title">
													{p.plan_name ||
														t("examination.detail.treatmentPlan", "Treatment plan")}
												</span>
												{p.status && (
													<span className="rounded-full [background:var(--surface-input-bg)] px-2 py-0.5 text-[11px] capitalize text-smile-description">
														{p.status}
													</span>
												)}
											</div>
											<span className="text-xs text-smile-description">
												{p.duration_weeks != null
													? `${p.duration_weeks} ${t("examination.detail.weeks", "weeks")}`
													: "—"}
												{hasQuote
													? ` · ${formatMoney(p.estimated_cost, p.quote_currency ?? undefined)}`
													: ` · ${t("examination.detail.noQuote", "no quote")}`}
												{p.proposed_at
													? ` · ${t("examination.detail.proposed", "proposed")} ${fmtDate(p.proposed_at)}`
													: ""}
												{p.accepted_at
													? ` · ${t("examination.detail.accepted", "accepted")} ${fmtDate(p.accepted_at)}`
													: ""}
												{p.declined_at
													? ` · ${t("examination.detail.declined", "declined")} ${fmtDate(p.declined_at)}`
													: ""}
											</span>
											{p.objectives && (
												<span className="text-xs text-smile-description">
													{p.objectives}
												</span>
											)}
											<div className="flex flex-wrap gap-2 text-[11px] text-smile-description">
												{p.quote_version && (
													<span>
														{t("examination.detail.quotePrefix", "Quote")}{" "}
														{p.quote_version}
													</span>
												)}
												{p.risk_disclosure && (
													<span>
														{t("examination.detail.risksDocumented", "Risks documented")}
													</span>
												)}
												{p.alternative_options && (
													<span>
														{t(
															"examination.detail.alternativesDocumented",
															"Alternatives documented",
														)}
													</span>
												)}
												{p.acceptance_scope === "partial" && (
													<span>
														{t(
															"examination.detail.partialAcceptance",
															"Partial acceptance",
														)}
													</span>
												)}
											</div>
											{p.accepted_scope_note && (
												<span className="text-xs text-smile-description">
													{p.accepted_scope_note}
												</span>
											)}
										</div>
										<div className="flex shrink-0 items-center gap-1">
											{status === "draft" && (
												<button
													onClick={() => {
														const blocker = getTreatmentPlanProposalBlocker(p);
														if (blocker) {
															toast.warning(blocker);
															return;
														}
														proposePlan.mutate(p.plan_id);
													}}
													disabled={isFinalized || proposePlan.isPending}
													className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${ghostButton}`}
												>
													<Icon icon="lucide:send" width={13} />{" "}
													{t("examination.detail.propose", "Propose")}
												</button>
											)}
											{status === "proposed" && (
												<>
													<button
														onClick={() => {
															if (blockTreatmentPlanAcceptanceIfNeeded()) {
																return;
															}
															if (
																confirm(
																	t(
																		"examination.detail.confirmFullAcceptance",
																		"Record full patient acceptance for this treatment plan?",
																	),
																)
															) {
																acceptPlan.mutate({
																	pid: p.plan_id,
																	acceptanceScope: "full",
																});
															}
														}}
														disabled={isFinalized || acceptPlan.isPending}
														className="rounded p-1 text-[#38BDF8] transition hover:text-smile-primary disabled:opacity-50"
														title={t(
															"examination.detail.acceptFullPlan",
															"Accept full treatment plan",
														)}
													>
														<Icon icon="lucide:check" width={14} />
													</button>
													<button
														onClick={() => {
															if (blockTreatmentPlanAcceptanceIfNeeded()) {
																return;
															}
															const note = prompt(
																t(
																	"examination.detail.partialAcceptanceNotePrompt",
																	"Accepted scope note for partial acceptance",
																),
															);
															if (!note?.trim()) {
																toast.warning(
																	t(
																		"examination.detail.partialAcceptanceNoteRequired",
																		"Accepted scope note is required for partial acceptance.",
																	),
																);
																return;
															}
															acceptPlan.mutate({
																pid: p.plan_id,
																acceptanceScope: "partial",
																acceptedScopeNote: note,
															});
														}}
														disabled={isFinalized || acceptPlan.isPending}
														className="rounded p-1 text-[#92CDFD] transition hover:text-smile-primary disabled:opacity-50"
														title={t(
															"examination.detail.acceptPartialPlan",
															"Accept partial treatment plan",
														)}
													>
														<Icon icon="lucide:list-checks" width={14} />
													</button>
													<button
														onClick={() => {
															const reason =
																prompt(
																	t(
																		"examination.detail.declineReasonPrompt",
																		"Decline reason (optional)",
																	),
																) ?? undefined;
															declinePlan.mutate({ pid: p.plan_id, reason });
														}}
														disabled={isFinalized || declinePlan.isPending}
														className="rounded p-1 text-red-300 transition hover:text-red-200 disabled:opacity-50"
														title={t(
															"examination.detail.declinePlan",
															"Decline treatment plan",
														)}
													>
														<Icon icon="lucide:x" width={14} />
													</button>
												</>
											)}
											{[
												"accepted",
												"partially_accepted",
												"in_progress",
											].includes(status) && (
												<button
													onClick={() => {
														setFollowUpContext({
															title: t(
																"examination.detail.scheduleTreatmentFollowUp",
																"Schedule treatment follow-up",
															),
															treatmentPlanId: p.plan_id,
														});
														setFollowUpForm(emptyFollowUpForm());
														setInlineError("");
														setInlineForm("follow-up");
													}}
													disabled={createFollowUp.isPending}
													className="rounded p-1 text-[#92CDFD] transition hover:text-smile-primary disabled:opacity-50"
													title={t(
														"examination.detail.scheduleFollowUpForPlan",
														"Schedule follow-up for this plan",
													)}
												>
													<Icon icon="lucide:calendar-plus" width={14} />
												</button>
											)}
											{editable && (
												<RowActions
													onEdit={() => {
														setEditingPlan(p);
														setPlanForm({
															plan_name: p.plan_name ?? "",
															objectives: p.objectives ?? "",
															duration_weeks: p.duration_weeks ?? null,
															estimated_cost: p.estimated_cost
																? String(p.estimated_cost)
																: "",
															quote_currency: p.quote_currency ?? "VND",
															quote_version: p.quote_version ?? "",
															risk_disclosure: p.risk_disclosure ?? "",
															alternative_options: p.alternative_options ?? "",
														});
														setInlineError("");
														setInlineForm("plan");
													}}
													onDelete={() => {
														if (
															confirm(
																`${t("examination.detail.deletePlanConfirm", "Delete plan")} "${p.plan_name || ""}"?`,
															)
														)
															deletePlan.mutate(p.plan_id);
													}}
												/>
											)}
										</div>
									</div>
								);
							})}
						</Section>

						{/* Prescription */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex items-center justify-between">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.prescription", "Prescription")}{" "}
									<span className="text-smile-description">
										({prescriptions.length})
									</span>
								</h2>
								<button
									onClick={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										if (!patientId) {
											toast.warning(t("examination.detail.sessionNoPatientWarning", "Session has no patient."));
											return;
										}
										setPrescriptionForm(emptyPrescriptionForm());
										setInlineError("");
										setInlineForm("prescription");
									}}
									disabled={!canCreatePrescriptionNow || createPresc.isPending}
									className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
									style={{ background: BLUE }}
								>
									<Icon icon="lucide:plus" width={14} />{" "}
									{t(
										"examination.detail.createElectronicPrescription",
										"Create electronic prescription",
									)}
								</button>
							</div>

							{inlineForm === "prescription" && (
								<InlinePanel
									title={t(
										"examination.detail.createElectronicPrescription",
										"Create electronic prescription",
									)}
									submitLabel={t(
										"examination.detail.createPrescription",
										"Create prescription",
									)}
									submitting={createPresc.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitPrescription}
								>
									<InlineField
										label={t("examination.detail.prescriptionDate", "Prescription date")}
									>
										<input
											type="date"
											className={modalInputCls}
											value={prescriptionForm.prescription_date ?? ""}
											onChange={(event) =>
												setPrescriptionForm((form) => ({
													...form,
													prescription_date: event.target.value,
												}))
											}
										/>
									</InlineField>
									<InlineField label={t("examination.detail.notes", "Notes")}>
										<textarea
											className={modalInputCls}
											value={prescriptionForm.notes ?? ""}
											placeholder={t(
												"examination.detail.prescriptionNotesPlaceholder",
												"Prescription notes",
											)}
											rows={3}
											onChange={(event) =>
												setPrescriptionForm((form) => ({
													...form,
													notes: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}

							{prescriptions.length === 0 ? (
								<p className="text-sm text-smile-description">
									{t("examination.detail.noPrescriptions", "No prescriptions yet.")}
								</p>
							) : (
								<>
									<div className="flex flex-wrap gap-2">
										{prescriptions.map((pr) => {
											const active = pr.id === selectedPrescriptionId;
											const status = normalizePrescriptionStatus(pr.status);
											const canModifyThisPrescription =
												canModifyPrescriptionItems({
													isFinalized,
													prescriptionId: pr.id,
													status,
												});
											const isSelectedPrescription =
												pr.id === selectedPrescriptionId;
											const canIssueThisPrescription =
												isSelectedPrescription && canIssueSelectedPrescription;
											return (
												<div
													key={pr.id}
													className={`flex items-center gap-1 rounded-lg p-1 ${panelBase}`}
												>
													<button
														onClick={() => setActivePrescriptionId(pr.id)}
														className={`rounded-md px-2 py-1 text-xs font-semibold transition ${active ? "" : "text-smile-description hover:text-smile-primary"}`}
														style={
															active
																? {
																		background: "rgba(56, 189, 248,0.15)",
																		color: TEAL,
																	}
																: undefined
														}
													>
														{pr.id.slice(0, 8)} · {status}
													</button>
													{canModifyThisPrescription && (
														<>
															<button
																onClick={() => {
																	if (!isSelectedPrescription) {
																		setActivePrescriptionId(pr.id);
																		toast.warning(
																			t(
																				"examination.detail.reviewBeforeIssuing",
																				"Review this prescription before issuing.",
																			),
																		);
																		return;
																	}
																	if (!canIssueThisPrescription) {
																		toast.warning(
																			t(
																				"examination.detail.addMedicationBeforeIssuing",
																				"Add at least one medication item before issuing.",
																			),
																		);
																		return;
																	}
																	if (
																		!confirm(
																			t(
																				"examination.detail.issueSignConfirm",
																				"Issue and sign this prescription?",
																			),
																		)
																	)
																		return;
																	issuePresc.mutate(pr.id);
																}}
																className="rounded p-1 text-smile-description transition hover:text-smile-primary"
																title={
																	canIssueThisPrescription
																		? t(
																				"examination.detail.issuePrescription",
																				"Issue prescription",
																			)
																		: t(
																				"examination.detail.addMedicationBeforeIssuingTitle",
																				"Add at least one medication before issuing",
																			)
																}
															>
																<Icon icon="lucide:signature" width={13} />
															</button>
															<button
																onClick={() => {
																	const reason = prompt(
																		t(
																			"examination.detail.cancellationReasonPrompt",
																			"Cancellation reason",
																		),
																	);
																	if (!reason) return;
																	cancelPresc.mutate({
																		prescriptionId: pr.id,
																		reason,
																	});
																}}
																className="rounded p-1 text-red-300 transition hover:text-red-200"
																title={t(
																	"examination.detail.cancelPrescription",
																	"Cancel prescription",
																)}
															>
																<Icon icon="lucide:x" width={13} />
															</button>
														</>
													)}
												</div>
											);
										})}
									</div>

									{pediatricPrescriptionSnapshot && (
										<div className="rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900">
											{pediatricPrescriptionSnapshot}
										</div>
									)}

									<div className="flex items-center justify-between">
										<span className="text-xs text-smile-description">
											{selectedPrescriptionId
												? `${t("examination.detail.drugsInPrefix", "Drugs in")} ${selectedPrescriptionId.slice(0, 8)} (${items.length})`
												: t("examination.detail.selectPrescription", "Select a prescription")}
										</span>
										{selectedPrescriptionId && (
											<button
												onClick={() => {
													if (!canModifySelectedPrescriptionItems) {
														toast.warning(
															t(
																"examination.detail.onlyDraftPrescriptionsChangeable",
																"Only draft prescriptions can be changed.",
															),
														);
														return;
													}
													setItemForm(emptyPrescriptionItemForm());
													setInlineError("");
													setInlineForm("prescription-item");
												}}
												disabled={
													!canModifySelectedPrescriptionItems ||
													addItem.isPending
												}
												className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${ghostButton}`}
											>
												<Icon icon="lucide:pill" width={13} />{" "}
												{t("examination.detail.addDrug", "Add drug")}
											</button>
										)}
									</div>

									{inlineForm === "prescription-item" &&
										selectedPrescriptionId && (
											<InlinePanel
												title={t(
													"examination.detail.addDrugToPrescription",
													"Add drug to prescription",
												)}
												submitLabel={t("examination.detail.addDrug", "Add drug")}
												submitting={addItem.isPending}
												error={inlineError}
												onCancel={closeInlineForm}
												onSubmit={submitPrescriptionItem}
											>
												<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
													<InlineField
														label={t("examination.detail.medicationName", "Medication name")}
													>
														<input
															className={modalInputCls}
															value={itemForm.medication_name}
															placeholder="Amoxicillin"
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	medication_name: event.target.value,
																}))
															}
														/>
													</InlineField>
													<InlineField
														label={t("examination.detail.medicationCode", "Medication code")}
													>
														<input
															className={modalInputCls}
															value={itemForm.medication_code ?? ""}
															placeholder="AMOX-500"
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	medication_code: event.target.value,
																}))
															}
														/>
													</InlineField>
													<InlineField label={t("examination.detail.dosage", "Dosage")}>
														<input
															className={modalInputCls}
															value={itemForm.dosage}
															placeholder="500 mg"
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	dosage: event.target.value,
																}))
															}
														/>
													</InlineField>
													<InlineField label={t("examination.detail.route", "Route")}>
														<input
															className={modalInputCls}
															value={itemForm.route ?? ""}
															placeholder={t("examination.detail.oralPlaceholder", "oral")}
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	route: event.target.value,
																}))
															}
														/>
													</InlineField>
													<InlineField label={t("examination.detail.frequency", "Frequency")}>
														<input
															className={modalInputCls}
															value={itemForm.frequency}
															placeholder="3x / day"
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	frequency: event.target.value,
																}))
															}
														/>
													</InlineField>
													<InlineField
														label={t("examination.detail.durationDays", "Duration (days)")}
													>
														<input
															type="number"
															min={1}
															className={modalInputCls}
															value={itemForm.duration_days ?? ""}
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	duration_days: event.target.value
																		? Number(event.target.value)
																		: null,
																}))
															}
														/>
													</InlineField>
													<InlineField label={t("examination.detail.quantity", "Quantity")}>
														<input
															type="number"
															min={1}
															className={modalInputCls}
															value={itemForm.quantity ?? ""}
															onChange={(event) =>
																setItemForm((form) => ({
																	...form,
																	quantity: event.target.value
																		? Number(event.target.value)
																		: null,
																}))
															}
														/>
													</InlineField>
												</div>
												<InlineField label={t("examination.detail.instructions", "Instructions")}>
													<textarea
														className={modalInputCls}
														value={itemForm.instructions ?? ""}
														placeholder={t(
															"examination.detail.takeAfterMealsPlaceholder",
															"Take after meals",
														)}
														rows={3}
														onChange={(event) =>
															setItemForm((form) => ({
																...form,
																instructions: event.target.value,
															}))
														}
													/>
												</InlineField>
											</InlinePanel>
										)}

									{selectedPrescriptionId && items.length === 0 && (
										<p className="text-sm text-smile-description">
											{t("examination.detail.noDrugs", "No drugs in this prescription.")}
										</p>
									)}
									<div className="flex flex-col gap-3">
										{items.map((it) => (
											<Row
												key={it.item_id}
												title={it.medication_name}
												subtitle={[
													it.dosage,
													it.frequency,
													it.route,
													it.duration_days != null
														? `${it.duration_days} ${t("examination.detail.days", "days")}`
														: "",
													it.quantity != null
														? `${t("examination.detail.qtyPrefix", "qty")} ${it.quantity}`
														: "",
												]
													.filter(Boolean)
													.join(" · ")}
												description={it.instructions ?? undefined}
												onDelete={
													canModifySelectedPrescriptionItems
														? () => {
																if (
																	confirm(
																		`${t("examination.detail.removeConfirm", "Remove")} "${it.medication_name}"?`,
																	)
																)
																	deleteItem.mutate(it.item_id);
															}
														: undefined
												}
											/>
										))}
									</div>
								</>
							)}
						</div>

						{/* Dental Chart */}
						<Section
							title={t("examination.detail.dentalChart", "Dental Chart")}
							count={dentalChartEntries.length}
							addLabel={t("examination.detail.chartTooth", "Chart tooth")}
							onAdd={() => {
								const blocker = getDentalChartFormBlocker({
									isFinalized,
									patientId,
									recordId: session?.record_id,
									toothNumber: "11",
								});
								if (blocker) {
									toast.warning(blocker);
									return;
								}
								setEditingChart(null);
								setChartForm(emptyDentalChartForm());
								setInlineError("");
								setInlineForm("dental-chart");
							}}
							empty={
								dentalChartEntries.length === 0
									? t("examination.detail.noChartEntries", "No dental chart entries yet.")
									: undefined
							}
						>
							{inlineForm === "dental-chart" && (
								<InlinePanel
									title={
										editingChart
											? t("examination.detail.editChartEntry", "Edit dental chart entry")
											: t("examination.detail.chartTooth", "Chart tooth")
									}
									submitLabel={t("examination.detail.saveChartEntry", "Save chart entry")}
									submitting={createChart.isPending || updateChart.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitDentalChart}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InlineField label={t("examination.detail.toothNumber", "Tooth number")}>
											<input
												className={modalInputCls}
												value={chartForm.tooth_number}
												disabled={!!editingChart}
												placeholder="11"
												onChange={(event) =>
													setChartForm((form) => ({
														...form,
														tooth_number: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.status", "Status")}>
											<select
												className={modalInputCls}
												value={chartForm.tooth_status}
												onChange={(event) =>
													setChartForm((form) => ({
														...form,
														tooth_status: event.target.value,
													}))
												}
											>
												{[
													"",
													"sound",
													"caries",
													"filled",
													"missing",
													"crown",
													"implant",
													"root_canal",
												].map((status) => (
													<option
														key={status || "none"}
														value={status}
														className="[background:var(--surface-input-bg)] text-smile-title"
													>
														{status
															? t(`examination.detail.toothStatuses.${status}`, status)
															: t("examination.detail.selectStatus", "Select status")}
													</option>
												))}
											</select>
										</InlineField>
									</div>
									<InlineField label={t("examination.detail.notes", "Notes")}>
										<textarea
											className={modalInputCls}
											value={chartForm.notes}
											placeholder={t(
												"examination.detail.clinicalNotePlaceholder",
												"Clinical note",
											)}
											rows={3}
											onChange={(event) =>
												setChartForm((form) => ({
													...form,
													notes: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{dentalChartEntries.map((entry) => (
								<Row
									key={entry.chart_id}
									title={`${t("examination.detail.toothPrefix", "Tooth")} ${entry.tooth_number}`}
									badge={entry.tooth_status ?? undefined}
									description={entry.notes ?? undefined}
									onEdit={() => {
										if (isFinalized) {
											toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
											return;
										}
										setEditingChart(entry);
										setChartForm({
											tooth_number: String(entry.tooth_number),
											tooth_status: entry.tooth_status ?? "",
											notes: entry.notes ?? "",
										});
										setInlineError("");
										setInlineForm("dental-chart");
									}}
									onDelete={
										!isFinalized
											? () => {
													if (
														confirm(
															`${t("examination.detail.deleteChartEntryConfirm", "Delete dental chart entry for tooth")} ${entry.tooth_number}?`,
														)
													) {
														deleteChart.mutate(entry.chart_id);
													}
												}
											: undefined
									}
								/>
							))}
						</Section>

						{/* Diagnostic Orders — X-ray/CBCT */}
						<Section
							title={t(
								"examination.detail.diagnosticOrders",
								"Diagnostic Orders — X-ray / CBCT",
							)}
							count={diagnosticOrders.length}
							addLabel={t("examination.detail.orderXrayCbct", "Order X-ray / CBCT")}
							onAdd={() => {
								if (isFinalized) {
									toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
									return;
								}
								if (!patientId) {
									toast.warning(t("examination.detail.sessionNoPatientWarning", "Session has no patient."));
									return;
								}
								if (!sessionAppointmentId) {
									toast.warning(t("examination.detail.sessionNoAppointmentWarning", "Session has no linked appointment."));
									return;
								}
								setDiagnosticForm(emptyDiagnosticOrderForm());
								setInlineError("");
								setInlineForm("diagnostic-order");
							}}
							empty={
								diagnosticOrders.length === 0
									? t("examination.detail.noImagingOrders", "No imaging orders yet.")
									: undefined
							}
						>
							{inlineForm === "diagnostic-order" && (
								<InlinePanel
									title={t("examination.detail.orderXrayCbct", "Order X-ray / CBCT")}
									submitLabel={t("examination.detail.createOrder", "Create order")}
									submitting={createDx.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitDiagnosticOrder}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InlineField label={t("examination.detail.orderType", "Order type")}>
											<select
												className={modalInputCls}
												value={diagnosticForm.order_type}
												onChange={(event) =>
													setDiagnosticForm((form) => ({
														...form,
														order_type: event.target.value,
													}))
												}
											>
												<option
													value="x_ray"
													className="[background:var(--surface-input-bg)] text-smile-title"
												>
													{t("examination.detail.xRay", "X-ray")}
												</option>
												<option
													value="cbct"
													className="[background:var(--surface-input-bg)] text-smile-title"
												>
													CBCT
												</option>
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.priority", "Priority")}>
											<select
												className={modalInputCls}
												value={diagnosticForm.priority ?? "routine"}
												onChange={(event) =>
													setDiagnosticForm((form) => ({
														...form,
														priority: event.target.value,
													}))
												}
											>
												{["routine", "urgent", "stat"].map((priority) => (
													<option
														key={priority}
														value={priority}
														className="[background:var(--surface-input-bg)] text-smile-title"
													>
														{t(`examination.detail.priorityLevels.${priority}`, priority)}
													</option>
												))}
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.toothNumber", "Tooth number")}>
											<input
												className={modalInputCls}
												value={diagnosticForm.tooth_number ?? ""}
												placeholder="16"
												onChange={(event) =>
													setDiagnosticForm((form) => ({
														...form,
														tooth_number: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.area", "Area")}>
											<input
												className={modalInputCls}
												value={diagnosticForm.area ?? ""}
												placeholder={t(
													"examination.detail.lowerRightQuadrantPlaceholder",
													"lower-right quadrant",
												)}
												onChange={(event) =>
													setDiagnosticForm((form) => ({
														...form,
														area: event.target.value,
													}))
												}
											/>
										</InlineField>
									</div>
									<InlineField label={t("examination.detail.description", "Description")}>
										<input
											className={modalInputCls}
											value={diagnosticForm.description ?? ""}
											placeholder={t(
												"examination.detail.periapicalXrayPlaceholder",
												"Periapical X-ray",
											)}
											onChange={(event) =>
												setDiagnosticForm((form) => ({
													...form,
													description: event.target.value,
												}))
											}
										/>
									</InlineField>
									<InlineField label={t("examination.detail.notes", "Notes")}>
										<textarea
											className={modalInputCls}
											value={diagnosticForm.notes ?? ""}
											placeholder={t(
												"examination.detail.clinicalContextPlaceholder",
												"Clinical context",
											)}
											rows={3}
											onChange={(event) =>
												setDiagnosticForm((form) => ({
													...form,
													notes: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{diagnosticOrders.map((o) => (
								<Row
									key={o.order_id}
									title={`${(o.order_type ?? "order").replace(/_/g, " ").toUpperCase()}${o.order_code ? ` · ${o.order_code}` : ""}`}
									badge={o.status ?? undefined}
									subtitle={[
										o.priority,
										o.tooth_number
											? `${t("examination.detail.toothPrefixLower", "tooth")} ${o.tooth_number}`
											: "",
										o.area,
									]
										.filter(Boolean)
										.join(" · ")}
									description={o.description ?? undefined}
								/>
							))}
						</Section>

						{/* Clinical / Lab Orders */}
						<div className={`${cardBase} flex flex-col gap-4 p-6`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
									{t("examination.detail.clinicalLabOrders", "Clinical / Lab Orders")}{" "}
									<span className="text-smile-description">
										({clinicalOrders.length})
									</span>
								</h2>
								<div className="flex gap-2">
									<button
										onClick={() => {
											if (isFinalized) {
												toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
												return;
											}
											if (!patientId) {
												toast.warning(t("examination.detail.sessionNoPatientWarning", "Session has no patient."));
												return;
											}
											setClinicalForm(emptyClinicalOrderForm("lab_test"));
											setClinicalTeethRaw("");
											setInlineError("");
											setInlineForm("clinical-order");
										}}
										className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95"
										style={{ background: BLUE }}
									>
										<Icon icon="lucide:flask-conical" width={14} />{" "}
										{t("examination.detail.orderLabTest", "Order Lab Test")}
									</button>
									<button
										onClick={() => {
											if (isFinalized) {
												toast.warning(t("examination.detail.finalizedLocked", "Finalized encounters are locked."));
												return;
											}
											if (!patientId) {
												toast.warning(t("examination.detail.sessionNoPatientWarning", "Session has no patient."));
												return;
											}
											setClinicalForm(emptyClinicalOrderForm("clinical_test"));
											setClinicalTeethRaw("");
											setInlineError("");
											setInlineForm("clinical-order");
										}}
										className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${ghostButton}`}
									>
										<Icon icon="lucide:microscope" width={14} />{" "}
										{t("examination.detail.orderClinicalTest", "Order Clinical Test")}
									</button>
								</div>
							</div>
							{inlineForm === "clinical-order" && (
								<InlinePanel
									title={
										clinicalForm.order_type === "clinical_test"
											? t("examination.detail.orderClinicalTest", "Order Clinical Test")
											: t(
													"examination.detail.orderLaboratoryTest",
													"Order Laboratory Test",
												)
									}
									submitLabel={t("examination.detail.createOrder", "Create order")}
									submitting={createCo.isPending}
									error={inlineError}
									onCancel={closeInlineForm}
									onSubmit={submitClinicalOrder}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<InlineField label={t("examination.detail.orderType", "Order type")}>
											<select
												className={modalInputCls}
												value={clinicalForm.order_type}
												onChange={(event) =>
													setClinicalForm((form) => ({
														...form,
														order_type: event.target.value,
													}))
												}
											>
												<option
													value="lab_test"
													className="[background:var(--surface-input-bg)] text-smile-title"
												>
													{t("examination.detail.laboratoryTest", "Laboratory Test")}
												</option>
												<option
													value="clinical_test"
													className="[background:var(--surface-input-bg)] text-smile-title"
												>
													{t("examination.detail.clinicalTest", "Clinical Test")}
												</option>
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.testType", "Test type")}>
											<input
												className={modalInputCls}
												value={clinicalForm.test_type}
												placeholder="CBC / Biopsy / Sensitivity"
												onChange={(event) =>
													setClinicalForm((form) => ({
														...form,
														test_type: event.target.value,
													}))
												}
											/>
										</InlineField>
										<InlineField label={t("examination.detail.urgency", "Urgency")}>
											<select
												className={modalInputCls}
												value={clinicalForm.urgency ?? "routine"}
												onChange={(event) =>
													setClinicalForm((form) => ({
														...form,
														urgency: event.target.value,
													}))
												}
											>
												{["routine", "urgent", "stat"].map((urgency) => (
													<option
														key={urgency}
														value={urgency}
														className="[background:var(--surface-input-bg)] text-smile-title"
													>
														{t(`examination.detail.priorityLevels.${urgency}`, urgency)}
													</option>
												))}
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.status", "Status")}>
											<select
												className={modalInputCls}
												value={clinicalForm.status ?? "ordered"}
												onChange={(event) =>
													setClinicalForm((form) => ({
														...form,
														status: event.target.value,
													}))
												}
											>
												{[
													"ordered",
													"in_progress",
													"completed",
													"cancelled",
												].map((status) => (
													<option
														key={status}
														value={status}
														className="[background:var(--surface-input-bg)] text-smile-title"
													>
														{t(`examination.detail.orderStatuses.${status}`, status)}
													</option>
												))}
											</select>
										</InlineField>
										<InlineField label={t("examination.detail.teethNumbers", "Teeth numbers")}>
											<input
												className={modalInputCls}
												value={clinicalTeethRaw}
												placeholder="16, 17, 26"
												onChange={(event) =>
													setClinicalTeethRaw(event.target.value)
												}
											/>
										</InlineField>
									</div>
									<InlineField
										label={t("examination.detail.clinicalIndication", "Clinical indication")}
									>
										<textarea
											className={modalInputCls}
											value={clinicalForm.clinical_indication ?? ""}
											placeholder={t(
												"examination.detail.reasonForTestPlaceholder",
												"Reason for the test",
											)}
											rows={3}
											onChange={(event) =>
												setClinicalForm((form) => ({
													...form,
													clinical_indication: event.target.value,
												}))
											}
										/>
									</InlineField>
								</InlinePanel>
							)}
							{clinicalOrders.length === 0 ? (
								<p className="text-sm text-smile-description">
									{t(
										"examination.detail.noClinicalOrders",
										"No clinical or lab orders yet.",
									)}
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{clinicalOrders.map((o) => (
										<Row
											key={o.order_id}
											title={`${(o.order_type ?? "order").replace(/_/g, " ")} · ${o.test_type ?? ""}`}
											badge={o.status ?? undefined}
											subtitle={[
												o.urgency,
												o.teeth_numbers?.length
													? `${t("examination.detail.teethPrefixLower", "teeth")} ${o.teeth_numbers.join(", ")}`
													: "",
											]
												.filter(Boolean)
												.join(" · ")}
											description={o.clinical_indication ?? undefined}
										/>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</AppShell>
		<Dialog
			open={issuedPrescriptionModalOpen}
			onOpenChange={setIssuedPrescriptionModalOpen}
		>
			<DialogContent>
				<div className="flex flex-col items-center gap-3 py-2 text-center">
					<span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
						<Icon icon="lucide:check-circle-2" width={30} className="text-emerald-500" />
					</span>
					<DialogHeader>
						<DialogTitle>
							{t("examination.detail.prescriptionIssuedTitle", "Prescription issued")}
						</DialogTitle>
						<DialogDescription>
							{t(
								"examination.detail.prescriptionIssuedDesc",
								"The prescription has been signed and issued to the patient.",
							)}
						</DialogDescription>
					</DialogHeader>
				</div>
				<DialogFooter>
					<button
						onClick={() => setIssuedPrescriptionModalOpen(false)}
						className="flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95"
						style={{ background: TEAL }}
					>
						{t("common.done", "Done")}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
}

// ── helpers ──
function cleanDates(v: SymptomFormValues): SymptomFormValues {
	const out = { ...v };
	if (!out.onset_date) delete out.onset_date;
	if (!out.body_location) delete out.body_location;
	if (!out.severity) delete out.severity;
	if (!out.duration) delete out.duration;
	if (!out.description) delete out.description;
	return out;
}
const fmtDateMaybe = (d?: string | null) =>
	d ? new Date(d).toLocaleDateString() : "";

const formatMoney = (value?: string | number | null, currency = "VND") => {
	const amount = Number(value ?? 0);
	if (!Number.isFinite(amount) || amount <= 0) return "no quote";
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: currency || "VND",
		maximumFractionDigits: 0,
	}).format(amount);
};

const defaultFollowUpDate = () => {
	const next = new Date();
	next.setDate(next.getDate() + 7);
	return next.toISOString().slice(0, 10);
};

interface DiagnosisFormValues {
	icd_code: string;
	diagnosis_name: string;
	diagnosis_type: string;
	severity: string;
	notes: string;
}

interface DentalChartFormValues {
	tooth_number: string;
	tooth_status: string;
	notes: string;
}

interface FollowUpFormValues {
	appointment_date: string;
	appointment_time: string;
	duration_minutes: number;
	notes: string;
}

interface AmendmentFormValues {
	amendment_reason: string;
	amendment_text: string;
}

type InlineFormKey =
	| "symptom"
	| "diagnosis"
	| "plan"
	| "prescription"
	| "prescription-item"
	| "dental-chart"
	| "diagnostic-order"
	| "clinical-order"
	| "follow-up"
	| "amendment";

const emptySymptomForm = (): SymptomFormValues => ({
	symptom_name: "",
	body_location: "",
	severity: "",
	onset_date: "",
	duration: "",
	description: "",
});

const emptyDiagnosisForm = (): DiagnosisFormValues => ({
	icd_code: "",
	diagnosis_name: "",
	diagnosis_type: "",
	severity: "",
	notes: "",
});

const emptyTreatmentPlanForm = (): TreatmentPlanFormValues => ({
	plan_name: "",
	objectives: "",
	duration_weeks: null,
	estimated_cost: "",
	quote_currency: "VND",
	quote_version: "",
	risk_disclosure: "",
	alternative_options: "",
});

const emptyPrescriptionForm = (): PrescriptionFormValues => ({
	prescription_date: new Date().toISOString().slice(0, 10),
	status: "draft",
	notes: "",
});

const emptyPrescriptionItemForm = (): PrescriptionItemFormValues => ({
	medication_name: "",
	medication_code: "",
	dosage: "",
	route: "",
	frequency: "",
	duration_days: null,
	quantity: null,
	instructions: "",
});

const emptyDentalChartForm = (): DentalChartFormValues => ({
	tooth_number: "",
	tooth_status: "",
	notes: "",
});

const emptyDiagnosticOrderForm = (): DiagnosticOrderFormValues => ({
	order_type: "x_ray",
	priority: "routine",
	tooth_number: "",
	area: "",
	description: "",
	notes: "",
});

const emptyClinicalOrderForm = (
	orderType: string,
): ClinicalOrderFormValues => ({
	order_type: orderType,
	test_type: "",
	clinical_indication: "",
	urgency: "routine",
	status: "ordered",
});

const emptyFollowUpForm = (): FollowUpFormValues => ({
	appointment_date: defaultFollowUpDate(),
	appointment_time: "09:00",
	duration_minutes: 30,
	notes: "",
});

const emptyAmendmentForm = (): AmendmentFormValues => ({
	amendment_reason: "",
	amendment_text: "",
});

// ── presentational ──
function Section({
	id,
	title,
	count,
	addLabel,
	onAdd,
	empty,
	required,
	children,
}: {
	id?: string;
	title: string;
	count: number;
	addLabel?: string;
	onAdd?: () => void;
	empty?: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<div id={id} className={`${cardBase} flex flex-col gap-4 p-6`}>
			<div className="flex items-center justify-between">
				<h2 className="font-poppins text-[16px] font-semibold text-smile-title">
					{title}
					{required && <span className="text-[#38BDF8]"> *</span>}{" "}
					<span className="text-smile-description">({count})</span>
				</h2>
				{onAdd && (
					<button
						onClick={onAdd}
						className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#003450] transition hover:brightness-95"
						style={{ background: BLUE }}
					>
						<Icon icon="lucide:plus" width={14} />{" "}
						{addLabel ?? t("examination.detail.add", "Add")}
					</button>
				)}
			</div>
			<div className="flex flex-col gap-3">
				{children}
				{empty && <p className="text-sm text-smile-description">{empty}</p>}
			</div>
		</div>
	);
}
function InlinePanel({
	title,
	submitLabel,
	submitting,
	error,
	onCancel,
	onSubmit,
	children,
}: {
	title: string;
	submitLabel: string;
	submitting?: boolean;
	error?: string;
	onCancel: () => void;
	onSubmit: (event: React.FormEvent) => void;
	children: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<form
			onSubmit={onSubmit}
			className={`flex flex-col gap-3 rounded-2xl p-4 ${panelBase}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-sm font-semibold text-smile-title">{title}</h3>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onCancel}
						className={`rounded-full px-4 py-2 text-xs font-semibold ${ghostButton}`}
					>
						{t("examination.detail.cancel", "Cancel")}
					</button>
					<button
						type="submit"
						disabled={submitting}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
					>
						{submitting && (
							<Icon icon="line-md:loading-twotone-loop" width={14} />
						)}
						{submitLabel}
					</button>
				</div>
			</div>
			{error && (
				<div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
					<Icon icon="lucide:alert-circle" width={15} /> {error}
				</div>
			)}
			{children}
		</form>
	);
}
function InlineField({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-[10px] font-bold uppercase tracking-[1.5px] text-smile-description">
				{label}
			</span>
			{children}
		</label>
	);
}

function Row({
	title,
	badge,
	subtitle,
	description,
	onEdit,
	onDelete,
}: {
	title: string;
	badge?: string;
	subtitle?: string;
	description?: string;
	onEdit?: () => void;
	onDelete?: () => void;
}) {
	return (
		<div
			className={`group flex items-start justify-between gap-3 rounded-xl p-4 ${panelBase}`}
		>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-smile-title">
						{title}
					</span>
					{badge && (
						<span className="rounded-full [background:var(--surface-input-bg)] px-2 py-0.5 text-[11px] capitalize text-smile-description">
							{badge}
						</span>
					)}
				</div>
				{subtitle && (
					<span className="text-xs text-smile-description">{subtitle}</span>
				)}
				{description && (
					<span className="text-xs text-smile-description">{description}</span>
				)}
			</div>
			{(onEdit || onDelete) && (
				<RowActions onEdit={onEdit} onDelete={onDelete} />
			)}
		</div>
	);
}

function ClinicalAlertCard({ alert }: { alert: ClinicalAlert }) {
	const toneClass: Record<ClinicalAlert["tone"], string> = {
		critical: "border-red-300/30 bg-red-500/10 text-red-100",
		warning: "border-amber-300/30 bg-amber-500/10 text-amber-100",
		info: "border-[#92CDFD]/30 bg-[#92CDFD]/10 text-[#EAF6FF]",
		neutral:
			"[border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] text-smile-description",
	};
	const icon: Record<ClinicalAlert["tone"], string> = {
		critical: "lucide:triangle-alert",
		warning: "lucide:shield-alert",
		info: "lucide:info",
		neutral: "lucide:circle-check",
	};

	return (
		<div
			className={`flex gap-3 rounded-xl border p-4 ${toneClass[alert.tone]}`}
		>
			<Icon icon={icon[alert.tone]} width={18} className="mt-0.5 shrink-0" />
			<div className="flex min-w-0 flex-col gap-1">
				<span className="text-xs font-semibold uppercase tracking-[1px]">
					{alert.label}
				</span>
				<span className="break-words text-sm leading-5">{alert.value}</span>
			</div>
		</div>
	);
}

function RowActions({
	onEdit,
	onDelete,
}: { onEdit?: () => void; onDelete?: () => void }) {
	return (
		<div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
			{onEdit && (
				<button
					onClick={onEdit}
					className="rounded p-1 text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:pencil" width={14} />
				</button>
			)}
			{onDelete && (
				<button
					onClick={onDelete}
					className="rounded p-1 text-red-300 transition hover:text-red-200"
				>
					<Icon icon="lucide:trash-2" width={14} />
				</button>
			)}
		</div>
	);
}
