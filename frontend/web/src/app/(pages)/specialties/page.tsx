"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	SpecialtyModalDark,
	type SpecialtyFormValues,
} from "@/features/service/components/SpecialtyModalDark";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
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
	display_order?: number | null;
}

const SPECIALTY_KEY = ["specialties", "list"] as const;

export default function SpecialtiesPage() {
	const queryClient = useQueryClient();

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Specialty | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

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

	const sorted = useMemo(
		() =>
			[...specialties].sort(
				(a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
			),
		[specialties],
	);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: SPECIALTY_KEY });

	const createMutation = useMutation({
		mutationFn: (values: SpecialtyFormValues) =>
			apiClient.post(API_ENDPOINTS.SPECIALTY.CREATE, values),
		onSuccess: () => {
			toast.success("Specialty created");
			invalidate();
			closeModal();
		},
		onError: (err) => toast.apiError(err, "Failed to create specialty"),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, values }: { id: string; values: SpecialtyFormValues }) =>
			apiClient.patch(API_ENDPOINTS.SPECIALTY.UPDATE(id), values),
		onSuccess: () => {
			toast.success("Specialty updated");
			invalidate();
			closeModal();
		},
		onError: (err) => toast.apiError(err, "Failed to update specialty"),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			apiClient.delete(API_ENDPOINTS.SPECIALTY.DELETE(id)),
		onSuccess: () => {
			toast.success("Specialty deleted");
			invalidate();
			setDeletingId(null);
		},
		onError: (err) => {
			toast.apiError(err, "Failed to delete specialty");
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

	const handleDelete = (s: Specialty) => {
		if (
			window.confirm(
				`Delete specialty "${s.specialty_name}"? This cannot be undone.`,
			)
		) {
			setDeletingId(s.specialty_id);
			deleteMutation.mutate(s.specialty_id);
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[1.75rem] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							Specialties
						</h1>
						<p className="text-sm text-smile-description">
							{specialties.length} specialt
							{specialties.length === 1 ? "y" : "ies"}
						</p>
					</div>
					<button
						onClick={openCreate}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
					>
						<Icon icon="lucide:plus" width={16} /> Add Specialty
					</button>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} /> Loading
						specialties…
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}
					>
						Failed to load specialties.{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							Retry
						</button>
					</div>
				)}

				{!isLoading && !isError && sorted.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						No specialties found.
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
											<h3 className="text-[1.125rem] font-semibold text-smile-title font-poppins">
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
									<p className="min-h-[2.5rem] text-sm text-smile-description">
										{s.description || "No description provided."}
									</p>

									{/* Footer */}
									<div className="flex items-center justify-between border-t [border-color:var(--surface-panel-border)] pt-4">
										<span className="text-xs text-smile-description">
											Display order: {s.display_order ?? "—"}
										</span>
										<div className="flex items-center gap-2">
											<button
												onClick={() => openEdit(s)}
												className="flex items-center gap-1 rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
											>
												<Icon icon="lucide:pencil" width={13} /> Edit
											</button>
											<button
												onClick={() => handleDelete(s)}
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
												Delete
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{modalOpen && (
				<SpecialtyModalDark
					title={editing ? "Edit Specialty" : "Add Specialty"}
					submitting={createMutation.isPending || updateMutation.isPending}
					initial={
						editing
							? {
									specialty_name: editing.specialty_name,
									specialty_code: editing.specialty_code,
									description: editing.description ?? "",
									display_order: editing.display_order ?? null,
									is_active: editing.is_active,
								}
							: undefined
					}
					onSubmit={handleSubmit}
					onClose={closeModal}
				/>
			)}
		</AppShell>
	);
}
