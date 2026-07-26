"use client";

import Image from "next/image";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ADMIN_ROLES } from "@/shared/constants";

export default function AdminLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<ProtectedRoute requiredRoles={ADMIN_ROLES}>
			<AppShell>
				<div className="relative min-h-screen overflow-hidden">
					{/* Floating PNG decorations */}
					<div className="pointer-events-none fixed right-[4%] top-[16%] opacity-[0.25] dark:opacity-[0.12]">
						<Image
							src="/images/glassy_tooth.png"
							alt=""
							width={90}
							height={110}
							className="object-contain"
						/>
					</div>
					<div className="pointer-events-none fixed bottom-[10%] left-[2%] rotate-[15deg] opacity-[0.20] dark:opacity-[0.10]">
						<Image
							src="/images/glassy_tool.png"
							alt=""
							width={72}
							height={72}
							className="object-contain"
						/>
					</div>

					<div className="relative mx-auto max-w-[1400px] px-4 py-6">
						{children}
					</div>
				</div>
			</AppShell>
		</ProtectedRoute>
	);
}
