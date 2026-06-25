'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

import { useAuthStore } from '@/features/auth/store/authStore';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { ROUTES } from '@/shared/constants/routes';

// ── design tokens (match the booking "Select Path" screen) ───────────────────
const TEAL = '#45F0CF';
const BLUE = '#92CDFD';

const NAV = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: 'lucide:layout-dashboard' },
  { label: 'Appointments', href: ROUTES.APPOINTMENTS, icon: 'lucide:calendar-clock' },
  { label: 'Patients', href: ROUTES.PATIENTS, icon: 'lucide:users' },
  { label: 'Imaging', href: '/dental-images', icon: 'lucide:scan' },
  { label: 'Clinics', href: ROUTES.CLINICS, icon: 'lucide:building-2' },
  { label: 'Specialties', href: ROUTES.SPECIALTIES, icon: 'lucide:stethoscope' },
  { label: 'Schedules', href: ROUTES.SCHEDULES, icon: 'lucide:calendar-days' },
  { label: 'Revenue', href: ROUTES.ADMIN_REVENUE, icon: 'lucide:bar-chart-3' },
  { label: 'Performance', href: '/admin/performance', icon: 'lucide:gauge' },
  { label: 'Assistant', href: ROUTES.CHAT, icon: 'lucide:bot-message-square' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) =>
    href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href);

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(129deg,#0A0D10 0%,#111416 50%,#0C1218 100%)' }}
    >
      {/* Ambient mesh */}
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(94% 115% at 15% 50%, rgba(91,150,196,0.08) 0%, rgba(91,150,196,0) 50%)' }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(103% 125% at 85% 30%, rgba(69,240,207,0.05) 0%, rgba(69,240,207,0) 50%)' }} />

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col justify-between border-r border-white/[0.12] bg-[rgba(29,32,35,0.6)] p-6 backdrop-blur-[10px] lg:flex">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: BLUE }}>
              <Icon icon="lucide:activity" width={22} color="#002D46" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-medium tracking-[-0.6px] text-[#CBE6FF]" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                S.M.I.L.E
              </span>
              <span className="text-[11px] uppercase tracking-[0.8px] text-[#C1C7CF]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Dental
              </span>
            </span>
          </Link>

          {/* Primary action */}
          <Link
            href={ROUTES.APPOINTMENT_NEW}
            className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#003450] transition hover:brightness-95"
            style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
          >
            <Icon icon="lucide:plus" width={16} /> New Booking
          </Link>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition"
                  style={
                    active
                      ? { background: 'rgba(255,255,255,0.05)', borderRight: `4px solid ${TEAL}`, color: '#CBE6FF', fontWeight: 700 }
                      : { color: '#C1C7CF' }
                  }
                >
                  <Icon icon={item.icon} width={18} style={{ color: active ? '#CBE6FF' : '#C1C7CF' }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-1">
          <Link href={ROUTES.PROFILE} className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-[#C1C7CF] transition hover:bg-white/5">
            <Icon icon="lucide:user" width={18} /> Profile
          </Link>
          <button
            onClick={() => { logout(); router.push(ROUTES.LOGIN); }}
            className="flex items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#C1C7CF] transition hover:bg-white/5"
          >
            <Icon icon="lucide:log-out" width={18} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header className="fixed left-0 top-0 z-20 flex h-20 w-full items-center justify-between border-b border-white/25 bg-[rgba(29,32,35,0.4)] px-8 backdrop-blur-[10px] lg:left-72 lg:w-[calc(100%-18rem)]">
        <nav className="hidden items-center gap-8 md:flex" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Link href={ROUTES.DASHBOARD} className="text-base font-medium text-[#C1C7CF] transition hover:text-white">Overview</Link>
          <Link href={ROUTES.PATIENTS} className="text-base font-medium text-[#C1C7CF] transition hover:text-white">Patients</Link>
          <Link href={ROUTES.ADMIN_REVENUE} className="text-base font-medium text-[#C1C7CF] transition hover:text-white">Reports</Link>
        </nav>

        <div className="flex items-center gap-5">
          <div className="relative hidden sm:block">
            <Icon icon="lucide:search" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C1C7CF]" />
            <input
              placeholder="Search patients, files..."
              className="h-[38px] w-64 rounded-full border border-white/10 bg-[rgba(50,53,56,0.5)] pl-10 pr-4 text-sm text-white placeholder:text-[#6B7280] outline-none focus:border-white/25"
            />
          </div>
          <NotificationBell />
          <Link
            href={ROUTES.PROFILE}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#323538] text-xs font-semibold text-white"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 lg:pl-72">
        <div className="pt-20">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;
