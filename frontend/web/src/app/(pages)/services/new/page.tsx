"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import {
	cardBase,
	PageHeader,
} from "@/features/reports/components/ReportPrimitives";
import { ServiceForm } from "@/features/service/components/ServiceForm";
import { useCreateService } from "@/features/service/hooks/useService";
import { SERVICE_MANAGEMENT_ROLES } from "@/features/service/serviceAccess";
import type {
	CreateServiceRequest,
	UpdateServiceRequest,
} from "@/features/service/types/service.type";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

function NewServiceContent() {
	const router = useRouter();
	const createService = useCreateService();

	const handleSubmit = async (
		data: CreateServiceRequest | UpdateServiceRequest,
	) => {
		try {
			await createService.mutateAsync(data as CreateServiceRequest);
			toast.success("Service created");
			router.push(ROUTES.SERVICES);
		} catch (error) {
			toast.apiError(error, "Failed to create service");
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<PageHeader
					eyebrow="Clinical Catalog"
					title="Add Service"
					subtitle="Create a treatment with its clinical room, duration, and price."
					icon="mdi:tooth-outline"
					right={
						<button
							type="button"
							onClick={() => router.push(ROUTES.SERVICES)}
							className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						>
							<Icon icon="mdi:arrow-left" width={18} />
							Back to Services
						</button>
					}
				/>

				<section className={`${cardBase} p-6 sm:p-8`}>
					<ServiceForm
						onSubmit={handleSubmit}
						onCancel={() => router.push(ROUTES.SERVICES)}
						isPending={createService.isPending}
					/>
				</section>
			</div>
		</AppShell>
	);
}

export default function NewServicePage() {
	return (
		<ProtectedRoute requiredRoles={SERVICE_MANAGEMENT_ROLES}>
			<NewServiceContent />
		</ProtectedRoute>
	);
}
