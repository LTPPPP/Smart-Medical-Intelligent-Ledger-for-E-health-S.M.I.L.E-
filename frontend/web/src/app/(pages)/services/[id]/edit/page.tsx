"use client";

import { useParams, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import {
	cardBase,
	ErrorBlock,
	LoadingBlock,
	PageHeader,
} from "@/features/reports/components/ReportPrimitives";
import { ServiceForm } from "@/features/service/components/ServiceForm";
import {
	useServiceById,
	useUpdateService,
} from "@/features/service/hooks/useService";
import { SERVICE_MANAGEMENT_ROLES } from "@/features/service/serviceAccess";
import type {
	CreateServiceRequest,
	UpdateServiceRequest,
} from "@/features/service/types/service.type";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

function EditServiceContent() {
	const router = useRouter();
	const params = useParams();
	const serviceId = String(params.id);
	const {
		data: service,
		isLoading,
		isError,
		refetch,
	} = useServiceById(serviceId);
	const updateService = useUpdateService();

	const handleSubmit = async (
		data: CreateServiceRequest | UpdateServiceRequest,
	) => {
		try {
			await updateService.mutateAsync({
				serviceId,
				data: data as UpdateServiceRequest,
			});
			toast.success("Service updated");
			router.push(ROUTES.SERVICES);
		} catch (error) {
			toast.apiError(error, "Failed to update service");
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<PageHeader
					eyebrow="Clinical Catalog"
					title="Edit Service"
					subtitle={
						service
							? `Update ${service.serviceName}.`
							: "Update treatment details and availability."
					}
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

				{isLoading ? (
					<div className={cardBase}>
						<LoadingBlock label="Loading service…" />
					</div>
				) : isError ? (
					<ErrorBlock
						label="Failed to load this service."
						onRetry={() => refetch()}
					/>
				) : !service ? (
					<ErrorBlock
						label="Service not found."
						onRetry={() => router.push(ROUTES.SERVICES)}
					/>
				) : (
					<section className={`${cardBase} p-6 sm:p-8`}>
						<ServiceForm
							service={service}
							onSubmit={handleSubmit}
							onCancel={() => router.push(ROUTES.SERVICES)}
							isPending={updateService.isPending}
						/>
					</section>
				)}
			</div>
		</AppShell>
	);
}

export default function EditServicePage() {
	return (
		<ProtectedRoute requiredRoles={SERVICE_MANAGEMENT_ROLES}>
			<EditServiceContent />
		</ProtectedRoute>
	);
}
