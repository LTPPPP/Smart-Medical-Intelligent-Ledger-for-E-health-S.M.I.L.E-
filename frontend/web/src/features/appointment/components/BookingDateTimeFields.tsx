"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { format, parseISO, isValid } from "date-fns";

import { useTranslation } from "@/features/i18n";
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

// Date Picker
export function BookingDatePicker({
	value,
	onChange,
	minDate,
	maxDate,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	minDate?: Date;
	maxDate?: Date;
	placeholder?: string;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const selected = toDate(value);
	const displayPlaceholder = placeholder ?? t("booking.dateTimeFields.pickDate", "Pick a date");
	const disabled =
		minDate || maxDate
			? [
					...(minDate ? [{ before: minDate }] : []),
					...(maxDate ? [{ after: maxDate }] : []),
				]
			: undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={triggerCls}>
				<Icon
					icon="lucide:calendar-days"
					width={17}
					className="shrink-0 text-smile-primary/70"
				/>
				<span className={cn(!selected && "text-smile-description")}>
					{selected ? format(selected, "EEE, dd MMM yyyy") : displayPlaceholder}
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<Calendar
					mode="single"
					captionLayout="dropdown"
					startMonth={minDate ?? new Date(1900, 0)}
					endMonth={maxDate ?? new Date(2100, 11)}
					selected={selected}
					defaultMonth={selected ?? maxDate}
					onSelect={(date) => {
						if (!date) return;
						onChange(format(date, "yyyy-MM-dd"));
						setOpen(false);
					}}
					disabled={disabled}
					className="[--cell-size:2.5rem]"
				/>
			</PopoverContent>
		</Popover>
	);
}

const makeSlots = (startMinutes: number, endMinutes: number) =>
	Array.from(
		{ length: Math.floor((endMinutes - startMinutes) / 30) + 1 },
		(_, i) => {
			const totalMinutes = startMinutes + i * 30;
			const h = Math.floor(totalMinutes / 60);
			const m = totalMinutes % 60;
			return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
		},
	);

// Default Time Slots
const TIME_SLOTS = makeSlots(8 * 60, 18 * 60); // 08:00 .. 18:00

// Extended Time Slots
const EXTENDED_TIME_SLOTS = makeSlots(0, 23 * 60 + 30); // 00:00 .. 23:30

const todayStr = () => format(new Date(), "yyyy-MM-dd");

// Filter Past Slots
function filterPastSlots(slots: string[], selectedDate?: string): string[] {
	if (!selectedDate || selectedDate !== todayStr()) return slots;
	const now = new Date();
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	return slots.filter((slot) => {
		const [h, m] = slot.split(":").map(Number);
		return h * 60 + m > nowMinutes;
	});
}

// Time Picker
export function BookingTimePicker({
	value,
	onChange,
	selectedDate,
	extendedRange = false,
}: {
	value: string;
	onChange: (value: string) => void;
	/** Selected Date */
	selectedDate?: string;
	/** Extended Range */
	extendedRange?: boolean;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const slots = useMemo(
		() =>
			filterPastSlots(
				extendedRange ? EXTENDED_TIME_SLOTS : TIME_SLOTS,
				selectedDate,
			),
		[extendedRange, selectedDate],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={triggerCls}>
				<Icon
					icon="lucide:clock"
					width={17}
					className="shrink-0 text-smile-primary/70"
				/>
				<span className={cn(!value && "text-smile-description")}>
					{value || t("booking.dateTimeFields.pickTime", "Pick a time")}
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 p-3">
				{slots.length === 0 ? (
					<p className="px-1 py-2 text-center text-xs text-smile-description">
						{t(
							"booking.dateTimeFields.noSlotsToday",
							"No more time slots today — please pick another date.",
						)}
					</p>
				) : (
					<div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
						{slots.map((slot) => (
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
				)}
			</PopoverContent>
		</Popover>
	);
}
