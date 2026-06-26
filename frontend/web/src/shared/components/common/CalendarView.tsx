'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export interface CalendarEvent {
  id: string;
  /** ISO date the event starts on (YYYY-MM-DD or full ISO). */
  date: string;
  /** Optional ISO end date — when set, the event spans every day in [date, endDate]. */
  endDate?: string;
  label: string;
  /** Optional secondary line (time, clinic, etc.) shown in the tooltip. */
  meta?: string;
  /** Tailwind classes for the event pill (bg + text). Defaults to brand tint. */
  tone?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (id: string) => void;
  /** Max event pills shown per day before collapsing to "+N more". */
  maxPerDay?: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDate(value: string): Date | null {
  if (!value) return null;
  try {
    return value.length > 10 ? parseISO(value) : parseISO(`${value}T00:00:00`);
  } catch {
    return null;
  }
}

export function CalendarView({ events, onEventClick, maxPerDay = 3 }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor));
    const gridEnd = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const eventsForDay = useMemo(() => {
    return (day: Date): CalendarEvent[] =>
      events.filter((ev) => {
        const start = toDate(ev.date);
        if (!start) return false;
        const end = ev.endDate ? toDate(ev.endDate) : start;
        if (!end) return isSameDay(start, day);
        return day >= startOfDayLocal(start) && day <= endOfDayLocal(end);
      });
  }, [events]);

  return (
    <div className="overflow-hidden rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]">
      {/* Month header */}
      <div className="flex items-center justify-between border-b px-5 py-4 [border-color:var(--surface-panel-border)]">
        <button
          onClick={() => setCursor((c) => addMonths(c, -1))}
          aria-label="Previous month"
          className="rounded-lg p-2 text-smile-description transition hover:bg-smile-primary-light/40 hover:text-smile-primary"
        >
          <Icon icon="lucide:chevron-left" width={18} />
        </button>
        <h2 className="font-poppins text-lg font-bold text-smile-primary-dark">
          {format(cursor, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="Next month"
          className="rounded-lg p-2 text-smile-description transition hover:bg-smile-primary-light/40 hover:text-smile-primary"
        >
          <Icon icon="lucide:chevron-right" width={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b [border-color:var(--surface-panel-border)]">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 border-b border-r p-1.5 [border-color:var(--surface-panel-border)] ${
                inMonth ? '' : 'opacity-40'
              } ${today ? 'bg-smile-primary-light/40' : 'hover:bg-smile-primary-light/20'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full font-inter text-xs font-semibold ${
                  today ? 'bg-smile-primary text-white' : 'text-smile-title'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {dayEvents.slice(0, maxPerDay).map((ev) => (
                  <button
                    key={`${ev.id}-${day.toISOString()}`}
                    onClick={() => onEventClick?.(ev.id)}
                    title={ev.meta ? `${ev.label} · ${ev.meta}` : ev.label}
                    className={`w-full truncate rounded px-1.5 py-0.5 text-left font-inter text-[10px] font-medium transition ${
                      ev.tone ?? 'bg-smile-primary/15 text-smile-primary'
                    }`}
                  >
                    {ev.label}
                  </button>
                ))}
                {dayEvents.length > maxPerDay && (
                  <span className="pl-1 font-inter text-[10px] text-smile-description">
                    +{dayEvents.length - maxPerDay} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}

export default CalendarView;
