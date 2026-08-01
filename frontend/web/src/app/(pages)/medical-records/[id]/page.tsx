"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";

const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)] print:border-gray-300 print:bg-white print:shadow-none";

interface MedicalRecord {
	record_id: string;
	clinic_id: string;
	doctor_id: string;
	visit_date: string;
	chief_complaint?: string | null;
	diagnosis?: string | null;
	treatment_plan?: string | null;
	notes?: string | null;
}
interface Clinic {
	clinic_id: string;
	clinic_name: string;
}
interface UserProfile {
	full_name?: string;
}
interface PrescriptionItem {
	item_id: string;
	medication_name: string;
	dosage: string;
	frequency: string;
	duration_days?: number | null;
	instructions?: string | null;
}
interface Prescription {
	prescription_id: string;
	record_id?: string | null;
	prescription_date: string;
	status: string;
	notes?: string | null;
	items: PrescriptionItem[];
}

function unwrapOne<T>(res: unknown): T | null {
	const payload = (res as { data?: unknown })?.data;
	if (payload && typeof payload === "object" && "data" in (payload as object))
		return (payload as { data: T }).data;
	return (payload as T) ?? null;
}
function unwrapArr<T>(res: unknown): T[] {
	const payload = (res as { data?: unknown })?.data;
	if (Array.isArray(payload)) return payload as T[];
	const inner = (payload as { data?: unknown })?.data;
	return Array.isArray(inner) ? (inner as T[]) : [];
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
			</span>
			<p className="whitespace-pre-wrap text-sm text-smile-title">{children}</p>
		</div>
	);
}

export default function MyMedicalRecordDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { t } = useTranslation();

	const {
		data: recordRes,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["medical-records", "me", id],
		queryFn: () => apiClient.get(API_ENDPOINTS.MEDICAL_RECORD.ME_DETAIL(id)),
		enabled: !!id,
	});
	const record = useMemo(() => unwrapOne<MedicalRecord>(recordRes), [recordRes]);

	const { data: clinicsRes } = useQuery({
		queryKey: ["clinics", "list"],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
	});
	const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
	const clinicName =
		clinics.find((c) => c.clinic_id === record?.clinic_id)?.clinic_name ?? "—";

	const { data: doctorProfileRes } = useQuery({
		queryKey: ["user-profile", record?.doctor_id],
		queryFn: () =>
			apiClient.get<UserProfile>(
				API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(record?.doctor_id ?? ""),
			),
		enabled: !!record?.doctor_id,
		staleTime: 10 * 60 * 1000,
	});
	const doctorName =
		unwrapOne<UserProfile>(doctorProfileRes)?.full_name ??
		(record?.doctor_id ? `${record.doctor_id.slice(0, 8)}` : "—");

	// Match Prescriptions Locally
	const { data: prescriptionsRes } = useQuery({
		queryKey: ["prescriptions", "me"],
		queryFn: () => apiClient.get(API_ENDPOINTS.PRESCRIPTION.ME),
	});
	const prescriptions = useMemo(
		() =>
			unwrapArr<Prescription>(prescriptionsRes).filter(
				(p) => p.record_id === id,
			),
		[prescriptionsRes, id],
	);

	if (isLoading)
		return (
			<AppShell>
				<div className={`${cardBase} mx-auto mt-10 flex w-full max-w-3xl items-center justify-center gap-2 py-16 text-smile-description`}>
					<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
					{t("medicalRecords.detail.loading", "Loading medical record…")}
				</div>
			</AppShell>
		);
	if (isError)
		return (
			<AppShell>
				<div className={`${cardBase} mx-auto mt-10 w-full max-w-3xl p-6 text-center text-sm text-red-300`}>
					{t("medicalRecords.detail.failedToLoad", "Failed to load medical record.")}{" "}
					<button onClick={() => refetch()} className="font-semibold underline">
						{t("common.retry", "Retry")}
					</button>
				</div>
			</AppShell>
		);
	if (!record)
		return (
			<AppShell>
				<div className={`${cardBase} mx-auto mt-10 w-full max-w-3xl p-10 text-center text-sm text-smile-description`}>
					{t("medicalRecords.detail.notFound", "Medical record not found.")}
				</div>
			</AppShell>
		);

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10 print:px-0 print:py-0">
				<div className="flex items-center justify-between print:hidden">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
					>
						<Icon icon="lucide:arrow-left" width={16} />{" "}
						{t("medicalRecords.detail.back", "Back to medical records")}
					</button>
					<button
						onClick={() => window.print()}
						className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
					>
						<Icon icon="lucide:download" width={15} />
						{t("medicalRecords.detail.exportPdf", "Export PDF")}
					</button>
				</div>

				<div className={`${cardBase} flex flex-col gap-5 p-6`}>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<h1 className="font-poppins text-[24px] font-bold tracking-[-0.5px] text-smile-title">
							{new Date(record.visit_date).toLocaleDateString()}
						</h1>
					</div>
					<div className="grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-2 [border-color:var(--surface-panel-border)] print:border-gray-300">
						<Row label={t("medicalRecords.detail.doctor", "Doctor")}>
							{doctorName}
						</Row>
						<Row label={t("medicalRecords.detail.clinic", "Clinic")}>
							{clinicName}
						</Row>
						<Row label={t("medicalRecords.detail.chiefComplaint", "Chief complaint")}>
							{record.chief_complaint ||
								t("medicalRecords.detail.notProvided", "Not provided")}
						</Row>
						<Row label={t("medicalRecords.detail.diagnosis", "Diagnosis")}>
							{record.diagnosis ||
								t("medicalRecords.detail.notProvided", "Not provided")}
						</Row>
						<Row label={t("medicalRecords.detail.treatmentPlan", "Treatment plan")}>
							{record.treatment_plan ||
								t("medicalRecords.detail.notProvided", "Not provided")}
						</Row>
						{record.notes && (
							<Row label={t("medicalRecords.detail.notes", "Notes")}>
								{record.notes}
							</Row>
						)}
					</div>
				</div>

				{/* Prescription */}
				<div className={`${cardBase} flex flex-col gap-4 p-6`}>
					<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[1px] text-smile-description">
						<Icon icon="lucide:pill" width={16} className="text-smile-primary" />
						{t("medicalRecords.detail.prescription", "Prescription")}
					</h2>
					{prescriptions.length === 0 ? (
						<p className="text-sm text-smile-description">
							{t(
								"medicalRecords.detail.noPrescription",
								"No medications were prescribed for this visit.",
							)}
						</p>
					) : (
						<div className="flex flex-col gap-4">
							{prescriptions.map((p) => (
								<div
									key={p.prescription_id}
									className="flex flex-col divide-y rounded-xl border [border-color:var(--surface-panel-border)] print:border-gray-300"
								>
									{p.items.map((item) => (
										<div key={item.item_id} className="flex flex-col gap-1 p-4">
											<p className="text-sm font-semibold text-smile-title">
												{item.medication_name}
											</p>
											<p className="text-xs text-smile-description">
												{item.dosage} · {item.frequency}
												{item.duration_days
													? ` · ${item.duration_days} days`
													: ""}
											</p>
											{item.instructions && (
												<p className="text-xs text-smile-description">
													{item.instructions}
												</p>
											)}
										</div>
									))}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</AppShell>
	);
}
