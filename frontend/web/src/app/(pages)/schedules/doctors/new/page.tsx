"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import {
	ScheduleForm,
	type ScheduleFormValues,
} from "@/features/schedule/components/ScheduleForm";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const cardBase =
	"rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

export default function NewWorkSchedulePage() {
	const router = useRouter();
	const qc = useQueryClient();
	const { t } = useTranslation();

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (v: ScheduleFormValues) =>
			apiClient.post(API_ENDPOINTS.SCHEDULE.CREATE, v),
		onSuccess: () => {
			toast.success(
				t(
					"schedule.form.createdToast",
					"Work schedule created — doctor notified",
				),
			);
			// Force The Calendar List To Refetch Instead Of Serving Its
			// 5-Minute-Stale Cache When The User Navigates Back.
			qc.invalidateQueries({ queryKey: ["doctor-schedules"] });
			router.push(ROUTES.DOCTOR_SCHEDULES);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("schedule.form.createFailedToast", "Failed to create schedule"),
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
						{t("schedule.form.createTitle", "Create Work / On-Call Schedule")}
					</h1>
					<p className="text-sm text-smile-description">
						{t(
							"schedule.form.createDesc",
							"Assign a doctor to a clinic shift on a given date.",
						)}
					</p>
				</div>
				<div className={`${cardBase} p-6`}>
					<ScheduleForm
						mode="create"
						submitLabel={t("schedule.form.createSubmit", "Create schedule")}
						submitting={isPending}
						onSubmit={(v) => mutateAsync(v)}
						onCancel={() => router.push(ROUTES.DOCTOR_SCHEDULES)}
					/>
				</div>
			</div>
		</AppShell>
	);
}
