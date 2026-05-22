'use client';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAdmin } from '@/features/admin/hooks/useAdmin';

const adminCards = [
  {
    title: 'User Management',
    description: 'Manage system users, lock/unlock accounts, assign roles',
    icon: 'lucide:users',
    href: ROUTES.ADMIN_USERS,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.25)',
  },
  {
    title: 'Role Management',
    description: 'Create and manage roles, assign permissions',
    icon: 'lucide:shield-half',
    href: ROUTES.ADMIN_ROLES,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    title: 'Clinic Management',
    description: 'Manage dental clinics and treatment rooms',
    icon: 'lucide:hospital',
    href: ROUTES.CLINICS,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    title: 'System Logs',
    description: 'View access logs and audit trails',
    icon: 'lucide:scroll-text',
    href: '#',
    gradient: 'from-orange-400 to-amber-500',
    glow: 'rgba(251,146,60,0.25)',
    disabled: true,
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
});

export default function AdminPage() {
  const { user } = useAuthStore();
  const { useUserProfiles, useRoles } = useAdmin();

  const { data: usersData } = useUserProfiles({ page: 1, limit: 1 });
  const { data: rolesData } = useRoles();

  const totalUsers = usersData?.meta?.total ?? '--';
  const totalRoles = rolesData?.data?.length ?? '--';

  const stats = [
    { label: 'Total Users', value: String(totalUsers), icon: 'lucide:users', color: 'text-blue-500', accent: 'bg-blue-500/10 dark:bg-blue-500/15' },
    { label: 'Active Clinics', value: '--', icon: 'lucide:hospital', color: 'text-emerald-500', accent: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
    { label: 'System Roles', value: String(totalRoles), icon: 'lucide:shield-check', color: 'text-violet-500', accent: 'bg-violet-500/10 dark:bg-violet-500/15' },
  ];

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <motion.div {...fadeUp(0)}>
        <div
          className="relative overflow-hidden rounded-[28px] border backdrop-blur-xl"
          style={{
            background: 'var(--surface-panel-bg)',
            borderColor: 'var(--surface-panel-border)',
            boxShadow: 'var(--surface-panel-shadow)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px]" style={{ background: 'var(--gradient-brand)' }} />
          <div className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)' }} />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(65,126,170,0.18) 0%, transparent 70%)' }} />

          <div className="relative px-8 py-7">
            <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">Admin Panel</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-smile-primary/10">
                <Icon icon="lucide:shield-check" width={22} className="text-smile-primary" />
              </div>
              <div>
                <h1 className="font-poppins text-3xl font-semibold">
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>
                    Admin Dashboard
                  </span>
                </h1>
                <p className="font-inter text-sm text-smile-title">
                  Welcome back, <span className="font-semibold text-smile-primary">{user?.fullName ?? 'Admin'}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-smile-primary/30 bg-smile-primary/10 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-primary shadow-[0_0_6px_rgba(65,126,170,0.8)]" />
              <span className="font-inter text-xs font-semibold text-smile-primary">Active session</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.1 + i * 0.08)}>
            <div
              className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{
                background: 'var(--surface-card-bg)',
                borderColor: 'var(--surface-card-border)',
                boxShadow: 'var(--surface-card-shadow)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)' }} />
              <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">{s.label}</p>
              <p className="mt-1.5 font-poppins text-3xl font-bold text-smile-primary-dark">{s.value}</p>
              <div className={`absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}>
                <Icon icon={s.icon} width={18} className={s.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Admin cards */}
      <motion.div {...fadeUp(0.35)}>
        <p className="mb-4 font-inter text-[10px] font-bold uppercase tracking-[3px] text-smile-description">Management</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {adminCards.map((card, i) => (
            <motion.div key={card.title} {...fadeUp(0.4 + i * 0.07)}>
              <Link
                href={card.disabled ? '#' : card.href}
                onClick={(e) => card.disabled && e.preventDefault()}
                className={`group relative flex flex-col overflow-hidden rounded-[22px] border backdrop-blur-xl transition-all ${card.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-[1.02]'
                  }`}
                style={{
                  background: 'var(--surface-card-bg)',
                  borderColor: 'var(--surface-card-border)',
                  boxShadow: card.disabled ? 'var(--surface-card-shadow)' : `var(--surface-card-shadow), 0 0 0 0 ${card.glow}`,
                }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[22px]"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)' }} />
                {!card.disabled && (
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(135deg, ${card.glow.replace('0.25', '0.06')} 0%, transparent 60%)` }} />
                )}
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
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
