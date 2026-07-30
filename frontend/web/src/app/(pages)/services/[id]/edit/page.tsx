"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { ServiceForm } from "@/features/service/components/ServiceForm";
import {
	useServiceById,
	useUpdateService,
} from "@/features/service/hooks/useService";
import type { UpdateServiceRequest } from "@/features/service/types/service.type";

export default function EditServicePage() {
	const { t } = useTranslation();
	const router = useRouter();
	const params = useParams();
	const serviceId = params.id as string;

	const { user } = useAuthStore();
	const isAdmin = user?.roles?.includes("ROLE_ADMIN");

	const { data: service, isLoading } = useServiceById(serviceId);
	const updateService = useUpdateService();

	// Redirect if not admin
	useEffect(() => {
		if (!isAdmin) {
			router.push("/services");
		}
	}, [isAdmin, router]);

	const handleSubmit = async (data: UpdateServiceRequest) => {
		try {
			await updateService.mutateAsync({ serviceId, data });
			router.push("/services");
		} catch (error) {
			console.error("Failed to update service:", error);
		}
	};

	const handleCancel = () => {
		router.back();
	};

	if (!isAdmin) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<Icon
					icon="mdi:loading"
					className="animate-spin text-5xl text-blue-600"
				/>
			</div>
		);
	}

	if (!service) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<Icon
						icon="mdi:alert-circle"
						className="mx-auto text-6xl text-red-600"
					/>
					<h2 className="mt-4 text-2xl font-bold text-gray-900">
						{t("clinic.service.notFound", "Service not found")}
					</h2>
					<button
						onClick={() => router.push("/services")}
						className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
					>
						{t("clinic.service.backToServices", "Back to Services")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="container mx-auto max-w-3xl px-4">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={() => router.back()}
						className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
					>
						<Icon icon="mdi:arrow-left" className="text-xl" />
						{t("common.back", "Back")}
					</button>
					<h1 className="text-3xl font-bold text-gray-900">
						{t("clinic.service.editService", "Edit Service")}
					</h1>
					<p className="mt-2 text-gray-600">
						{t("clinic.service.updateServicePrefix", "Update service")}:{" "}
						{service.serviceName}
					</p>
				</div>

				{/* Form */}
				<div className="rounded-lg border bg-white p-8 shadow-sm">
					<ServiceForm
						service={service}
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isPending={updateService.isPending}
					/>
				</div>
			</div>
		</div>
	);
}
