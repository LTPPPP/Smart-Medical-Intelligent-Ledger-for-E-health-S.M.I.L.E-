'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { BookingWizard } from '@/features/appointment/components/BookingWizard';

const cardBase =
  'rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

export default function NewAppointmentPage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[928px] flex-col gap-8 px-4 py-10 sm:px-8 sm:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.APPOINTMENTS} className="flex items-center gap-2 font-inter text-sm text-smile-description transition hover:text-smile-primary">
            <Icon icon="lucide:arrow-left" width={16} /> Back to appointments
          </Link>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <h1 className="font-poppins text-[36px] font-bold leading-[40px] tracking-tight text-smile-primary-dark">
            Book an Appointment
          </h1>
          <p className="max-w-[672px] font-inter text-[17px] leading-7 text-smile-description">
            Follow the steps to choose how you&apos;d like to schedule, fill the details, and confirm.
          </p>
        </div>

        {/* Wizard */}
        <BookingWizard />

        {/* Chat assistant cross-link */}
        <Link
          href={ROUTES.CHAT}
          className={`${cardBase} group flex items-center gap-4 p-5 transition hover:border-smile-primary/40`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-smile-primary-light">
            <Icon icon="lucide:message-circle" width={20} className="text-smile-primary" />
          </span>
          <span className="flex flex-col">
            <span className="font-poppins text-sm font-semibold text-smile-primary-dark">Prefer chat? Try the Booking Assistant</span>
            <span className="font-inter text-xs text-smile-description">Describe what you need and let the assistant find a slot.</span>
          </span>
          <Icon icon="lucide:arrow-right" width={18} className="ml-auto text-smile-description opacity-0 transition group-hover:opacity-100 group-hover:text-smile-primary" />
        </Link>
      </div>
    </AppShell>
  );
}
