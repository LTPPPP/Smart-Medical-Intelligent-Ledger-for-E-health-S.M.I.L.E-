"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import {
	WorkShiftModal,
	type WorkShiftFormValues,
} from "@/features/schedule/components/WorkShiftModal";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

// API shape is snake_case; Postgres `time` columns come back as 'HH:mm:ss'.
interface WorkShift {
	shift_id: string;
	shift_name: string;
	start_time?: string;
	end_time?: string;
	description?: string | null;
}

// Shared with the shift dropdown in ScheduleForm — invalidating here refreshes it too.
const SHIFT_KEY = ["work-shifts", "list"] as const;

const hhmm = (t?: string) => t?.slice(0, 5) ?? "—";

export default function WorkShiftsPage() {
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<WorkShift | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: SHIFT_KEY,
		queryFn: () => apiClient.get(API_ENDPOINTS.WORK_SHIFT.LIST),
	});
	const shifts = useMemo(() => unwrapArr<WorkShift>(data), [data]);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: SHIFT_KEY });

	const createMutation = useMutation({
		mutationFn: (values: WorkShiftFormValues) =>
			apiClient.post(API_ENDPOINTS.WORK_SHIFT.CREATE, values),
		onSuccess: () => {
			toast.success(t("schedule.shifts.createdToast", "Work shift created"));
			invalidate();
			closeModal();
		},
		onError: (err) =>
			toast.apiError(err, t("schedule.shifts.createFailedToast", "Failed to create work shift")),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, values }: { id: string; values: WorkShiftFormValues }) =>
			apiClient.patch(API_ENDPOINTS.WORK_SHIFT.UPDATE(id), values),
		onSuccess: () => {
			toast.success(t("schedule.shifts.updatedToast", "Work shift updated"));
			invalidate();
			closeModal();
		},
		onError: (err) =>
			toast.apiError(err, t("schedule.shifts.updateFailedToast", "Failed to update work shift")),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			apiClient.delete(API_ENDPOINTS.WORK_SHIFT.DELETE(id)),
		onSuccess: () => {
			toast.success(t("schedule.shifts.deletedToast", "Work shift deleted"));
			invalidate();
			setDeletingId(null);
		},
		onError: (err) => {
			toast.apiError(err, t("schedule.shifts.deleteFailedToast", "Failed to delete work shift"));
			setDeletingId(null);
		},
	});

	const openCreate = () => {
		setEditing(null);
		setModalOpen(true);
	};
	const openEdit = (s: WorkShift) => {
		setEditing(s);
		setModalOpen(true);
	};
	const closeModal = () => {
		setModalOpen(false);
		setEditing(null);
	};

	const handleSubmit = (values: WorkShiftFormValues) => {
		if (editing) updateMutation.mutate({ id: editing.shift_id, values });
		else createMutation.mutate(values);
	};

	const handleDelete = (s: WorkShift) => {
		if (
			window.confirm(
				`${t("schedule.shifts.confirmDeletePrefix", 'Delete work shift "')}${s.shift_name}${t("schedule.shifts.confirmDeleteSuffix", '"? This cannot be undone.')}`,
			)
		) {
			setDeletingId(s.shift_id);
			deleteMutation.mutate(s.shift_id);
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
							{t("schedule.shifts.title", "Work Shifts")}
						</h1>
						<p className="text-sm text-smile-description">
							{shifts.length}{" "}
							{shifts.length === 1
								? t("schedule.shifts.shiftSingular", "shift")
								: t("schedule.shifts.shiftPlural", "shifts")}
						</p>
					</div>
					<button
						onClick={openCreate}
						className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
					>
						<Icon icon="lucide:plus" width={16} /> {t("schedule.shifts.addShift", "Add Shift")}
					</button>
				</div>

				{isLoading && (
					<div
						className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}
					>
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("schedule.shifts.loading", "Loading work shifts…")}
					</div>
				)}

				{isError && !isLoading && (
					<div
						className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}
					>
						{t("schedule.shifts.failedToLoad", "Failed to load work shifts.")}{" "}
						<button
							onClick={() => refetch()}
							className="font-semibold underline"
						>
							{t("common.retry", "Retry")}
						</button>
					</div>
				)}

				{!isLoading && !isError && shifts.length === 0 && (
					<div
						className={`${cardBase} p-10 text-center text-sm text-smile-description`}
					>
						{t("schedule.shifts.empty", "No work shifts found.")}
					</div>
				)}

				{/* Grid */}
				{!isLoading && !isError && shifts.length > 0 && (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{shifts.map((s) => {
							const isDeleting =
								deletingId === s.shift_id && deleteMutation.isPending;
							return (
								<div
									key={s.shift_id}
									className={`${cardBase} flex flex-col gap-4 p-6`}
								>
									<div className="flex items-start gap-4">
										<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
											<Icon
												icon="lucide:calendar-clock"
												width={22}
												className="text-smile-primary"
											/>
										</span>
										<div className="flex flex-1 flex-col gap-1">
											<h3 className="text-[18px] font-semibold text-smile-title font-poppins">
												{s.shift_name}
											</h3>
											<span className="w-fit rounded-full border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-2.5 py-0.5 font-mono text-xs font-semibold text-smile-primary">
												{hhmm(s.start_time)} – {hhmm(s.end_time)}
											</span>
										</div>
									</div>

									<p className="min-h-[40px] text-sm text-smile-description">
										{s.description || t("schedule.shifts.noDescription", "No description provided.")}
									</p>

									<div className="flex items-center justify-end gap-2 border-t [border-color:var(--surface-panel-border)] pt-4">
										<button
											onClick={() => openEdit(s)}
											className="flex items-center gap-1 rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
										>
											<Icon icon="lucide:pencil" width={13} /> {t("schedule.shifts.edit", "Edit")}
										</button>
										<button
											onClick={() => handleDelete(s)}
											disabled={isDeleting}
											className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-300 transition hover:border-red-400/40 disabled:opacity-50"
										>
											{isDeleting ? (
												<Icon icon="line-md:loading-twotone-loop" width={13} />
											) : (
												<Icon icon="lucide:trash-2" width={13} />
											)}{" "}
											{t("schedule.shifts.delete", "Delete")}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{modalOpen && (
				<WorkShiftModal
					title={
						editing
							? t("schedule.shifts.editModalTitle", "Edit Work Shift")
							: t("schedule.shifts.addModalTitle", "Add Work Shift")
					}
					submitting={createMutation.isPending || updateMutation.isPending}
					initial={
						editing
							? {
									shift_name: editing.shift_name,
									start_time: editing.start_time?.slice(0, 5) ?? "",
									end_time: editing.end_time?.slice(0, 5) ?? "",
									description: editing.description ?? "",
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
