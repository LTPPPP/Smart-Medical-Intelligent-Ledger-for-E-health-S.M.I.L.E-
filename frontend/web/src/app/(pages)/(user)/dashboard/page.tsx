
"use client";
import Image from "next/image";
import Link from "next/link";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { useAuthStore } from "@/features/auth/store/authStore";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { ROUTES } from "@/shared/constants";

// Float animation helper
const floatAnim = (y = 14, duration = 5, delay = 0) => ({
  animate: { y: [0, -y, 0], rotate: [0, 2, -1.5, 0] },
  transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const },
});

// Glass card wrapper
function GlassCard({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border backdrop-blur-xl ${className}`}
      style={{
        background: "var(--surface-card-bg)",
        borderColor: "var(--surface-card-border)",
        boxShadow: "var(--surface-card-shadow)",
      }}
    >
      {/* Glass shimmer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)" }}
      />
      {/* Blue accent top bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-smile-primary/60"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, icon, accent = false }: {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-2xl"
        style={{
          background: "linear-gradient(135deg, var(--color-smile-primary,#417eaa) 0%, #2a6494 65%, #0a2e4a 100%)",
          boxShadow: "0 6px 24px rgba(65,126,170,0.45)",
        }}
      >
        {/* Glass shine */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)" }}
        />
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        {/* Green accent pulse dot */}
        <span className="absolute left-4 top-4 h-1.5 w-1.5 rounded-full bg-[#5eff88] shadow-[0_0_6px_rgba(94,255,136,0.6)]" />
        <p className="mt-3 font-inter text-[10px] font-semibold uppercase tracking-[2px] text-white/60">{label}</p>
        <p className="mt-1.5 font-poppins text-2xl font-bold text-white">{value}</p>
        <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <Icon icon={icon} width={18} className="text-white" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
      style={{
        background: "var(--surface-card-bg)",
        borderColor: "var(--surface-card-border)",
        boxShadow: "var(--surface-card-shadow)",
      }}
    >
      {/* Glass shine */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)" }}
      />
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
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all hover:border-smile-primary/40 hover:shadow-[0_4px_20px_rgba(65,126,170,0.12)]"
      style={{
        background: "var(--surface-panel-bg)",
        borderColor: "var(--surface-panel-border)",
      }}
    >
      {/* Green shimmer on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, rgba(65,126,170,0.06) 0%, transparent 60%)" }}
      />
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-smile-primary-light transition-all group-hover:bg-smile-primary group-hover:shadow-[0_4px_12px_rgba(65,126,170,0.35)]">
        <Icon icon={icon} width={20} className="text-smile-primary transition-colors group-hover:text-white" />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="font-poppins text-sm font-semibold text-smile-primary-dark">{label}</p>
        <p className="truncate font-inter text-xs text-smile-description">{description}</p>
      </div>
      <Icon icon="lucide:arrow-right" width={14} className="relative shrink-0 text-smile-description transition-all group-hover:translate-x-1 group-hover:text-smile-primary" />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();

    const quickLinks = [
        { href: ROUTES.PROFILE, icon: "lucide:user-circle", label: "My Profile", description: "View & edit your personal information" },
        { href: ROUTES.CLINICS, icon: "lucide:hospital", label: "Find Clinics", description: "Discover dental clinics near you" },
        { href: ROUTES.CHAT, icon: "lucide:bot-message-square", label: "Booking Assistant", description: "Chat to book or manage appointments" },
        // Services is hidden temporarily because the service feature module is not present in this branch.
        // { href: ROUTES.SERVICES, icon: "lucide:stethoscope", label: "Services", description: "Browse available dental services" },
    ];

  const stats = [
    { label: "Account Status", value: user?.status || "—", icon: "lucide:shield-check", accent: true },
    { label: "Roles", value: user?.roles?.length ?? 0, icon: "lucide:crown", accent: false },
    { label: "Email", value: user?.emailVerified ? "Verified" : "Pending", icon: "lucide:mail-check", accent: false },
    { label: "Phone", value: user?.phoneVerified ? "Verified" : "Pending", icon: "lucide:phone-check", accent: false },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">

      {/* Liquid blobs */}
      <div className="liquid-blob pointer-events-none absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
      <div className="liquid-blob-slow pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
      <div className="liquid-blob-fast pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />
      {/* Green accent glow blob */}
      <div
        className="liquid-blob pointer-events-none absolute bottom-28 right-10 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(94,255,136,0.12) 0%, transparent 70%)" }}
      />

      {/* Floating PNG decorations */}
      <motion.div
        {...floatAnim(14, 6, 0)}
        className="pointer-events-none absolute right-[5%] top-[14%] opacity-[0.42] dark:opacity-[0.22]"
      >
        <Image src="/images/glassy_tooth.png" alt="" width={110} height={130} className="object-contain" />
      </motion.div>

      <motion.div
        {...floatAnim(10, 7, 1.3)}
        className="pointer-events-none absolute bottom-[12%] left-[3%] rotate-[15deg] opacity-[0.35] dark:opacity-[0.18]"
      >
        <Image src="/images/glassy_tool.png" alt="" width={88} height={88} className="object-contain" />
      </motion.div>

      <motion.div
        {...floatAnim(16, 9, 0.7)}
        className="pointer-events-none absolute bottom-[5%] right-[7%] rotate-[8deg] opacity-[0.38] dark:opacity-[0.20]"
      >
        <Image src="/images/glassy_teeth.png" alt="" width={130} height={100} className="object-contain" />
      </motion.div>

      <motion.div
        {...floatAnim(10, 6.5, 3.4)}
        className="pointer-events-none absolute left-[7%] top-[10%] opacity-[0.32] dark:opacity-[0.16]"
      >
        <Image src="/images/glassy_feature-scheduling.png" alt="" width={68} height={68} className="object-contain" />
      </motion.div>

      <motion.div
        {...floatAnim(12, 7.5, 1.8)}
        className="pointer-events-none absolute right-[2%] top-[52%] opacity-[0.30] dark:opacity-[0.14]"
      >
        <Image src="/images/glassy_feature-records.png" alt="" width={62} height={62} className="object-contain" />
      </motion.div>

      {/* Header */}
      <LandingHeader />

      <main className="relative mx-auto max-w-6xl px-4 py-10">

        {/* Welcome banner */}
        <div
          className="relative mb-8 overflow-hidden rounded-[28px] border backdrop-blur-xl"
          style={{
            background: "var(--surface-panel-bg)",
            borderColor: "var(--surface-panel-border)",
            boxShadow: "var(--surface-panel-shadow)",
          }}
        >
          {/* Blue gradient top bar */}
          <div
            className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px] bg-smile-primary"
          />
          {/* Glass shimmer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }}
          />
          {/* Doctor image — faded right side */}
          <div className="pointer-events-none absolute bottom-0 right-6 hidden h-full w-[190px] md:block">
            <Image
              src="/images/doctor.png"
              alt=""
              fill
              className="object-contain object-bottom"
            />
          </div>
          {/* Green glow orb bottom-right */}
          <div
            className="pointer-events-none absolute -bottom-8 right-0 h-52 w-52 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(94,255,136,0.15) 0%, transparent 70%)" }}
          />

          <div className="relative px-8 py-7">
            <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
              Dashboard
            </p>
            <h1 className="font-poppins text-4xl font-semibold text-smile-primary md:text-5xl">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                Welcome back
              </span>
              {user?.fullName ? (
                <>
                  {", "}
                  <span style={{ color: "#5eff88", textShadow: "0 0 28px rgba(94,255,136,0.45)" }}>
                    {user.fullName.split(" ")[0]}
                  </span>
                  {"!"}
                </>
              ) : "!"}
            </h1>
            <p className="mt-2 font-inter text-sm text-smile-title">
              Overview of your{" "}
              <span className="font-semibold text-smile-primary">S.M.I.L.E</span> account
            </p>
            {/* Active session badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#5eff88]/30 bg-[#5eff88]/10 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5eff88] shadow-[0_0_6px_#5eff88]" />
              <span className="font-inter text-xs font-semibold text-[#1e6b38] dark:text-[#5eff88]">
                Active session
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Profile card */}
          <div className="lg:col-span-1">
            <GlassCard>
              <div className="p-6">
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
                    <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-smile-primary-light to-smile-primary/20 ring-4 ring-smile-primary/15 ring-offset-2 ring-offset-background">
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
                        (verified
                          ? "bg-[rgba(94,255,136,0.12)] text-[#1e6b38] dark:bg-[rgba(94,255,136,0.08)] dark:text-[#5eff88]"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400")
                      }
                    >
                      <Icon icon={verified ? "lucide:check-circle" : "lucide:clock"} width={12} />
                      {label} {verified ? "✓" : "Pending"}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-2">

            {/* Quick access */}
            <GlassCard>
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: "linear-gradient(135deg, rgba(94,255,136,0.25) 0%, rgba(65,126,170,0.20) 100%)" }}
                  >
                    <Icon icon="lucide:zap" width={16} className="text-smile-primary" />
                  </div>
                  <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Quick Access</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {quickLinks.map(link => <QuickLink key={link.href} {...link} />)}
                </div>
              </div>
            </GlassCard>

            {/* Roles & Permissions */}
            {(user?.roles?.length ?? 0) > 0 && (
              <GlassCard>
                <div className="p-6">
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
              </GlassCard>
            )}

            {/* Dental tip promo */}
            <div
              className="relative overflow-hidden rounded-[24px] p-6"
              style={{
                background: "linear-gradient(135deg, var(--color-smile-primary,#417eaa) 0%, #1e5a8a 55%, #0a2e4a 100%)",
                boxShadow: "0 8px 32px rgba(65,126,170,0.35)",
              }}
            >
              {/* Glass shine */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[24px]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)" }}
              />
              {/* Green glow bottom-right */}
              <div
                className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/5"
              />
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/8" />
              <div className="pointer-events-none absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
              {/* Green accent top bar */}
              <div
                className="absolute inset-x-0 top-0 h-[3px] rounded-t-[24px]"
                style={{ background: "linear-gradient(90deg, #5eff88 0%, rgba(94,255,136,0.2) 70%, transparent 100%)" }}
              />
              {/* Tooth decoration */}
              <div className="pointer-events-none absolute bottom-0 right-4 opacity-[0.22]">
                <Image src="/images/glassy_tooth.png" alt="" width={90} height={106} className="object-contain" />
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
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#5eff88]/40 bg-[#5eff88]/15 px-4 py-2 font-inter text-sm font-semibold text-[#5eff88] backdrop-blur-sm transition-all hover:bg-[#5eff88]/28 hover:shadow-[0_4px_16px_rgba(94,255,136,0.3)]"
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
