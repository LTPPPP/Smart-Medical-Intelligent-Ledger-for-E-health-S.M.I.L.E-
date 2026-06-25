'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';

import { useAuthStore } from '@/features/auth/store/authStore';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { ROUTES } from '@/shared/constants/routes';
import { navForKind, resolveDashboardKind } from '@/shared/constants/nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMobileOpen(false), [pathname]);

  const kind = resolveDashboardKind(user?.roles);
  const nav = navForKind(kind);

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) =>
    href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href);

  const handleSignOut = () => {
    if (confirmingLogout) {
      logout();
      router.push(ROUTES.LOGIN);
    } else {
      setConfirmingLogout(true);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      logoutTimer.current = setTimeout(() => setConfirmingLogout(false), 3000);
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-7">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="S.M.I.L.E" width={38} height={38} priority />
          <span className="flex flex-col leading-tight">
            <span className="font-poppins text-xl font-semibold tracking-[2px] text-smile-primary dark:text-[#92CDFD]">
              S.M.I.L.E
            </span>
            <span className="font-inter text-[10px] uppercase tracking-[1.5px] text-smile-description">
              Dental Platform
            </span>
          </span>
        </Link>

        {/* Primary action */}
        <Link
          href={ROUTES.APPOINTMENT_NEW}
          className="flex items-center justify-center gap-2 rounded-full bg-smile-primary px-4 py-3 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_24px_rgba(65,126,170,0.5)] active:scale-[0.98]"
        >
          <Icon icon="lucide:plus" width={16} /> New Booking
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 font-inter text-sm transition-all ${
                  active
                    ? 'bg-smile-primary font-semibold text-white shadow-[0_4px_14px_rgba(65,126,170,0.35)]'
                    : 'text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary'
                }`}
              >
                {active && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)' }}
                  />
                )}
                <Icon
                  icon={item.icon}
                  width={18}
                  className={active ? 'relative text-white' : 'relative text-smile-primary'}
                />
                <span className="relative">{item.label}</span>
                {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-1 pt-4">
        <Link
          href={ROUTES.PROFILE}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary"
        >
          <Icon icon="lucide:user-circle" width={18} className="text-smile-primary" /> Profile
        </Link>
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-inter text-sm transition-all ${
            confirmingLogout
              ? 'bg-red-100 text-red-600 dark:bg-red-950/40'
              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          <Icon icon={confirmingLogout ? 'lucide:alert-triangle' : 'lucide:log-out'} width={18} />
          {confirmingLogout ? 'Click again to confirm' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Liquid blobs (theme-aware via CSS vars) */}
      <div className="liquid-blob pointer-events-none fixed -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
      <div className="liquid-blob-slow pointer-events-none fixed -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
      <div className="liquid-blob-fast pointer-events-none fixed bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />

      {/* ── Sidebar (desktop) ── */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col border-r p-6 backdrop-blur-xl lg:flex"
        style={{ background: 'var(--surface-nav-bg)', borderColor: 'var(--surface-nav-border)' }}
      >
        {sidebarBody}
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r p-6 backdrop-blur-xl lg:hidden"
              style={{ background: 'var(--surface-nav-bg)', borderColor: 'var(--surface-nav-border)' }}
            >
              {sidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Topbar ── */}
      <header
        className="fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-xl sm:px-8 lg:left-72 lg:w-[calc(100%-18rem)]"
        style={{ background: 'var(--surface-nav-bg)', borderColor: 'var(--surface-nav-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary lg:hidden"
            aria-label="Open menu"
          >
            <Icon icon="lucide:menu" width={20} />
          </button>
          <div className="relative hidden sm:block">
            <Icon icon="lucide:search" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description" />
            <input
              placeholder="Search patients, files..."
              className="h-[38px] w-56 rounded-full border px-4 pl-10 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/40 lg:w-64"
              style={{ background: 'var(--surface-input-bg)', borderColor: 'var(--surface-input-border)' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary"
              aria-label="Toggle theme"
            >
              <Icon icon={resolvedTheme === 'dark' ? 'lucide:sun' : 'lucide:moon'} width={18} />
            </button>
          )}
          <NotificationBell />
          <Link
            href={ROUTES.PROFILE}
            className="flex h-9 items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-all hover:border-smile-primary/40"
            style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)' }}
          >
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.fullName || 'Avatar'} width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-smile-primary text-xs font-semibold text-white">
                {initials}
              </span>
            )}
            <span className="hidden font-inter text-sm font-medium text-smile-title sm:block">
              {user?.fullName?.split(' ')[0] ?? 'Account'}
            </span>
          </Link>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 lg:pl-72">
        <div className="pt-16">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;
