'use client';
import Link from 'next/link';
import { Icon } from '@iconify/react';

import { ROUTES } from '@/shared/constants/routes';
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';

import { useAuthStore } from '@/features/auth/store/authStore';
import { AppNavigation } from '@/shared/components/layout/AppNavigation';

export default function AdminPage() {
  const { user } = useAuthStore();

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage system users, lock/unlock accounts, assign roles',
      icon: 'mdi:account-multiple',
      href: ROUTES.ADMIN_USERS,
      color: 'bg-blue-500',
    },
    {
      title: 'Role Management',
      description: 'Create and manage roles, assign permissions',
      icon: 'mdi:shield-account',
      href: ROUTES.ADMIN_ROLES,
      color: 'bg-purple-500',
    },
    {
      title: 'Clinic Management',
      description: 'Manage dental clinics and treatment rooms',
      icon: 'mdi:hospital-building',
      href: ROUTES.CLINICS,
      color: 'bg-green-500',
    },
    {
      title: 'System Logs',
      description: 'View access logs and audit trails',
      icon: 'mdi:text-box-search',
      href: '#',
      color: 'bg-orange-500',
      disabled: true,
    },
  ];

  return (
    // <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
    <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
                <Icon icon="mdi:shield-crown" width={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100 mt-1">Welcome back, {user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {adminCards.map((card, index) => (
              <Link
                key={index}
                href={card.disabled ? '#' : card.href}
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all ${
                  card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
                onClick={(e) => card.disabled && e.preventDefault()}
              >
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon icon={card.icon} className="text-white" width={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.description}</p>
                {card.disabled && (
                  <span className="inline-block mt-3 text-xs text-orange-600 font-medium">
                    Coming Soon
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon icon="mdi:account-group" className="text-blue-600" width={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">--</div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon icon="mdi:hospital-building" className="text-green-600" width={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">--</div>
                  <div className="text-sm text-gray-500">Active Clinics</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Icon icon="mdi:shield-account" className="text-purple-600" width={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">--</div>
                  <div className="text-sm text-gray-500">System Roles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    // </ProtectedRoute>
  );
}