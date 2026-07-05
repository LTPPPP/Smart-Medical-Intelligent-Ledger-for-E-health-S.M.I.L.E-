'use client';

import Link from 'next/link';

import { Icon } from '@iconify/react';

import { ROUTES } from '@/shared/constants/routes';

const cardBase =
  'rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

// K5: entry points into the existing clinic/service/schedule management
// screens — they already implement full CRUD and the leave-approval
// workflow, they just weren't reachable from the admin console.
const CARDS = [
  {
    title: 'Phòng khám & phòng điều trị',
    desc: 'Quản lý thông tin phòng khám, giờ làm việc và phòng điều trị.',
    icon: 'lucide:hospital',
    href: ROUTES.CLINICS,
  },
  {
    title: 'Chuyên khoa',
    desc: 'Quản lý danh mục chuyên khoa của hệ thống.',
    icon: 'lucide:stethoscope',
    href: ROUTES.SPECIALTIES,
  },
  {
    title: 'Dịch vụ & bảng giá',
    desc: 'CRUD dịch vụ, gắn giá và thời lượng slot mặc định.',
    icon: 'lucide:list-checks',
    href: ROUTES.SERVICES,
  },
  {
    title: 'Ca làm việc',
    desc: 'Tạo ca và gán bác sĩ / y tá / lễ tân.',
    icon: 'lucide:calendar-clock',
    href: ROUTES.WORK_SHIFTS,
  },
  {
    title: 'Lịch làm việc bác sĩ',
    desc: 'Tạo, cập nhật và chuyển ca trực giữa các phòng khám.',
    icon: 'lucide:calendar-days',
    href: ROUTES.DOCTOR_SCHEDULES,
  },
  {
    title: 'Duyệt nghỉ phép',
    desc: 'Duyệt / từ chối đơn nghỉ phép (annual / sick / emergency).',
    icon: 'lucide:plane',
    href: ROUTES.DOCTOR_LEAVES,
  },
] as const;

export default function AdminFacilityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-inter text-xl font-bold text-smile-title">Cơ sở & lịch</h1>
        <p className="font-inter text-sm text-smile-description">
          Quản lý phòng khám, phòng điều trị, ca làm việc, lịch bác sĩ, nghỉ phép và dịch vụ.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`${cardBase} group flex flex-col gap-3 p-5 transition hover:border-smile-primary/40`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
              <Icon icon={c.icon} width={20} className="text-smile-primary" />
            </span>
            <h3 className="font-poppins text-[16px] font-semibold text-smile-title">{c.title}</h3>
            <p className="font-inter text-sm leading-[21px] text-smile-description">{c.desc}</p>
            <span className="mt-1 flex items-center gap-1 font-inter text-xs font-semibold text-smile-primary opacity-0 transition group-hover:opacity-100">
              Mở <Icon icon="lucide:arrow-right" width={13} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
