"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";
import { format, parseISO, isValid } from "date-fns";

import { Calendar } from "@/shared/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

const triggerCls =
	"flex h-11 w-full items-center gap-2.5 rounded-xl border px-4 font-inter text-sm text-smile-title outline-none transition hover:border-smile-primary/40 focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

function toDate(value: string): Date | undefined {
	if (!value) return undefined;
	const d = parseISO(value);
	return isValid(d) ? d : undefined;
}

/** Big visual month-grid date picker, replacing the native <input type="date">. */
export function BookingDatePicker({
	value,
	onChange,
	minDate,
}: {
	value: string;
	onChange: (value: string) => void;
	minDate?: Date;
}) {
	const [open, setOpen] = useState(false);
	const selected = toDate(value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={triggerCls}>
				<Icon
					icon="lucide:calendar-days"
					width={17}
					className="shrink-0 text-smile-primary/70"
				/>
				<span className={cn(!selected && "text-smile-description")}>
					{selected ? format(selected, "EEE, dd MMM yyyy") : "Pick a date"}
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<Calendar
					mode="single"
					selected={selected}
					defaultMonth={selected}
					onSelect={(date) => {
						if (!date) return;
						onChange(format(date, "yyyy-MM-dd"));
						setOpen(false);
					}}
					disabled={minDate ? { before: minDate } : undefined}
					className="[--cell-size:2.5rem]"
				/>
			</PopoverContent>
		</Popover>
	);
}

// Half-hour slots covering a typical clinic day; the wizard doesn't yet know the
// selected doctor's exact shift bounds, so this stays a generous fixed range.
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
	const totalMinutes = 8 * 60 + i * 30; // 08:00 .. 18:00
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

/** Big visual time-slot grid, replacing the native <input type="time">. */
export function BookingTimePicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={triggerCls}>
				<Icon
					icon="lucide:clock"
					width={17}
					className="shrink-0 text-smile-primary/70"
				/>
				<span className={cn(!value && "text-smile-description")}>
					{value || "Pick a time"}
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 p-3">
				<div className="grid grid-cols-3 gap-2">
					{TIME_SLOTS.map((slot) => (
						<button
							key={slot}
							type="button"
							onClick={() => {
								onChange(slot);
								setOpen(false);
							}}
							className={cn(
								"rounded-lg border px-2 py-2 text-sm font-medium transition",
								slot === value
									? "border-smile-primary bg-smile-primary text-white"
									: "border-transparent text-smile-title hover:border-smile-primary/40 hover:bg-smile-primary/10",
							)}
						>
							{slot}
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
