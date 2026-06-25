'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';

const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

const CARDS = [
  { title: 'Work & On-Call Schedules', desc: 'Create, update and transfer doctor shifts across clinics.', icon: 'lucide:calendar-days', href: ROUTES.DOCTOR_SCHEDULES },
  { title: 'My Schedule', desc: 'View and register your personal examination schedule.', icon: 'lucide:user-round', href: ROUTES.MY_SCHEDULE },
  { title: 'Leaves', desc: 'Request and review doctor leave.', icon: 'lucide:plane', href: ROUTES.DOCTOR_LEAVES },
];

export default function SchedulesPage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>Schedule Management</h1>
          <p className="text-sm text-[#C1C7CF]">Manage work schedules, personal schedules and leave.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href} className={`${cardBase} group flex flex-col gap-3 p-6 transition hover:border-white/25`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-[#323538]">
                <Icon icon={c.icon} width={22} style={{ color: BLUE }} />
              </span>
              <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>{c.title}</h3>
              <p className="text-sm leading-[23px] text-[#C1C7CF]">{c.desc}</p>
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: '#45F0CF' }}>
                Open <Icon icon="lucide:arrow-right" width={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
