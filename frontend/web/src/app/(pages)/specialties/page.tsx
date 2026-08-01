"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	SpecialtyModalDark,
	type SpecialtyFormValues,
} from "@/features/service/components/SpecialtyModalDark";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { CLINIC_MANAGEMENT_ROLES } from "@/shared/constants/roles";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

interface Specialty {
	specialty_id: string;
	specialty_name: string;
	specialty_code: string;
	description?: string | null;
	icon_url?: string | null;
	is_active: boolean;
	clinic_ids?: string[];
}

const SPECIALTY_KEY = ["specialties", "list"] as const;

export default function SpecialtiesPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const canManageSpecialties = (user?.roles ?? []).some((role) =>
		(CLINIC_MANAGEMENT_ROLES as string[]).includes(role),
	);

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Specialty | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: SPECIALTY_KEY,
		queryFn: () =>
			apiClient.get<{ data?: Specialty[] } | Specialty[]>(
				API_ENDPOINTS.SPECIALTY.LIST,
			),
	});

	const specialties = useMemo<Specialty[]>(() => {
		const payload = (data as { data?: unknown } | undefined)?.data;
		if (Array.isArray(payload)) return payload as Specialty[];
		const inner = (payload as { data?: unknown })?.data;
		return Array.isArray(inner) ? (inner as Specialty[]) : [];
	}, [data]);

	// Newest first
	const sorted = specialties;

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: SPECIALTY_KEY });

	const createMutation = useMutation({
		mutationFn: (values: SpecialtyFormValues) =>
			apiClient.post(API_ENDPOINTS.SPECIALTY.CREATE, values),
		onSuccess: () => {
			toast.success(t("clinic.specialty.created", "Specialty created"));
			invalidate();
			closeModal();
		},
		onError: (err) =>
			toast.apiError(
				err,
				t("clinic.specialty.createFailed", "Failed to create specialty"),
			),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, values }: { id: string; values: SpecialtyFormValues }) =>
			apiClient.patch(API_ENDPOINTS.SPECIALTY.UPDATE(id), values),
		onSuccess: () => {
			toast.success(t("clinic.specialty.updated", "Specialty updated"));
			invalidate();
			closeModal();
		},
		onError: (err) =>
			toast.apiError(
				err,
				t("clinic.specialty.updateFailed", "Failed to update specialty"),
			),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			apiClient.delete(API_ENDPOINTS.SPECIALTY.DELETE(id)),
		onSuccess: () => {
			toast.success(t("clinic.specialty.deleted", "Specialty deleted"));
			invalidate();
			setDeletingId(null);
			setDeleteTarget(null);
		},
		onError: (err) => {
			toast.apiError(
				err,
				t("clinic.specialty.deleteFailed", "Failed to delete specialty"),
			);
			setDeletingId(null);
		},
	});

	const openCreate = () => {
		setEditing(null);
		setModalOpen(true);
	};
	const openEdit = (s: Specialty) => {
		setEditing(s);
		setModalOpen(true);
	};
	const closeModal = () => {
		setModalOpen(false);
		setEditing(null);
	};

	const handleSubmit = (values: SpecialtyFormValues) => {
		if (editing) updateMutation.mutate({ id: editing.specialty_id, values });
		else createMutation.mutate(values);
	};

	const handleDelete = () => {
		if (!deleteTarget) return;
		setDeletingId(deleteTarget.specialty_id);
		deleteMutation.mutate(deleteTarget.specialty_id);
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							{t("nav.specialties", "Specialties")}
						</h1>
						<p className="text-sm text-smile-description">
							{specialties.length}{" "}
							{t("clinic.specialty.specialtiesLabel", "specialties")}
						</p>
					</div>
					{canManageSpecialties && (
						<button
							onClick={openCreate}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
						>
							<Icon icon="lucide:plus" width={16} />{" "}
							{t("clinic.specialty.addSpecialty", "Add Specialty")}
						</button>
					)}
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("clinic.specialty.loading", "Loading specialties…")}
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} border-destructive/40 !bg-destructive/10 p-6 text-center text-sm text-destructive`}
					>
						{t("clinic.specialty.loadFailed", "Failed to load specialties.")}{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}

				{!isLoading && !isError && sorted.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t("clinic.specialty.empty", "No specialties found.")}
					</div>
				)}

				{/* Grid */}
				{!isLoading && !isError && sorted.length > 0 && (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{sorted.map((s) => {
							const isDeleting =
								deletingId === s.specialty_id && deleteMutation.isPending;
							return (
								<div
									key={s.specialty_id}
									className={`${cardBase} flex flex-col gap-4 p-6`}
								>
									{/* Top */}
									<div className="flex items-start gap-4">
										<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
											<Icon
												icon="lucide:stethoscope"
												width={22}
												className="text-smile-primary"
											/>
										</span>
										<div className="flex flex-1 flex-col gap-1">
											<h3 className="text-[18px] font-semibold text-smile-title font-poppins">
												{s.specialty_name}
											</h3>
											<div className="flex flex-wrap items-center gap-2">
												<span className="rounded-full border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-2.5 py-0.5 font-mono text-xs font-semibold text-smile-primary">
													{s.specialty_code}
												</span>
												<span
													className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${s.is_active ? "border-smile-primary/30 bg-smile-primary/15 text-smile-primary" : "border-smile-primary/15 bg-smile-primary-light/40 text-smile-description"}`}
												>
													{s.is_active ? "active" : "inactive"}
												</span>
											</div>
										</div>
									</div>

									{/* Description */}
									<p className="min-h-[40px] text-sm text-smile-description">
										{s.description ||
											t(
												"clinic.specialty.noDescription",
												"No description provided.",
											)}
									</p>

									{/* Footer */}
									<div className="flex items-center justify-between border-t [border-color:var(--surface-panel-border)] pt-4">
										<span className="text-xs text-smile-description">
											{t("clinic.specialty.offeredAt", "Offered at")}{" "}
											{s.clinic_ids?.length ?? 0}{" "}
											{t("clinic.specialty.clinicsSuffix", "clinic(s)")}
										</span>
										{canManageSpecialties && (
											<div className="flex items-center gap-2">
												<button
													onClick={() => openEdit(s)}
													className="flex items-center gap-1 rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
												>
													<Icon icon="lucide:pencil" width={13} />{" "}
													{t("common.edit", "Edit")}
												</button>
												<button
													onClick={() => setDeleteTarget(s)}
													disabled={isDeleting}
													className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-300 transition hover:border-red-400/40 disabled:opacity-50"
												>
													{isDeleting ? (
														<Icon
															icon="line-md:loading-twotone-loop"
															width={13}
														/>
													) : (
														<Icon icon="lucide:trash-2" width={13} />
													)}{" "}
													{t("common.delete", "Delete")}
												</button>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{modalOpen && (
				<SpecialtyModalDark
					title={
						editing
							? t("clinic.specialty.editSpecialty", "Edit Specialty")
							: t("clinic.specialty.addSpecialty", "Add Specialty")
					}
					submitting={createMutation.isPending || updateMutation.isPending}
					initial={
						editing
							? {
									specialty_name: editing.specialty_name,
									specialty_code: editing.specialty_code,
									description: editing.description ?? "",
									is_active: editing.is_active,
									clinic_ids: editing.clinic_ids ?? [],
								}
							: undefined
					}
					onSubmit={handleSubmit}
					onClose={closeModal}
				/>
			)}

			<ConfirmDialog
				open={deleteTarget !== null}
				title={t("clinic.specialty.confirmDeleteTitle", "Delete specialty?")}
				description={
					deleteTarget
						? `${t("clinic.specialty.confirmDeletePrefix", "Delete specialty")} "${deleteTarget.specialty_name}"? ${t("clinic.specialty.confirmDeleteSuffix", "This cannot be undone.")}`
						: ""
				}
				confirmLabel={t("common.delete", "Delete")}
				cancelLabel={t("common.cancel", "Cancel")}
				pending={deleteMutation.isPending}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={handleDelete}
			/>
		</AppShell>
	);
}
