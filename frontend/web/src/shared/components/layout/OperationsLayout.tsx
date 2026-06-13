'use client';

import Link from 'next/link';

import { Icon } from '@iconify/react';

import { cn } from '@/shared/lib/utils';

import { AppNavigation } from './AppNavigation';

export interface OperationsAction {
  label: string;
  href?: string;
  icon?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface OperationsLayoutProps {
  title: string;
  description?: string;
  icon?: string;
  eyebrow?: string;
  actions?: OperationsAction[];
  tabs?: Array<{ label: string; href: string; icon?: string; active?: boolean }>;
  children: React.ReactNode;
}

const actionClass = {
  primary:
    'border-smile-primary bg-smile-primary text-white hover:bg-smile-primary/90 hover:shadow-[0_4px_14px_rgba(65,126,170,0.35)]',
  secondary:
    'border-smile-primary/25 bg-smile-primary/5 text-smile-primary hover:bg-smile-primary hover:text-white',
};

const panelStyle = {
  background: 'var(--surface-panel-bg)',
  borderColor: 'var(--surface-panel-border)',
  boxShadow: 'var(--surface-panel-shadow)',
};

const cardStyle = {
  background: 'var(--surface-card-bg)',
  borderColor: 'var(--surface-card-border)',
  boxShadow: 'var(--surface-card-shadow)',
};

const inputStyle = {
  background: 'var(--surface-input-bg)',
  borderColor: 'var(--surface-input-border)',
  boxShadow: 'var(--surface-input-shadow)',
};

export function OperationsLayout({
  title,
  description,
  icon = 'lucide:layout-dashboard',
  eyebrow,
  actions = [],
  tabs = [],
  children,
}: OperationsLayoutProps) {
  return (
    <div className="min-h-screen bg-smile-footer-bg/40 text-smile-title">
      <AppNavigation />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="relative mb-5 overflow-hidden rounded-[24px] border backdrop-blur-xl" style={panelStyle}>
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-[var(--gradient-brand)]" />
          <div className="relative flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-smile-primary text-white shadow-[0_4px_12px_rgba(65,126,170,0.35)]">
                <Icon icon={icon} width={22} />
              </div>
              <div className="min-w-0">
                {eyebrow && (
                  <p className="mb-1 font-inter text-[10px] font-bold uppercase tracking-[2.5px] text-smile-description">
                    {eyebrow}
                  </p>
                )}
                <h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 max-w-3xl font-inter text-xs leading-6 text-smile-description">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const className = cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 font-inter text-sm font-semibold transition-all',
                    actionClass[action.variant ?? 'secondary'],
                  );
                  const content = (
                    <>
                      {action.icon && <Icon icon={action.icon} width={17} />}
                      {action.label}
                    </>
                  );

                  if (action.href) {
                    return (
                      <Link key={action.label} href={action.href} className={className}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={className}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {tabs.length > 0 && (
            <nav className="mt-5 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors',
                    tab.active
                      ? 'border-smile-primary/40 bg-smile-primary/10 text-smile-primary'
                      : 'border-transparent text-smile-description hover:border-smile-primary/20 hover:bg-smile-primary/5 hover:text-smile-primary',
                  )}
                >
                  {tab.icon && <Icon icon={tab.icon} width={16} />}
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'neutral' | 'brand' | 'blue' | 'green' | 'orange' | 'red';
}

const metricTone = {
  neutral: 'text-smile-primary-dark',
  brand: 'text-smile-primary',
  blue: 'text-smile-primary',
  green: 'text-green-700',
  orange: 'text-orange-600',
  red: 'text-red-700',
};

export function MetricCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: MetricCardProps) {
  return (
    <div className="rounded-[18px] border p-4 backdrop-blur-xl" style={cardStyle}>
      <p className="font-inter text-[10px] font-bold uppercase tracking-[2px] text-smile-description">{label}</p>
      <p className={cn('mt-2 font-poppins text-2xl font-semibold', metricTone[tone])}>
        {value}
      </p>
      {detail && <p className="mt-1 font-inter text-xs text-smile-description">{detail}</p>}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'orange' | 'red';
}) {
  const styles = {
    neutral: 'bg-smile-primary/10 text-smile-primary',
    blue: 'bg-smile-primary/5 text-smile-primary',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

export const operationsSurface = {
  panel: panelStyle,
  card: cardStyle,
  input: inputStyle,
};
