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
	description: string;
	icon: string;
	href: string;
	requiredRoles: readonly string[];
}

const SCHEDULE_DESTINATIONS: ScheduleDestination[] = [
	{
		title: "Work & On-Call Schedules",
		description: "Create, update, and transfer doctor schedules across clinics.",
		icon: "lucide:calendar-days",
		href: ROUTES.DOCTOR_SCHEDULES,
		requiredRoles: SCHEDULE_MANAGEMENT_ROLES,
	},
	{
		title: "Work Shifts",
		description: "Manage the shift catalog and working-hour definitions.",
		icon: "lucide:clock-3",
		href: ROUTES.WORK_SHIFTS,
		requiredRoles: WORK_SHIFT_ROLES,
	},
	{
		title: "My Schedule",
		description: "View and register your personal examination schedule.",
		icon: "lucide:user-round",
		href: ROUTES.MY_SCHEDULE,
		requiredRoles: MY_SCHEDULE_ROLES,
	},
	{
		title: "Leaves",
		description: "Request leave and review leave requests.",
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
