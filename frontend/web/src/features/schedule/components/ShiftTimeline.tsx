"use client";

import { useTranslation } from "@/features/i18n";

// Timeline bar
function toMinutes(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return (h || 0) * 60 + (m || 0);
}

export interface ShiftAppointmentBlock {
	time: string; // HH:mm
	duration_minutes?: number;
}

export function ShiftTimeline({
	startTime,
	endTime,
	appointments,
}: {
	startTime: string;
	endTime: string;
	appointments: ShiftAppointmentBlock[];
}) {
	const { t } = useTranslation();
	const start = toMinutes(startTime);
	const end = toMinutes(endTime);
	const total = Math.max(end - start, 1);

	const segments = appointments
		.map((a) => {
			const aStart = Math.max(toMinutes(a.time), start);
			const aEnd = Math.min(aStart + (a.duration_minutes || 30), end);
			if (aEnd <= aStart) return null;
			return {
				left: ((aStart - start) / total) * 100,
				width: Math.max(((aEnd - aStart) / total) * 100, 1.5),
			};
		})
		.filter((s): s is { left: number; width: number } => s !== null);

	return (
		<div className="flex flex-col gap-1">
			<div className="relative h-3 w-full overflow-hidden rounded-full bg-smile-primary/60">
				{segments.map((s, i) => (
					<div
						key={i}
						className="absolute top-0 h-full bg-red-500"
						style={{ left: `${s.left}%`, width: `${s.width}%` }}
					/>
				))}
			</div>
			<div className="flex items-center justify-between font-inter text-[10px] text-smile-description">
				<span>{startTime}</span>
				<span className="flex items-center gap-3">
					<span className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-full bg-smile-primary/60" />{" "}
						{t("schedule.timeline.onDuty", "On duty")}
					</span>
					<span className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-full bg-red-500" />{" "}
						{t("schedule.timeline.appointment", "Appointment")}
					</span>
				</span>
				<span>{endTime}</span>
			</div>
		</div>
	);
}

export default ShiftTimeline;
