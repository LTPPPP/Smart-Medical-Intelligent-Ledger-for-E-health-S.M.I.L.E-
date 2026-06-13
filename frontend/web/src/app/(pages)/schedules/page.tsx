'use client';

import Link from 'next/link';

import { Icon } from '@iconify/react';

import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoLeaves, demoSchedules } from '@/shared/data/clinicalDemoData';

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
    <OperationsLayout
      title="Schedule"
      description="Plan doctor shifts, review utilization, and handle leave requests before they affect patient bookings."
      icon="lucide:calendar-days"
      actions={[
        { label: 'New doctor schedule', href: ROUTES.DOCTOR_SCHEDULE_NEW, icon: 'lucide:plus', variant: 'primary' },
        { label: 'Request leave', href: ROUTES.DOCTOR_LEAVE_NEW, icon: 'lucide:calendar-off' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Schedules" value={demoSchedules.length} detail="Demo shifts ready" tone="brand" />
        <MetricCard label="Booked slots" value={demoSchedules.reduce((sum, item) => sum + item.bookedAppointments, 0)} detail="Across demo shifts" tone="blue" />
        <MetricCard label="Leave requests" value={demoLeaves.length} detail="Pending review" tone="orange" />
        <MetricCard label="Utilization" value="45%" detail="Demo average" tone="green" />
      </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {scheduleAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
            className="group border border-smile-border/50 bg-white p-5 hover:border-smile-primary/25 hover:bg-smile-primary/5"
            >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-smile-primary/5 text-smile-primary">
                <Icon icon={area.icon} width={20} />
              </div>
            <h2 className="font-semibold text-smile-primary-dark">{area.title}</h2>
            <p className="mt-2 text-sm leading-6 text-smile-title">{area.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-smile-primary">
                Open workspace
                <Icon icon="lucide:arrow-right" width={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
    </OperationsLayout>
  );
}
