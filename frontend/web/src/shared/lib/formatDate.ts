// ============================================================
// Date formatting utilities — uses date-fns (tree-shakeable)
// ============================================================

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Format an ISO date string to a readable date.
 * @example formatDate("2026-05-07T10:30:00Z") → "May 7, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid date";
  return format(date, "MMM d, yyyy");
}

/**
 * Format an ISO date string to date + time.
 * @example formatDateTime("2026-05-07T10:30:00Z") → "May 7, 2026 10:30 AM"
 */
export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid date";
  return format(date, "MMM d, yyyy h:mm a");
}

/**
 * Format an ISO date string to time only.
 * @example formatTime("2026-05-07T10:30:00Z") → "10:30 AM"
 */
export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid time";
  return format(date, "h:mm a");
}

/**
 * Format a relative time string.
 * @example formatRelativeTime("2026-05-06T10:30:00Z") → "1 day ago"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid date";
  return formatDistanceToNow(date, { addSuffix: true });
}
