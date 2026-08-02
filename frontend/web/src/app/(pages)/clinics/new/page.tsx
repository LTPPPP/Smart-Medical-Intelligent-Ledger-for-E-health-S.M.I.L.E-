"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	ClinicFormDark,
	type ClinicFormValues,
} from "@/features/clinic/components/ClinicFormDark";
import { useTranslation } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const cardBase = "rounded-[20px] border backdrop-blur-md";
const cardStyle = {
	background: "var(--surface-card-bg)",
	borderColor: "var(--surface-card-border)",
	boxShadow: "var(--surface-card-shadow)",
};

export default function NewClinicPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (values: ClinicFormValues) =>
			apiClient.post(API_ENDPOINTS.CLINIC.CREATE, values),
		onSuccess: () => {
			toast.success(t("clinic.new.created", "Clinic created"));
			queryClient.invalidateQueries({ queryKey: ["clinics", "list"] });
			router.push(ROUTES.CLINICS);
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("clinic.new.createFailed", "Failed to create clinic"),
			),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push(ROUTES.CLINICS)}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} />{" "}
					{t("clinic.new.backToClinics", "Back to clinics")}
				</button>

				<div className="flex flex-col gap-1">
					<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-title font-poppins">
						{t("clinic.new.title", "New Clinic")}
					</h1>
					<p className="text-sm text-smile-description">
						{t(
							"clinic.new.description",
							"Add a new clinic location to the network.",
						)}
					</p>
				</div>

				<div className={`${cardBase} p-6`} style={cardStyle}>
					<ClinicFormDark
						submitLabel={t("clinic.new.submitLabel", "Create clinic")}
						submitting={isPending}
						onSubmit={(v) => mutateAsync(v)}
						onCancel={() => router.push(ROUTES.CLINICS)}
					/>
				</div>
			</div>
		</AppShell>
	);
}
