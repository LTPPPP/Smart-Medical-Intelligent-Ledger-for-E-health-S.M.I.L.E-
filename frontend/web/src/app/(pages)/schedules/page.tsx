"use client";

import Link from "next/link";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

const CARDS = [
	{
		title: "schedule.hub.workSchedulesTitle",
		titleFallback: "Work & On-Call Schedules",
		desc: "schedule.hub.workSchedulesDesc",
		descFallback: "Create, update and transfer doctor shifts across clinics.",
		icon: "lucide:calendar-days",
		href: ROUTES.DOCTOR_SCHEDULES,
	},
	{
		title: "schedule.hub.mySchedule",
		titleFallback: "My Schedule",
		desc: "schedule.hub.myScheduleDesc",
		descFallback: "View and register your personal examination schedule.",
		icon: "lucide:user-round",
		href: ROUTES.MY_SCHEDULE,
	},
	{
		title: "schedule.hub.leaves",
		titleFallback: "Leaves",
		desc: "schedule.hub.leavesDesc",
		descFallback: "Request and review doctor leave.",
		icon: "lucide:plane",
		href: ROUTES.DOCTOR_LEAVES,
	},
];

export default function SchedulesPage() {
	const { t } = useTranslation();

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<div>
					<h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
						{t("schedule.hub.title", "Schedule Management")}
					</h1>
					<p className="text-sm text-smile-description">
						{t("schedule.hub.subtitle", "Manage work schedules, personal schedules and leave.")}
					</p>
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{CARDS.map((c) => (
						<Link
							key={c.href}
							href={c.href}
							className={`${cardBase} group flex flex-col gap-3 p-6 transition hover:border-smile-primary/40`}
						>
							<span className="flex h-14 w-14 items-center justify-center rounded-[20px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
								<Icon icon={c.icon} width={22} className="text-smile-primary" />
							</span>
							<h3 className="text-[18px] font-semibold text-smile-title font-poppins">
								{t(c.title, c.titleFallback)}
							</h3>
							<p className="text-sm leading-[23px] text-smile-description">
								{t(c.desc, c.descFallback)}
							</p>
							<span className="mt-1 flex items-center gap-1 text-xs font-semibold text-smile-primary opacity-0 transition group-hover:opacity-100">
								{t("schedule.hub.open", "Open")} <Icon icon="lucide:arrow-right" width={13} />
							</span>
						</Link>
					))}
				</div>
			</div>
		</AppShell>
	);
}
