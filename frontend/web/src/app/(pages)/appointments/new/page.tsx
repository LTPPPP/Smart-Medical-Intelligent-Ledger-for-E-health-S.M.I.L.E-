'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { BookingTabsDark } from '@/features/appointment/components/BookingTabsDark';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

export default function NewAppointmentPage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[928px] flex-col gap-8 px-8 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.APPOINTMENTS} className="flex items-center gap-2 text-sm text-[#C1C7CF] transition hover:text-white">
            <Icon icon="lucide:arrow-left" width={16} /> Back to appointments
          </Link>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <h1
            className="text-[36px] font-bold leading-[40px] tracking-[-0.9px] text-white"
            style={{ fontFamily: 'Public Sans, sans-serif' }}
          >
            Book an Appointment
          </h1>
          <p className="max-w-[672px] text-[18px] leading-7 text-[#C1C7CF]" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Pick how you&apos;d like to schedule, fill the details, and confirm.
          </p>
        </div>

        {/* Booking form (4 variants) */}
        <BookingTabsDark />

        {/* Chat assistant cross-link */}
        <Link
          href={ROUTES.CHAT}
          className={`${cardBase} group flex items-center gap-4 p-5 transition hover:border-white/25`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-[#323538]">
            <Icon icon="lucide:message-circle" width={20} style={{ color: BLUE }} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Prefer chat? Try the Booking Assistant
            </span>
            <span className="text-xs text-[#C1C7CF]">Describe what you need and let the assistant find a slot.</span>
          </span>
          <Icon icon="lucide:arrow-right" width={18} className="ml-auto opacity-0 transition group-hover:opacity-100" style={{ color: TEAL }} />
        </Link>
      </div>
    </AppShell>
  );
}
