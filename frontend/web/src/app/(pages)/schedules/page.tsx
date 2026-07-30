"use client";

import Link from "next/link";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { getScheduleDestinationsForRoles } from "@/features/schedule/scheduleAccess";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { AppShell } from "@/shared/components/layout/AppShell";
import { SCHEDULE_HUB_ROLES } from "@/shared/constants/roles";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

export default function SchedulesPage() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const destinations = getScheduleDestinationsForRoles(user?.roles);

	return (
		<ProtectedRoute requiredRoles={SCHEDULE_HUB_ROLES}>
			<AppShell>
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
					<div>
						<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
							{t("schedule.hub.title", "Schedule Management")}
						</h1>
						<p className="text-sm text-smile-description">
							{t(
								"schedule.hub.subtitle",
								"Open a schedule workspace available to your role.",
							)}
						</p>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
						{destinations.map((destination) => (
							<Link
								key={destination.href}
								href={destination.href}
								className={`${cardBase} group flex flex-col gap-3 p-6 transition hover:border-smile-primary/40`}
							>
								<span className="flex h-14 w-14 items-center justify-center rounded-[20px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
									<Icon
										icon={destination.icon}
										width={22}
										className="text-smile-primary"
									/>
								</span>
								<h2 className="font-poppins text-[18px] font-semibold text-smile-title">
									{t(destination.titleKey, destination.title)}
								</h2>
								<p className="text-sm leading-[23px] text-smile-description">
									{t(destination.descriptionKey, destination.description)}
								</p>
								<span className="mt-1 flex items-center gap-1 text-xs font-semibold text-smile-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
									{t("schedule.hub.open", "Open")}{" "}
									<Icon icon="lucide:arrow-right" width={13} />
								</span>
							</Link>
						))}
					</div>
				</div>
			</AppShell>
		</ProtectedRoute>
	);
}
