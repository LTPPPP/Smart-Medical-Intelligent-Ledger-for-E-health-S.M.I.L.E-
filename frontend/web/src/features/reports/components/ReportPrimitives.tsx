'use client';

import { Icon } from '@iconify/react';

// Shared dark-theme presentational primitives for the reporting pages.
// Tokens match the existing dark pages (clinics, AppShell).
export const TEAL = '#45F0CF';
export const BLUE = '#92CDFD';
export const cardBase =
  'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-[#323538]">
          <Icon icon={icon} width={24} style={{ color: BLUE }} />
        </span>
        <div>
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#8B9199]">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-[28px] font-bold tracking-[-0.6px] text-white"
            style={{ fontFamily: 'Public Sans, sans-serif' }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[#C1C7CF]">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  loading,
  accent = BLUE,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  loading?: boolean;
  accent?: string;
}) {
  return (
    <div className={`${cardBase} relative overflow-hidden p-5`}>
      <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8B9199]">
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-bold text-white"
        style={{ fontFamily: 'Public Sans, sans-serif' }}
      >
        {loading ? '—' : value}
      </p>
      <div
        className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <Icon icon={icon} width={18} style={{ color: accent }} />
      </div>
    </div>
  );
}

export function CardPanel({
  title,
  icon,
  children,
  right,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className={`${cardBase} relative overflow-hidden`}>
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[20px]"
        style={{ background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }}
      />
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Icon icon={icon} width={16} style={{ color: BLUE }} />
          </span>
          <p
            className="text-sm font-semibold text-white"
            style={{ fontFamily: 'Public Sans, sans-serif' }}
          >
            {title}
          </p>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[#C1C7CF]">
      <Icon icon="line-md:loading-twotone-loop" width={20} /> {label}
    </div>
  );
}

export function EmptyBlock({ label = 'No data' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-[#8B9199]">
      <Icon icon="lucide:inbox" width={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorBlock({
  label = 'Something went wrong.',
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
      {label}{' '}
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}
