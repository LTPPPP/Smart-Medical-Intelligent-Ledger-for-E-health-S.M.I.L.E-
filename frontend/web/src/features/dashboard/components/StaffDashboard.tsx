"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { ENV } from "@/shared/constants/env";
import { ROUTES } from "@/shared/constants/routes";

import {
	DashboardHeader,
	DashStat,
	DashPanel,
	DashEmpty,
	DashLoading,
	DashQuickLink,
	STATUS_STYLE,
	fmtDate,
} from "./DashboardPrimitives";

interface AppointmentItem {
	appointment_id: string;
	appointment_code?: string;
	appointment_date?: string;
	appointment_time?: string;
	status?: string;
	service?: { service_name?: string } | null;
}

export function StaffDashboard({
	staffRole,
}: { staffRole: "receptionist" | "nurse" | "manager" }) {
	const { user } = useAuthStore();

	const { data: patientsRes, isLoading: patientsLoading } = useQuery({
		queryKey: ["patients", "list-staff-dashboard"],
		queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
	});
	const { data: apptRes, isLoading: apptLoading } = useQuery({
		queryKey: ["appointments", "list-staff-dashboard"],
		queryFn: () => apiClient.get(API_ENDPOINTS.APPOINTMENT.LIST),
	});

	const patients = useMemo(
		() => unwrapArr<{ patient_id: string }>(patientsRes),
		[patientsRes],
	);
	const appointments = useMemo(
		() => unwrapArr<AppointmentItem>(apptRes),
		[apptRes],
	);

	const today = new Date().toISOString().split("T")[0];
	const todayAppts = appointments.filter((a) =>
		(a.appointment_date ?? "").startsWith(today),
	);
	const pending = appointments.filter(
		(a) => a.status === "pending" || a.status === "scheduled",
	);

	const links = [
		// Nurse excluded
		...(staffRole !== "nurse"
			? [
					{
						href: ROUTES.APPOINTMENT_NEW,
						icon: "lucide:calendar-plus",
						label: "New Appointment",
						description: "Book a patient visit",
					},
				]
			: []),
		{
			href: ROUTES.APPOINTMENTS,
			icon: "lucide:calendar-clock",
			label: "Appointments",
			description: "View & manage bookings",
		},
		{
			href: ROUTES.PATIENTS,
			icon: "lucide:users",
			label: "Patients",
			description: "Patient directory",
		},
		...(staffRole === "receptionist"
			? [
					{
						href: ROUTES.CLINICS,
						icon: "lucide:building-2",
						label: "Clinics",
						description: "Clinic directory",
					},
				]
			: [
					{
						href: "/dental-images",
						icon: "lucide:scan",
						label: "Imaging",
						description: "Dental images",
					},
				]),
	];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
			<DashboardHeader
				eyebrow={
					staffRole === "receptionist"
						? "Front Desk"
						: staffRole === "manager"
							? "Clinic Management"
							: "Nursing"
				}
				title={`Welcome back, ${user?.fullName ?? "there"}`}
				subtitle={
					staffRole === "receptionist"
						? "Manage bookings, patients, and front-desk operations."
						: staffRole === "manager"
							? "Oversee clinic operations, staff schedules, and patients."
							: "Support patient care and clinical workflows."
				}
				icon={
					staffRole === "receptionist"
						? "lucide:concierge-bell"
						: staffRole === "manager"
							? "lucide:briefcase"
							: "lucide:heart-pulse"
				}
			/>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<DashStat
					label="Today's Appointments"
					value={todayAppts.length}
					icon="lucide:calendar-days"
					loading={apptLoading}
					accent
				/>
				<DashStat
					label="Pending / Scheduled"
					value={pending.length}
					icon="lucide:clock"
					loading={apptLoading}
				/>
				<DashStat
					label="Total Appointments"
					value={appointments.length}
					icon="lucide:calendar-check"
					loading={apptLoading}
				/>
				<DashStat
					label="Patients"
					value={patients.length}
					icon="lucide:users"
					loading={patientsLoading}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<DashPanel title="Today's Appointments" icon="lucide:calendar-check">
						{apptLoading ? (
							<DashLoading />
						) : todayAppts.length === 0 ? (
							<DashEmpty label="No appointments today" />
						) : (
							<ul
								className="divide-y"
								style={{ borderColor: "var(--surface-panel-border)" }}
							>
								{todayAppts.slice(0, 8).map((a) => (
									<li
										key={a.appointment_id}
										className="flex items-center justify-between gap-4 px-6 py-3.5"
									>
										<div className="min-w-0">
											<p className="truncate font-inter text-sm font-medium text-smile-title">
												{a.service?.service_name ??
													a.appointment_code ??
													"Appointment"}
											</p>
											<p className="font-inter text-xs text-smile-description">
												{fmtDate(a.appointment_date)}
												{a.appointment_time ? ` · ${a.appointment_time}` : ""}
											</p>
										</div>
										<span
											className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ""] ?? "text-smile-description"}`}
										>
											{a.status ?? "—"}
										</span>
									</li>
								))}
							</ul>
						)}
					</DashPanel>
				</div>

				<DashPanel title="Quick Actions" icon="lucide:zap">
					<div className="flex flex-col gap-3 p-4">
						{links.map((l) => (
							<DashQuickLink key={l.href} {...l} />
						))}
					</div>
				</DashPanel>
			</div>
		</div>
	);
}
