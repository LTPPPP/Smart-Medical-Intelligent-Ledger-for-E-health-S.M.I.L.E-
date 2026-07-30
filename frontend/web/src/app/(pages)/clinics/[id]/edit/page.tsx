"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";

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

function unwrap<T>(res: unknown): T | null {
	const payload = (res as { data?: unknown })?.data;
	if (payload && typeof payload === "object" && "data" in (payload as object)) {
		return (payload as { data: T }).data;
	}
	return (payload as T) ?? null;
}

export default function EditClinicPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: ["clinic", id],
		queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.DETAIL(id)),
		enabled: !!id,
	});
	const clinic = useMemo(() => unwrap<Record<string, string>>(data), [data]);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (values: ClinicFormValues) =>
			apiClient.patch(API_ENDPOINTS.CLINIC.UPDATE(id), values),
		onSuccess: () => {
			toast.success(t("clinic.edit.updated", "Clinic updated"));
			router.push(ROUTES.CLINIC_DETAIL(id));
		},
		onError: (e) =>
			toast.apiError(e, t("clinic.edit.updateFailed", "Failed to update clinic")),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push(ROUTES.CLINIC_DETAIL(id))}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} /> {t("common.back", "Back")}
				</button>

				<div className="flex flex-col gap-1">
					<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-title font-poppins">
						{t("clinic.edit.title", "Edit Clinic")}
					</h1>
					<p className="text-sm text-smile-description">
						{t("clinic.edit.description", "Update clinic information.")}
					</p>
				</div>

				<div className={`${cardBase} p-6`} style={cardStyle}>
					{isLoading || !clinic ? (
						<div className="flex items-center justify-center gap-2 py-10 text-smile-description">
							<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
							{t("common.loading", "Loading…")}
						</div>
					) : (
						<ClinicFormDark
							submitLabel={t("clinic.edit.submitLabel", "Save changes")}
							submitting={isPending}
							initial={{
								clinic_name: clinic.clinic_name,
								clinic_code: clinic.clinic_code,
								address: clinic.address,
								ward: clinic.ward,
								district: clinic.district,
								city: clinic.city,
								phone: clinic.phone,
								email: clinic.email,
								website: clinic.website,
								logo_url: clinic.logo_url,
							}}
							onSubmit={(v) => mutateAsync(v)}
							onCancel={() => router.push(ROUTES.CLINIC_DETAIL(id))}
						/>
					)}
				</div>
			</div>
		</AppShell>
	);
}
