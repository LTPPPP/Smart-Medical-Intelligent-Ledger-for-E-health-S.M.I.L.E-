// Date Formatting

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// Format Date
export function formatDate(dateStr: string): string {
	const date = parseISO(dateStr);
	if (!isValid(date)) return "Invalid date";
	return format(date, "MMM d, yyyy");
}

// Format Date Time
export function formatDateTime(dateStr: string): string {
	const date = parseISO(dateStr);
	if (!isValid(date)) return "Invalid date";
	return format(date, "MMM d, yyyy h:mm a");
}

// Format Time
export function formatTime(dateStr: string): string {
	const date = parseISO(dateStr);
	if (!isValid(date)) return "Invalid time";
	return format(date, "h:mm a");
}

// Format Relative Time
export function formatRelativeTime(dateStr: string): string {
	const date = parseISO(dateStr);
	if (!isValid(date)) return "Invalid date";
	return formatDistanceToNow(date, { addSuffix: true });
}
