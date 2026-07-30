"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import {
	cardBase,
	EmptyBlock,
	ErrorBlock,
	LoadingBlock,
	PageHeader,
} from "@/features/reports/components/ReportPrimitives";
import { ServiceCard } from "@/features/service/components/ServiceCard";
import { ServiceFilters } from "@/features/service/components/ServiceFilters";
import {
	useDeleteService,
	useServices,
	useSpecialties,
} from "@/features/service/hooks/useService";
import { canManageServices } from "@/features/service/serviceAccess";
import type {
	Service,
	ServiceListParams,
} from "@/features/service/types/service.type";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

type FilterValue = string | number | boolean | undefined;

export default function ServicesPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const { user } = useAuthStore();
	const canManage = canManageServices(user?.roles);

	const [filters, setFilters] = useState<ServiceListParams>({
		page: 0,
		size: 12,
	});
	const [selectedSpecialty, setSelectedSpecialty] = useState<
		string | undefined
	>();
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const {
		data: servicesData,
		isLoading: isLoadingServices,
		isError: isServicesError,
		refetch: refetchServices,
	} = useServices(filters);
	const {
		data: specialties,
		isLoading: isLoadingSpecialties,
		isError: isSpecialtiesError,
		refetch: refetchSpecialties,
	} = useSpecialties({ isActive: true });
	const deleteService = useDeleteService();

	const services = servicesData?.content ?? [];
	const totalPages = servicesData?.totalPages ?? 0;
	const currentPage = filters.page ?? 0;

	const handleFilterChange = (key: string, value: FilterValue) => {
		setFilters((previous) => ({
			...previous,
			[key]: value,
			page: 0,
		}));
	};

	const handleResetFilters = () => {
		setFilters({ page: 0, size: 12 });
		setSelectedSpecialty(undefined);
	};

	const handleSpecialtySelect = (specialtyId?: string) => {
		setSelectedSpecialty(specialtyId);
		setFilters((previous) => {
			const next = { ...previous, page: 0 };
			delete next.specialtyId;
			delete next.specialty_id;
			if (specialtyId) next.specialtyId = specialtyId;
			return next;
		});
	};

	const handleDeleteService = async (service: Service) => {
		if (
			!window.confirm(
				`${t("clinic.service.confirmDeletePrefix", "Delete service")} "${service.serviceName}"? ${t("clinic.specialty.confirmDeleteSuffix", "This cannot be undone.")}`,
			)
		) {
			return;
		}

		setDeletingId(service.serviceId);
		try {
			await deleteService.mutateAsync(service.serviceId);
			toast.success(t("clinic.service.deleted", "Service deleted"));
		} catch (error) {
			toast.apiError(
				error,
				t("clinic.service.deleteFailed", "Failed to delete service"),
			);
		} finally {
			setDeletingId(null);
		}
	};

	const handlePageChange = (page: number) => {
		setFilters((previous) => ({ ...previous, page }));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<PageHeader
					eyebrow={t("clinic.service.clinicalCatalog", "Clinical Catalog")}
					title={t("clinic.service.pageTitle", "Dental Services")}
					subtitle={t(
						"clinic.service.pageDescription",
						"Browse treatments, room requirements, duration, and pricing.",
					)}
					icon="mdi:tooth-outline"
					right={
						canManage ? (
							<button
								type="button"
								onClick={() => router.push(ROUTES.SERVICE_NEW)}
								className="inline-flex min-h-11 items-center gap-2 rounded-full bg-smile-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-smile-primary-dark"
							>
								<Icon icon="mdi:plus" width={18} />
								{t("clinic.service.addService", "Add Service")}
							</button>
						) : undefined
					}
				/>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
					<aside className="space-y-4">
						<section className={`${cardBase} p-5`}>
							<div className="mb-4 flex items-center justify-between gap-2">
								<h2 className="font-poppins text-base font-semibold text-smile-title">
									{t("nav.specialties", "Specialties")}
								</h2>
								<Icon
									icon="mdi:medical-bag"
									width={18}
									className="text-smile-description"
								/>
							</div>

							{isLoadingSpecialties ? (
								<LoadingBlock
									label={t(
										"clinic.specialty.loading",
										"Loading specialties…",
									)}
								/>
							) : isSpecialtiesError ? (
								<div className="py-4 text-sm text-red-600 dark:text-red-300">
									{t(
										"clinic.specialty.loadFailed",
										"Failed to load specialties.",
									)}{" "}
									<button
										type="button"
										onClick={() => refetchSpecialties()}
										className="font-semibold underline"
									>
										{t("common.retry", "Retry")}
									</button>
								</div>
							) : (
								<div className="space-y-2">
									<button
										type="button"
										onClick={() => handleSpecialtySelect()}
										className={`min-h-11 w-full rounded-xl border px-3 text-left text-sm font-semibold transition ${
											!selectedSpecialty
												? "border-smile-primary/40 bg-smile-primary-light text-smile-primary-dark"
												: "text-smile-title hover:border-smile-primary/30"
										} [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]`}
									>
										{t("clinic.service.allServices", "All Services")}
									</button>
									{specialties?.map((specialty) => (
										<button
											type="button"
											key={specialty.specialtyId}
											onClick={() =>
												handleSpecialtySelect(specialty.specialtyId)
											}
											className={`min-h-11 w-full rounded-xl border px-3 text-left text-sm font-semibold transition ${
												selectedSpecialty === specialty.specialtyId
													? "border-smile-primary/40 bg-smile-primary-light text-smile-primary-dark"
													: "text-smile-title hover:border-smile-primary/30"
											} [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]`}
										>
											{specialty.specialtyName}
										</button>
									))}
								</div>
							)}
						</section>

						<ServiceFilters
							filters={filters}
							onFilterChange={handleFilterChange}
							onReset={handleResetFilters}
						/>
					</aside>

					<main className="min-w-0">
						{isLoadingServices ? (
							<div className={cardBase}>
								<LoadingBlock
									label={t("clinic.service.loadingServices", "Loading services…")}
								/>
							</div>
						) : isServicesError ? (
							<ErrorBlock
								label={t(
									"clinic.service.loadServicesFailed",
									"Failed to load dental services.",
								)}
								onRetry={() => refetchServices()}
							/>
						) : services.length === 0 ? (
							<div className={cardBase}>
								<EmptyBlock
									label={t(
										"clinic.service.noServicesMatch",
										"No services match the current filters.",
									)}
								/>
							</div>
						) : (
							<div className="space-y-5">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm text-smile-description">
										{t("common.showing", "Showing")}{" "}
										<span className="font-semibold text-smile-title">
											{services.length}
										</span>{" "}
										{t("common.of", "of")} {servicesData?.totalElements ?? 0}{" "}
										{t("clinic.service.servicesLabel", "services")}
									</p>
									<button
										type="button"
										onClick={() => refetchServices()}
										className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
									>
										<Icon icon="mdi:refresh" width={17} />
										{t("common.refresh", "Refresh")}
									</button>
								</div>

								<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
									{services.map((service) => (
										<ServiceCard
											key={service.serviceId}
											service={service}
											onEdit={
												canManage
													? () =>
															router.push(
																ROUTES.SERVICE_EDIT(service.serviceId),
															)
													: undefined
											}
											onDelete={
												canManage
													? () => handleDeleteService(service)
													: undefined
											}
											canManage={canManage}
											isDeleting={
												deletingId === service.serviceId &&
												deleteService.isPending
											}
										/>
									))}
								</div>

								{totalPages > 1 && (
									<nav
										aria-label={t(
											"clinic.service.pagesAriaLabel",
											"Service pages",
										)}
										className="flex items-center justify-center gap-3"
									>
										<button
											type="button"
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 0}
											className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
										>
											<Icon icon="mdi:chevron-left" width={18} />
											{t("common.previous", "Previous")}
										</button>
										<span className="text-sm text-smile-description">
											{t("common.pageLabel", "Page")} {currentPage + 1}{" "}
											{t("common.of", "of")} {totalPages}
										</span>
										<button
											type="button"
											onClick={() => handlePageChange(currentPage + 1)}
											disabled={currentPage >= totalPages - 1}
											className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-40 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
										>
											{t("common.next", "Next")}
											<Icon icon="mdi:chevron-right" width={18} />
										</button>
									</nav>
								)}
							</div>
						)}
					</main>
				</div>
			</div>
		</AppShell>
	);
}
