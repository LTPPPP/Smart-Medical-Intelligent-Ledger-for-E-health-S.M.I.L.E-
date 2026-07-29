"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { APPOINTMENT_STATUS_COLORS } from "../constants/appointment.constant";
import type { Appointment } from "../types/appointment.type";

interface AppointmentCalendarProps {
	appointments: Appointment[];
	onAppointmentClick: (appointment: Appointment) => void;
}

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function AppointmentCalendar({
	appointments,
	onAppointmentClick,
}: AppointmentCalendarProps) {
	const today = new Date();
	const [current, setCurrent] = useState(
		new Date(today.getFullYear(), today.getMonth(), 1),
	);

	const year = current.getFullYear();
	const month = current.getMonth();

	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const prev = () => setCurrent(new Date(year, month - 1, 1));
	const next = () => setCurrent(new Date(year, month + 1, 1));

	const appointmentsForDay = (day: number) => {
		const date = new Date(year, month, day);
		return appointments.filter((a) => {
			const d = new Date(a.appointmentDate);
			return isSameDay(d, date);
		});
	};

	const MONTH_NAMES = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const cells: (number | null)[] = [
		...Array(firstDay).fill(null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	];

	while (cells.length % 7 !== 0) cells.push(null);

	return (
		<div className="bg-white rounded-xl shadow-md overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b">
				<button
					onClick={prev}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<Icon icon="mdi:chevron-left" width={20} />
				</button>
				<h2 className="font-bold text-lg text-gray-800">
					{MONTH_NAMES[month]} {year}
				</h2>
				<button
					onClick={next}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<Icon icon="mdi:chevron-right" width={20} />
				</button>
			</div>

			{/* Day headers */}
			<div className="grid grid-cols-7 border-b">
				{DAY_NAMES.map((d) => (
					<div
						key={d}
						className="py-2 text-center text-xs font-semibold text-gray-500 uppercase"
					>
						{d}
					</div>
				))}
			</div>

			{/* Grid */}
			<div className="grid grid-cols-7">
				{cells.map((day, idx) => {
					if (!day) {
						return (
							<div
								key={`empty-${idx}`}
								className="h-24 border-b border-r bg-gray-50"
							/>
						);
					}
					const dayAppointments = appointmentsForDay(day);
					const isToday = isSameDay(new Date(year, month, day), today);

					return (
						<div
							key={day}
							className={`h-24 border-b border-r p-1.5 flex flex-col gap-1 overflow-hidden ${isToday ? "bg-blue-50" : "hover:bg-gray-50"}`}
						>
							<span
								className={`text-xs font-semibold self-start w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}
							>
								{day}
							</span>
							{dayAppointments.slice(0, 2).map((a) => (
								<button
									key={a.appointmentId}
									onClick={() => onAppointmentClick(a)}
									className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${APPOINTMENT_STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-800"}`}
									title={`${a.appointmentTime} · ${a.serviceName} · ${a.doctorName}`}
								>
									{a.appointmentTime} {a.serviceName}
								</button>
							))}
							{dayAppointments.length > 2 && (
								<span className="text-[10px] text-gray-500 pl-1">
									+{dayAppointments.length - 2} more
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
