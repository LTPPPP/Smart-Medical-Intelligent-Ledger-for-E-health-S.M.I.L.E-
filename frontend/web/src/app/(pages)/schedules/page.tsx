'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ROUTES } from '@/shared/constants/routes';

const scheduleAreas = [
  {
    title: 'Doctor schedules',
    description: 'Review shifts in calendar or list view and manage schedule status.',
    href: ROUTES.DOCTOR_SCHEDULES,
    icon: 'lucide:calendar-days',
  },
  {
    title: 'Leave requests',
    description: 'Review doctor leave requests, approvals, and rejection reasons.',
    href: ROUTES.DOCTOR_LEAVES,
    icon: 'lucide:calendar-off',
  },
];

export default function SchedulesPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <p className="mt-1 text-sm text-gray-600">Choose the scheduling workspace you need.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {scheduleAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group border border-gray-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon icon={area.icon} width={20} />
              </div>
              <h2 className="font-semibold text-gray-900">{area.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{area.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                Open workspace
                <Icon icon="lucide:arrow-right" width={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
