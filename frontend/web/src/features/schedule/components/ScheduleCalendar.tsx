"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import type { DoctorSchedule, DoctorLeave } from "../types/schedule.type";

const DOCTOR_PALETTE = [
	"#0E8C80",
	"#6C8EF5",
	"#E0913E",
	"#9B6CD8",
	"#E8546A",
	"#22B05B",
];

function hashColor(name: string, palette: string[]): string {
	let h = 0;
	for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return palette[h % palette.length];
}

function getWeekDates(baseDate: Date): Date[] {
	const start = new Date(baseDate);
	const day = start.getDay();
	const diff = start.getDate() - day + (day === 0 ? -6 : 1);
	start.setDate(diff);
	return Array.from({ length: 6 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return d;
	});
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join("");
}

function formatDateRange(d: Date[]): string {
	const fmt = (x: Date) =>
		x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	return `${fmt(d[0])} – ${fmt(d[d.length - 1])}, ${d[d.length - 1].getFullYear()}`;
}

interface ScheduleCalendarProps {
	schedules: DoctorSchedule[];
	leaves?: DoctorLeave[];
	onScheduleClick?: (schedule: DoctorSchedule) => void;
	onApproveLeave?: (leaveId: string) => void;
	onRejectLeave?: (leaveId: string) => void;
	loading?: boolean;
}

export function ScheduleCalendar({
	schedules,
	leaves = [],
	onScheduleClick,
	onApproveLeave,
	onRejectLeave,
	loading = false,
}: ScheduleCalendarProps) {
	const [weekOffset, setWeekOffset] = useState(0);
	const [view] = useState<"Day" | "Week" | "Month">("Week");

	const baseDate = new Date();
	baseDate.setDate(baseDate.getDate() + weekOffset * 7);
	const weekDates = getWeekDates(baseDate);
	const today = new Date();

	const getSchedulesForDate = (date: Date) =>
		schedules.filter(
			(s) => s.workDate && isSameDay(new Date(s.workDate), date),
		);

	const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
	const upcomingSchedules = schedules
		.filter((s) => s.status === "SCHEDULED")
		.slice(-2);

	// Doctor Legend
	const doctorMap = new Map<string, string>();
	for (const s of schedules) {
		if (s.doctorName && !doctorMap.has(s.doctorName)) {
			doctorMap.set(s.doctorName, hashColor(s.doctorName, DOCTOR_PALETTE));
		}
	}
	const doctorLegend = Array.from(doctorMap.entries());

	if (loading) {
		return (
			<div className="grid grid-cols-[1fr_300px] gap-5">
				<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5 animate-pulse">
					<div className="h-6 bg-slate-100 rounded w-1/4 mb-5" />
					<div className="grid grid-cols-6 gap-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-48 bg-slate-100 rounded-xl" />
						))}
					</div>
				</div>
				<div className="space-y-4">
					<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5 h-64 animate-pulse" />
					<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5 h-48 animate-pulse" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<h2 className="text-2xl font-bold text-slate-900">Schedule</h2>
					<p className="text-sm text-slate-500 mt-0.5">
						Week of {formatDateRange(weekDates)}
					</p>
				</div>
				<div className="flex items-center gap-3 flex-wrap">
					{/* Segmented Control */}
					<div className="inline-flex p-1 gap-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
						{(["Day", "Week", "Month"] as const).map((v) => (
							<button
								key={v}
								className={
									view === v
										? "px-4 min-h-[36px] rounded-full text-sm font-semibold bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_4px_10px_-4px_rgba(14,140,128,0.55)] transition-all"
										: "px-4 min-h-[36px] rounded-full text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
								}
							>
								{v}
							</button>
						))}
					</div>

					{/* Nav Arrows */}
					<div className="flex gap-1">
						<button
							onClick={() => setWeekOffset((p) => p - 1)}
							className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-500"
						>
							<Icon icon="mdi:chevron-left" width={20} />
						</button>
						<button
							onClick={() => setWeekOffset((p) => p + 1)}
							className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-500"
						>
							<Icon icon="mdi:chevron-right" width={20} />
						</button>
					</div>

					<button className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-sm">
						<Icon icon="mdi:calendar-remove" width={18} />
						Request leave
					</button>
					<button className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all text-sm">
						<Icon icon="mdi:plus" width={18} />
						Add shift
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="grid grid-cols-[1fr_300px] gap-5 items-start">
				{/* Calendar */}
				<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
					{/* Week Grid */}
					<div className="grid grid-cols-6 gap-2">
						{weekDates.map((date, idx) => {
							const daySchedules = getSchedulesForDate(date);
							const isToday = isSameDay(date, today);
							return (
								<div
									key={idx}
									className={`min-h-[180px] ${isToday ? "bg-teal-50 rounded-xl" : ""}`}
								>
									{/* Day Header */}
									<div className="text-center p-2 pb-1">
										<p className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
											{DAY_LABELS[idx]}
										</p>
										<p
											className={`text-sm font-bold mt-0.5 ${
												isToday
													? "w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto"
													: "text-slate-700"
											}`}
										>
											{date.getDate()}
										</p>
									</div>

									{/* Shift Cards */}
									<div className="px-1 space-y-1.5">
										{daySchedules.length === 0 && (
											<p className="text-center text-xs text-slate-300 mt-4">
												–
											</p>
										)}
										{daySchedules.map((s) => {
											const color = hashColor(
												s.doctorName ?? s.doctorScheduleId,
												DOCTOR_PALETTE,
											);
											return (
												<button
													key={s.doctorScheduleId}
													onClick={() => onScheduleClick?.(s)}
													className="w-full text-left rounded-lg px-2 py-1.5 text-white text-xs font-medium transition-opacity hover:opacity-85"
													style={{ background: color }}
												>
													<div className="font-bold leading-tight truncate">
														{s.doctorName ?? "Doctor"}
													</div>
													<div className="opacity-90 leading-tight truncate">
														{s.shiftStartTime
															? `${s.shiftStartTime.slice(0, 5)}${s.shiftEndTime ? "–" + s.shiftEndTime.slice(0, 5) : ""}`
															: (s.shiftName ?? "")}
														{s.roomId ? ` · ${s.roomId}` : ""}
													</div>
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>

					{/* Doctor Legend */}
					{doctorLegend.length > 0 && (
						<div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
							{doctorLegend.map(([name, color]) => (
								<div key={name} className="flex items-center gap-1.5">
									<span
										className="w-2.5 h-2.5 rounded-full flex-none"
										style={{ background: color }}
									/>
									<span className="text-xs text-slate-500">{name}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					{/* Leave Requests */}
					<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-base font-bold text-slate-900">
								Leave requests
							</h3>
							{pendingLeaves.length > 0 && (
								<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
									{pendingLeaves.length} pending
								</span>
							)}
						</div>

						{pendingLeaves.length === 0 ? (
							<div className="flex flex-col items-center py-6 text-slate-400">
								<Icon
									icon="mdi:calendar-check"
									width={32}
									className="mb-2 text-slate-300"
								/>
								<p className="text-xs">No pending leave requests</p>
							</div>
						) : (
							<div className="space-y-3">
								{pendingLeaves.map((leave) => {
									const name =
										leave.doctorName ?? `Doctor ${leave.doctorId.slice(0, 6)}`;
									const initials = getInitials(name);
									const formatD = (d: string) =>
										new Date(d).toLocaleDateString("vi-VN", {
											day: "2-digit",
											month: "2-digit",
										});
									return (
										<div
											key={leave.doctorLeaveId}
											className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2 border border-slate-100"
										>
											<div className="flex items-center gap-2">
												<div
													className="rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold flex items-center justify-center text-[11px] shadow-md flex-none"
													style={{ width: 30, height: 30 }}
												>
													{initials}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-bold text-slate-900 truncate">
														{name}
													</p>
													<p className="text-xs text-slate-400 capitalize">
														{leave.leaveType?.replace(/_/g, " ") ?? "Leave"}
													</p>
												</div>
											</div>
											<p className="text-xs text-slate-500 flex items-center gap-1">
												<Icon icon="mdi:calendar-range" width={13} />
												{formatD(leave.startDate)} – {formatD(leave.endDate)}
											</p>
											<div className="flex gap-2">
												<button
													onClick={() => onApproveLeave?.(leave.doctorLeaveId)}
													className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 min-h-[36px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_4px_10px_-4px_rgba(14,140,128,0.55)] hover:brightness-105 transition-all text-xs"
												>
													Approve
												</button>
												<button
													onClick={() => onRejectLeave?.(leave.doctorLeaveId)}
													className="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-h-[36px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-xs"
												>
													Deny
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Shift Transfers */}
					<div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-base font-bold text-slate-900">
								Shift transfers
							</h3>
							<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
								{upcomingSchedules.length} upcoming
							</span>
						</div>

						{upcomingSchedules.length === 0 ? (
							<div className="flex flex-col items-center py-6 text-slate-400">
								<Icon
									icon="mdi:swap-horizontal"
									width={32}
									className="mb-2 text-slate-300"
								/>
								<p className="text-xs">No shift transfers</p>
							</div>
						) : (
							<div className="space-y-2">
								{upcomingSchedules.map((s) => {
									const color = hashColor(
										s.doctorName ?? s.doctorScheduleId,
										DOCTOR_PALETTE,
									);
									return (
										<div
											key={s.doctorScheduleId}
											className="rounded-lg px-3 py-2.5 text-white text-xs font-medium"
											style={{ background: color }}
										>
											<div className="font-bold leading-tight">
												{s.doctorName ?? "Doctor"}
											</div>
											<div className="opacity-90 leading-tight">
												{s.workDate
													? new Date(s.workDate).toLocaleDateString("vi-VN", {
															day: "2-digit",
															month: "2-digit",
														})
													: ""}
												{s.shiftStartTime
													? ` · ${s.shiftStartTime.slice(0, 5)}`
													: ""}
												{s.roomId ? ` · ${s.roomId}` : ""}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
