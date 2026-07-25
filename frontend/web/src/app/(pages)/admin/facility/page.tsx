"use client";

import Link from "next/link";

import { Icon } from "@iconify/react";

import { ROUTES } from "@/shared/constants/routes";

const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

// K5: entry points into the existing clinic/service/schedule management
// screens — they already implement full CRUD and the leave-approval
// workflow, they just weren't reachable from the admin console.
const CARDS = [
	{
		title: "Clinics & Treatment Rooms",
		desc: "Manage clinic details, operating hours, and treatment rooms.",
		icon: "lucide:hospital",
		href: ROUTES.CLINICS,
	},
	{
		title: "Specialties",
		desc: "Manage the system specialty catalog.",
		icon: "lucide:stethoscope",
		href: ROUTES.SPECIALTIES,
	},
	{
		title: "Services & Pricing",
		desc: "Service CRUD, pricing, and default slot durations.",
		icon: "lucide:list-checks",
		href: ROUTES.SERVICES,
	},
	{
		title: "Work Shifts",
		desc: "Create shifts and assign doctors / nurses / receptionists.",
		icon: "lucide:calendar-clock",
		href: ROUTES.WORK_SHIFTS,
	},
	{
		title: "Doctor Schedules",
		desc: "Create, update, and transfer shifts between clinics.",
		icon: "lucide:calendar-days",
		href: ROUTES.DOCTOR_SCHEDULES,
	},
	{
		title: "Leave Approvals",
		desc: "Approve / reject leave requests (annual / sick / emergency).",
		icon: "lucide:plane",
		href: ROUTES.DOCTOR_LEAVES,
	},
] as const;

export default function AdminFacilityPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-inter text-xl font-bold text-smile-title">
					Facility & Schedule
				</h1>
				<p className="font-inter text-sm text-smile-description">
					Manage clinics, treatment rooms, work shifts, doctor schedules, leave
					requests, and services.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{CARDS.map((c) => (
					<Link
						key={c.href}
						href={c.href}
						className={`${cardBase} group flex flex-col gap-3 p-5 transition hover:border-smile-primary/40`}
					>
						<span className="flex h-12 w-12 items-center justify-center rounded-[16px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
							<Icon icon={c.icon} width={20} className="text-smile-primary" />
						</span>
						<h3 className="font-poppins text-[16px] font-semibold text-smile-title">
							{c.title}
						</h3>
						<p className="font-inter text-sm leading-[21px] text-smile-description">
							{c.desc}
						</p>
						<span className="mt-1 flex items-center gap-1 font-inter text-xs font-semibold text-smile-primary opacity-0 transition group-hover:opacity-100">
							Open <Icon icon="lucide:arrow-right" width={13} />
						</span>
					</Link>
				))}
			</div>
		</div>
	);
}
