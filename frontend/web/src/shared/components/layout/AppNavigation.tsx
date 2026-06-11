'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const CLINICAL_ROLES = ['DENTIST', 'RECEPTIONIST', 'NURSE', 'CLINIC_ADMIN'];
const ADMIN_ROLES = ['ADMIN', 'CLINIC_ADMIN', 'SUPER_ADMIN'];

export const AppNavigation = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: 'mdi:view-dashboard',
    },
    {
      label: 'Appointments',
      href: ROUTES.APPOINTMENTS,
      icon: 'mdi:calendar-clock',
      requiredRoles: ['PATIENT', ...CLINICAL_ROLES],
    },
    {
      label: 'Patients',
      href: ROUTES.PATIENTS,
      icon: 'mdi:account-multiple',
      requiredRoles: CLINICAL_ROLES,
    },
    {
      label: 'Examinations',
      href: ROUTES.EXAMINATIONS,
      icon: 'mdi:stethoscope',
      requiredRoles: ['DENTIST', 'NURSE', 'CLINIC_ADMIN'],
    },
    {
      label: 'Schedule',
      href: ROUTES.SCHEDULES,
      icon: 'mdi:calendar-account',
      requiredRoles: ['DENTIST', 'CLINIC_ADMIN'],
    },
    {
      label: 'Payments',
      href: ROUTES.PAYMENTS,
      icon: 'mdi:credit-card',
      requiredRoles: ['PATIENT', 'RECEPTIONIST', 'CLINIC_ADMIN'],
    },
    {
      label: 'Services',
      href: ROUTES.SERVICES,
      icon: 'mdi:medical-bag',
    },
    {
      label: 'Clinics',
      href: ROUTES.CLINICS,
      icon: 'mdi:hospital-building',
    },
    {
      label: 'Admin',
      href: ROUTES.ADMIN,
      icon: 'mdi:shield-crown',
      requiredRoles: ADMIN_ROLES,
    },
  ];

  const hasAccess = (item: NavItem) => {
    const roles = user.roles.map((role) => role.replace(/^ROLE_/, ''));
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.some((role) => roles.includes(role));
    }
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.some((permission) =>
        user.permissions.includes(permission),
      );
    }
    return true;
  };

  const filteredItems = navItems.filter(hasAccess);

  return (
    <nav className="sticky top-0 z-50 border-b border-smile-border bg-white/80 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-smile-primary rounded-xl flex items-center justify-center shadow-[0_4px_10px_rgba(65,126,170,0.35)]">
              <Icon icon="mdi:tooth" className="text-white" width={20} />
            </div>
            <span className="font-poppins font-semibold text-lg tracking-wide text-smile-primary-dark">S.M.I.L.E</span>
          </Link>

          {/* Nav Links */}
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-3">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg font-inter text-sm font-medium transition-colors',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-smile-primary-light text-smile-primary'
                    : 'text-smile-title hover:bg-smile-footer-bg hover:text-smile-primary',
                )}
              >
                <Icon icon={item.icon} width={16} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.PROFILE}
              className="flex items-center gap-2 rounded-full border border-smile-border bg-white/70 px-3 py-1.5 hover:border-smile-primary hover:bg-smile-footer-bg transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-smile-primary flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-xs">
                  {user.fullName?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <span className="font-inter text-sm font-medium text-smile-title hidden sm:block">
                {user.fullName}
              </span>
              <Icon icon="lucide:chevron-down" width={14} className="text-smile-description hidden sm:block" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
