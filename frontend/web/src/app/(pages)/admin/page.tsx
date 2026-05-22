'use client';
import Link from 'next/link';
import { Icon } from '@iconify/react';

import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth/store/authStore';

const adminCards = [
  {
    title: 'User Management',
    description: 'Manage system users, lock/unlock accounts, assign roles',
    icon: 'lucide:users',
    href: ROUTES.ADMIN_USERS,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Role Management',
    description: 'Create and manage roles, assign permissions',
    icon: 'lucide:shield-half',
    href: ROUTES.ADMIN_ROLES,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Clinic Management',
    description: 'Manage dental clinics and treatment rooms',
    icon: 'lucide:hospital',
    href: ROUTES.CLINICS,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'System Logs',
    description: 'View access logs and audit trails',
    icon: 'lucide:scroll-text',
    href: '#',
    gradient: 'from-orange-400 to-amber-500',
    disabled: true,
  },
];

const stats = [
  { label: 'Total Users', value: '--', icon: 'lucide:users', color: 'text-blue-500' },
  { label: 'Active Clinics', value: '--', icon: 'lucide:hospital', color: 'text-emerald-500' },
  { label: 'System Roles', value: '--', icon: 'lucide:shield-check', color: 'text-violet-500' },
];

export default function AdminPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-[28px] border backdrop-blur-xl"
        style={{
          background: "var(--surface-panel-bg)",
          borderColor: "var(--surface-panel-border)",
          boxShadow: "var(--surface-panel-shadow)",
        }}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px] bg-smile-primary" />
        {/* Glass shimmer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }}
        />
        {/* Glow orb */}
        <div
          className="pointer-events-none absolute -bottom-8 right-0 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(65,126,170,0.18) 0%, transparent 70%)" }}
        />

        <div className="relative px-8 py-7">
          <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
            Admin Panel
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-smile-primary/10">
              <Icon icon="lucide:shield-check" width={22} className="text-smile-primary" />
            </div>
            <div>
              <h1 className="font-poppins text-3xl font-semibold">
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-brand)" }}
                >
                  Admin Dashboard
                </span>
              </h1>
              <p className="font-inter text-sm text-smile-title">
                Welcome back,{' '}
                <span className="font-semibold text-smile-primary">{user?.fullName ?? 'Admin'}</span>
              </p>
            </div>
          </div>
          {/* Active session badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-smile-primary/30 bg-smile-primary/10 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-primary shadow-[0_0_6px_rgba(65,126,170,0.8)]" />
            <span className="font-inter text-xs font-semibold text-smile-primary">Active session</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)" }} />
            <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">{s.label}</p>
            <p className="mt-1.5 font-poppins text-3xl font-bold text-smile-primary-dark">{s.value}</p>
            <div className={`absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary-light`}>
              <Icon icon={s.icon} width={18} className={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Admin cards */}
      <div>
        <p className="mb-4 font-inter text-[10px] font-bold uppercase tracking-[3px] text-smile-description">
          Management
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              href={card.disabled ? '#' : card.href}
              onClick={(e) => card.disabled && e.preventDefault()}
              className={`group relative overflow-hidden rounded-[22px] border backdrop-blur-xl transition-all ${card.disabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(65,126,170,0.18)]'
                }`}
              style={{
                background: "var(--surface-card-bg)",
                borderColor: "var(--surface-card-border)",
                boxShadow: "var(--surface-card-shadow)",
              }}
            >
              {/* Glass shimmer */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[22px]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)" }}
              />
              {/* Hover shimmer */}
              {!card.disabled && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "linear-gradient(135deg, rgba(65,126,170,0.06) 0%, transparent 60%)" }}
                />
              )}
              {/* Top accent */}
              <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-[22px] bg-gradient-to-r ${card.gradient}`} />

              <div className="relative p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <Icon icon={card.icon} className="text-white" width={22} />
                </div>
                <h3 className="font-poppins text-base font-semibold text-smile-primary-dark">{card.title}</h3>
                <p className="mt-1 font-inter text-sm text-smile-description">{card.description}</p>
                {card.disabled ? (
                  <span className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 font-inter text-[10px] font-semibold text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                    Coming Soon
                  </span>
                ) : (
                  <div className="mt-4 flex items-center gap-1 font-inter text-xs font-semibold text-smile-primary transition-all group-hover:gap-2">
                    Open <Icon icon="lucide:arrow-right" width={12} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}