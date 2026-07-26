"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { ServiceForm } from "@/features/service/components/ServiceForm";
import { useCreateService } from "@/features/service/hooks/useService";
import type {
	CreateServiceRequest,
	UpdateServiceRequest,
} from "@/features/service/types/service.type";
import { ROUTES } from "@/shared/constants";

export default function NewServicePage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const isAdmin = user?.roles?.includes("ROLE_ADMIN");

	const createService = useCreateService();

	// Redirect if not admin
	useEffect(() => {
		if (!isAdmin) {
			router.push(ROUTES.SERVICES);
		}
	}, [isAdmin, router]);

	const handleSubmit = async (
		data: CreateServiceRequest | UpdateServiceRequest,
	) => {
		try {
			await createService.mutateAsync(data as CreateServiceRequest);
			router.push(ROUTES.SERVICES);
		} catch (error) {
			console.error("Failed to create service:", error);
		}
	};

	const handleCancel = () => {
		router.back();
	};

	if (!isAdmin) {
		return null;
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
						Back
					</button>
					<h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
					<p className="mt-2 text-gray-600">
						Create a new dental service for your clinic
					</p>
				</div>

				{/* Form */}
				<div className="rounded-lg border bg-white p-8 shadow-sm">
					<ServiceForm
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isPending={createService.isPending}
					/>
				</div>
			</div>
		</div>
	);
}
