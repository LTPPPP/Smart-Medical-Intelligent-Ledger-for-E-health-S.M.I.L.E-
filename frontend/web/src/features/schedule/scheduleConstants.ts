// Seeded clinical staff (no doctor-directory endpoint yet; ids match the seed data).
export const DOCTORS = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Dr. Nguyen Van A' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Dr. Tran Thi B' },
];

export const doctorName = (id?: string): string =>
  DOCTORS.find((d) => d.id === id)?.name ?? (id ? `Doctor ${id.slice(0, 8)}` : '—');

export const SCHEDULE_STATUSES = ['scheduled', 'completed', 'cancelled'];

export const SCHEDULE_STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-smile-primary',
  completed: 'text-emerald-600 dark:text-emerald-300',
  cancelled: 'text-red-600 dark:text-red-300',
};

// Unwrap helpers for the mixed BE response shapes ({data:[...]} or raw array/object).
export function unwrapArr<T>(res: unknown): T[] {
  const payload = (res as { data?: unknown })?.data;
  if (Array.isArray(payload)) return payload as T[];
  const inner = (payload as { data?: unknown })?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
}
export function unwrapOne<T>(res: unknown): T | null {
  const payload = (res as { data?: unknown })?.data;
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) return (payload as { data: T }).data;
  return (payload as T) ?? null;
}
