"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	ScheduleForm,
	type ScheduleFormValues,
} from "@/features/schedule/components/ScheduleForm";
import { unwrapOne } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

export default function EditWorkSchedulePage() {
	const { scheduleId } = useParams<{ scheduleId: string }>();
	const router = useRouter();
	const qc = useQueryClient();
	const { user } = useAuthStore();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["doctor-schedule", scheduleId],
		queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.DETAIL(scheduleId)),
		enabled: !!scheduleId,
	});
	const schedule = useMemo(
		() => unwrapOne<Record<string, string>>(data),
		[data],
	);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (v: ScheduleFormValues) =>
			apiClient.patch(API_ENDPOINTS.SCHEDULE.UPDATE(scheduleId), {
				shift_id: v.shift_id || undefined,
				room_id: v.room_id || undefined,
				max_patients: v.max_patients,
				status: v.status,
				notes: v.notes,
				changed_by: user?.userId,
			}),
		onSuccess: () => {
			toast.success(
				t("schedule.form.updatedToast", "Schedule updated — doctor notified"),
			);
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
			qc.invalidateQueries({ queryKey: ["doctor-schedule", scheduleId] });
			router.push(ROUTES.DOCTOR_SCHEDULES);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("schedule.form.updateFailedToast", "Failed to update schedule"),
			),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push(ROUTES.DOCTOR_SCHEDULES)}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} />{" "}
					{t("schedule.form.backToSchedules", "Back to schedules")}
				</button>
				<div className="flex flex-col gap-1">
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-title">
						{t("schedule.form.editTitle", "Update Work / On-Call Schedule")}
					</h1>
					<p className="text-sm text-smile-description">
						{t(
							"schedule.form.editDesc",
							"Doctor, clinic and date are fixed; update shift, capacity, status or notes.",
						)}
					</p>
				</div>
				<div className={`${cardBase} p-6`}>
					{isLoading || !schedule ? (
						<div className="flex items-center justify-center gap-2 py-10 text-smile-description">
							<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
							{t("schedule.form.loading", "Loading…")}
						</div>
					) : (
						<ScheduleForm
							mode="edit"
							submitLabel={t("schedule.form.editSubmit", "Save changes")}
							submitting={isPending}
							initial={{
								doctor_id: schedule.doctor_id,
								clinic_id: schedule.clinic_id,
								work_date: schedule.work_date,
								shift_id: schedule.shift_id ?? "",
								room_id: schedule.room_id ?? "",
								max_patients: schedule.max_patients
									? Number(schedule.max_patients)
									: 20,
								status: schedule.status ?? "scheduled",
								notes: schedule.notes ?? "",
							}}
							onSubmit={(v) => mutateAsync(v)}
							onCancel={() => router.push(ROUTES.DOCTOR_SCHEDULES)}
						/>
					)}
				</div>
			</div>
		</AppShell>
	);
}
