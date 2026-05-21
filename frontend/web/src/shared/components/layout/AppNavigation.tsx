'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

export const AppNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
      // requiredPermissions: ['APPOINTMENT_READ'],
    },
    {
      label: 'Services',
      href: ROUTES.SERVICES,
      icon: 'mdi:medical-bag',
    },
    {
      label: 'Specialties',
      href: ROUTES.SPECIALTIES,
      icon: 'mdi:tag-multiple',
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
      // requiredRoles: ['ROLE_ADMIN'],
    },
    {
      label: 'Patients',
      href: ROUTES.PATIENTS,
      icon: 'mdi:account-multiple',
      // requiredPermissions: ['MEDICAL_RECORD_READ'],
    },
    {
      label: 'Doctors Schedule',
      href: ROUTES.DOCTOR_SCHEDULES,
      icon: 'mdi:account-multiple',
    },
    {
      label: 'Doctors Management',
      href: ROUTES.DOCTOR_LEAVES,
      icon: 'mdi:account-multiple',
    },
  ];

  const hasAccess = (item: NavItem) => {
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.some((role) => user.roles.includes(role));
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
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:tooth" className="text-white" width={24} />
            </div>
            <span className="font-bold text-xl text-gray-800">S.M.I.L.E</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <Icon icon={item.icon} width={20} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.PROFILE}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.fullName}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
