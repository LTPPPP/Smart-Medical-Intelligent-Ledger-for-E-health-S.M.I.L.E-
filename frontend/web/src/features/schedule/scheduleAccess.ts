import {
	LEAVES_ROLES,
	MY_SCHEDULE_ROLES,
	SCHEDULE_MANAGEMENT_ROLES,
	WORK_SHIFT_ROLES,
	hasAnyRole,
} from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

export interface ScheduleDestination {
	title: string;
	titleKey: string;
	description: string;
	descriptionKey: string;
	icon: string;
	href: string;
	requiredRoles: readonly string[];
}

const SCHEDULE_DESTINATIONS: ScheduleDestination[] = [
	{
		title: "Work & On-Call Schedules",
		titleKey: "schedule.hub.workSchedulesTitle",
		description: "Create, update, and transfer doctor schedules across clinics.",
		descriptionKey: "schedule.hub.workSchedulesDesc",
		icon: "lucide:calendar-days",
		href: ROUTES.DOCTOR_SCHEDULES,
		requiredRoles: SCHEDULE_MANAGEMENT_ROLES,
	},
	{
		title: "Work Shifts",
		titleKey: "schedule.hub.workShiftsTitle",
		description: "Manage the shift catalog and working-hour definitions.",
		descriptionKey: "schedule.hub.workShiftsDesc",
		icon: "lucide:clock-3",
		href: ROUTES.WORK_SHIFTS,
		requiredRoles: WORK_SHIFT_ROLES,
	},
	{
		title: "My Schedule",
		titleKey: "schedule.hub.mySchedule",
		description: "View and register your personal examination schedule.",
		descriptionKey: "schedule.hub.myScheduleDesc",
		icon: "lucide:user-round",
		href: ROUTES.MY_SCHEDULE,
		requiredRoles: MY_SCHEDULE_ROLES,
	},
	{
		title: "Leaves",
		titleKey: "schedule.hub.leaves",
		description: "Request leave and review leave requests.",
		descriptionKey: "schedule.hub.leavesDesc",
		icon: "lucide:plane",
		href: ROUTES.DOCTOR_LEAVES,
		requiredRoles: LEAVES_ROLES,
	},
];

export function getScheduleDestinationsForRoles(
	roles: readonly string[] | undefined,
): ScheduleDestination[] {
	return SCHEDULE_DESTINATIONS.filter((destination) =>
		hasAnyRole(roles, destination.requiredRoles),
	);
}
