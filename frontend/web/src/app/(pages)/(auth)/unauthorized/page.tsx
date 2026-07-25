"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { ROUTES } from "@/shared/constants/routes";

export default function UnauthorizedPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<div className="text-center max-w-md">
				<div className="mb-6">
					<Icon
						icon="mdi:lock-alert"
						className="mx-auto text-red-500"
						width={120}
						height={120}
					/>
				</div>

				<h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
				<p className="text-gray-600 mb-6">
					You don&apos;t have permission to access this page.
				</p>

				<div className="flex gap-3 justify-center">
					<button
						onClick={() => router.back()}
						className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Go Back
					</button>
					<button
						onClick={() => router.push(ROUTES.DASHBOARD)}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		</div>
	);
}
