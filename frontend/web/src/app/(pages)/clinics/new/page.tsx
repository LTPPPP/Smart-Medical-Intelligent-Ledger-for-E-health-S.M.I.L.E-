"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";

import {
	ClinicFormDark,
	type ClinicFormValues,
} from "@/features/clinic/components/ClinicFormDark";
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
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (values: ClinicFormValues) =>
			apiClient.post(API_ENDPOINTS.CLINIC.CREATE, values),
		onSuccess: () => {
			toast.success("Clinic created");
			router.push(ROUTES.CLINICS);
		},
		onError: (e) => toast.apiError(e, "Failed to create clinic"),
	});

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
				<button
					onClick={() => router.push(ROUTES.CLINICS)}
					className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="lucide:arrow-left" width={16} /> Back to clinics
				</button>

				<div className="flex flex-col gap-1">
					<h1 className="text-[1.75rem] font-bold tracking-[-0.6px] text-smile-title font-poppins">
						New Clinic
					</h1>
					<p className="text-sm text-smile-description">
						Add a new clinic location to the network.
					</p>
				</div>

				<div className={`${cardBase} p-6`} style={cardStyle}>
					<ClinicFormDark
						submitLabel="Create clinic"
						submitting={isPending}
						onSubmit={(v) => mutateAsync(v)}
						onCancel={() => router.push(ROUTES.CLINICS)}
					/>
				</div>
			</div>
		</AppShell>
	);
}
