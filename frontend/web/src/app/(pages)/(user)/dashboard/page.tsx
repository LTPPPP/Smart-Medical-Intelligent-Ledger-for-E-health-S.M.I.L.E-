"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppNavigation } from "@/shared/components/layout/AppNavigation";
import { ROUTES } from "@/shared/constants";

// Stat Card
function StatCard({ label, value, icon, accent = false }: {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-smile-primary p-5 shadow-[0px_6px_24px_rgba(65,126,170,0.35)] transition-all hover:scale-[1.02]">
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-white/60">{label}</p>
        <p className="mt-1.5 font-poppins text-2xl font-bold text-white">{value}</p>
        <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Icon icon={icon} width={18} className="text-white" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all hover:scale-[1.02]"
      style={{
        background: "var(--surface-card-bg)",
        borderColor: "var(--surface-card-border)",
        boxShadow: "var(--surface-card-shadow)",
      }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-smile-primary/8" />
      <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">{label}</p>
      <p className="mt-1.5 font-poppins text-2xl font-bold text-smile-primary-dark">{value}</p>
      <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary-light">
        <Icon icon={icon} width={18} className="text-smile-primary" />
      </div>
    </div>
  );
}

// Quick Link Card
function QuickLink({ href, icon, label, description }: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-md transition-all hover:border-smile-primary/40 hover:shadow-md"
      style={{
        background: "var(--surface-panel-bg)",
        borderColor: "var(--surface-panel-border)",
      }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-smile-primary-light transition-all group-hover:bg-smile-primary group-hover:shadow-[0_4px_12px_rgba(65,126,170,0.35)]">
        <Icon icon={icon} width={20} className="text-smile-primary transition-colors group-hover:text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-poppins text-sm font-semibold text-smile-primary-dark">{label}</p>
        <p className="truncate font-inter text-xs text-smile-description">{description}</p>
      </div>
      <Icon icon="lucide:arrow-right" width={14} className="shrink-0 text-smile-description transition-all group-hover:translate-x-1 group-hover:text-smile-primary" />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();

  const quickLinks = [
    { href: ROUTES.PROFILE, icon: "lucide:user-circle", label: "My Profile", description: "View & edit your personal information" },
    { href: ROUTES.APPOINTMENTS, icon: "lucide:calendar-clock", label: "Appointments", description: "Manage your dental appointments" },
    { href: ROUTES.CLINICS, icon: "lucide:hospital", label: "Find Clinics", description: "Discover dental clinics near you" },
    { href: ROUTES.SERVICES, icon: "lucide:stethoscope", label: "Services", description: "Browse available dental services" },
  ];

  const stats = [
    { label: "Account Status", value: user?.status || "—", icon: "lucide:shield-check", accent: true },
    { label: "Roles", value: user?.roles?.length ?? 0, icon: "lucide:crown", accent: false },
    { label: "Email", value: user?.emailVerified ? "Verified" : "Pending", icon: "lucide:mail-check", accent: false },
    { label: "Phone", value: user?.phoneVerified ? "Verified" : "Pending", icon: "lucide:phone-check", accent: false },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/*  Animated liquid blobs (theme-aware) */}
      <div className="liquid-blob pointer-events-none absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
      <div className="liquid-blob-slow pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
      <div className="liquid-blob-fast pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />

      {/* Decorative images */}
      <div
        className="pointer-events-none absolute -right-10 top-6 h-[260px] w-[220px] opacity-[0.12] dark:opacity-[0.06]"
        style={{ transform: "matrix(-0.99,-0.13,-0.13,0.99,0,0)" }}
      >
        <Image src="/images/landing/glassy-block.svg" alt="" fill className="object-contain" />
      </div>
      <div className="pointer-events-none absolute bottom-10 left-10 rotate-[20deg] opacity-[0.10] dark:opacity-[0.05]">
        <Image src="/images/landing/glassy-tooth.svg" alt="" width={140} height={155} className="object-contain" />
      </div>

      <AppNavigation />

      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Welcome header */}
        <div
          className="mb-8 rounded-[28px] border px-8 py-7 backdrop-blur-md"
          style={{
            background: "var(--surface-panel-bg)",
            borderColor: "var(--surface-panel-border)",
            boxShadow: "var(--surface-panel-shadow)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[3px] text-smile-description">
                Dashboard
              </p>
              <h1 className="font-poppins text-4xl font-semibold text-smile-primary md:text-5xl">
                Welcome back{user?.fullName ? ", " + user.fullName.split(" ")[0] : ""}!
              </h1>
              <p className="mt-2 font-inter text-sm text-smile-title">
                Overview of your{" "}
                <span className="font-semibold text-smile-primary">S.M.I.L.E</span> account
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-full border border-red-300/50 bg-red-50 px-5 py-2.5 font-inter text-sm font-semibold text-red-500 transition-all hover:bg-red-100 hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)] disabled:opacity-60 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              {isLoggingOut
                ? <Icon icon="line-md:loading-twotone-loop" width={16} />
                : <Icon icon="lucide:log-out" width={16} />}
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left: Profile card */}
          <div className="lg:col-span-1">
            <div
              className="rounded-[24px] border p-6 backdrop-blur-md"
              style={{
                background: "var(--surface-card-bg)",
                borderColor: "var(--surface-card-border)",
                boxShadow: "var(--surface-card-shadow)",
              }}
            >
              {/* Card header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Profile</h2>
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center gap-1 rounded-full bg-smile-primary-light px-3 py-1 font-inter text-xs font-semibold text-smile-primary transition-colors hover:bg-smile-primary hover:text-white"
                >
                  Edit <Icon icon="lucide:pencil" width={10} />
                </Link>
              </div>

              {/* Avatar */}
              <div className="mb-5 flex flex-col items-center">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName || "Avatar"}
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] rounded-full object-cover ring-4 ring-smile-primary/20 ring-offset-2 ring-offset-background"
                  />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-smile-primary-light to-smile-card-gradient-end ring-4 ring-smile-primary/15 ring-offset-2 ring-offset-background">
                    <Icon icon="lucide:user" width={36} className="text-smile-primary" />
                  </div>
                )}
                <h3 className="mt-3 font-poppins text-base font-semibold text-smile-primary-dark">
                  {user?.fullName || "—"}
                </h3>
                <p className="font-inter text-sm text-smile-description">@{user?.username}</p>
                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                  {user?.roles?.map(r => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full bg-smile-primary-light px-2.5 py-0.5 font-inter text-[11px] font-semibold text-smile-primary"
                    >
                      <Icon icon="lucide:crown" width={9} />
                      {String(r).replace("ROLE_", "")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--surface-panel-border)" }}>
                {[
                  { icon: "lucide:mail", text: user?.email },
                  { icon: "lucide:phone", text: user?.phone || "No phone" },
                  { icon: "lucide:calendar", text: user?.createdAt ? "Since " + new Date(user.createdAt).toLocaleDateString() : "—" },
                ].map(row => (
                  <div key={row.icon} className="flex items-center gap-2.5 font-inter text-sm text-smile-title">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smile-primary-light">
                      <Icon icon={row.icon} width={13} className="text-smile-primary" />
                    </div>
                    <span className="truncate">{row.text}</span>
                  </div>
                ))}
              </div>

              {/* Verification badges */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { verified: user?.emailVerified, label: "Email" },
                  { verified: user?.phoneVerified, label: "Phone" },
                ].map(({ verified, label }) => (
                  <div
                    key={label}
                    className={
                      "flex items-center justify-center gap-1.5 rounded-xl py-2 font-inter text-xs font-semibold " +
                      (verified ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400")
                    }
                  >
                    <Icon icon={verified ? "lucide:check-circle" : "lucide:clock"} width={12} />
                    {label} {verified ? "✓" : "Pending"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick links + Roles + Tip */}
          <div className="space-y-6 lg:col-span-2">

            {/* Quick access */}
            <div
              className="rounded-[24px] border p-6 backdrop-blur-md"
              style={{
                background: "var(--surface-card-bg)",
                borderColor: "var(--surface-card-border)",
                boxShadow: "var(--surface-card-shadow)",
              }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-smile-primary-light">
                  <Icon icon="lucide:zap" width={16} className="text-smile-primary" />
                </div>
                <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Quick Access</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {quickLinks.map(link => <QuickLink key={link.href} {...link} />)}
              </div>
            </div>

            {/* Roles & Permissions */}
            {(user?.roles?.length ?? 0) > 0 && (
              <div
                className="rounded-[24px] border p-6 backdrop-blur-md"
                style={{
                  background: "var(--surface-card-bg)",
                  borderColor: "var(--surface-card-border)",
                  boxShadow: "var(--surface-card-shadow)",
                }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-smile-primary-light">
                    <Icon icon="lucide:shield" width={16} className="text-smile-primary" />
                  </div>
                  <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Roles & Permissions</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user?.roles?.map(r => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 rounded-full border border-smile-primary/20 bg-smile-primary-light px-3.5 py-1.5 font-inter text-xs font-semibold text-smile-primary"
                    >
                      <Icon icon="lucide:crown" width={11} />{r}
                    </span>
                  ))}
                </div>
                {(user?.permissions?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3" style={{ borderColor: "var(--surface-panel-border)" }}>
                    {user?.permissions?.map(p => (
                      <span key={p} className="inline-flex rounded-lg bg-surface-footer px-2.5 py-1 font-inter text-[11px] text-smile-description">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dental tip promo */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-smile-primary to-smile-primary-dark p-6 shadow-[0px_8px_30px_rgba(65,126,170,0.3)]">
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/8" />
              <div className="pointer-events-none absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute bottom-0 right-4 opacity-[0.15]">
                <Image src="/images/landing/glassy-tooth.svg" alt="" width={88} height={100} className="object-contain" />
              </div>
              <div className="relative z-10">
                <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[2.5px] text-white/60">
                  Dental Tip
                </p>
                <p className="font-poppins text-lg font-semibold leading-snug text-white">
                  Regular check-ups keep your smile bright!
                </p>
                <p className="mt-1 font-inter text-sm text-white/65">
                  Schedule your next appointment today.
                </p>
                <Link
                  href={ROUTES.APPOINTMENTS}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 font-inter text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:shadow-lg"
                >
                  Book Now <Icon icon="lucide:arrow-right" width={13} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
