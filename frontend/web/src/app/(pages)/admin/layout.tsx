"use client";

import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants";

const SIDEBAR_ITEMS = [
    {
        label: "Admin",
        href: ROUTES.ADMIN,
        icon: "lucide:shield-check",
        description: "Overview & stats",
    },
    {
        label: "User Management",
        href: ROUTES.ADMIN_USERS,
        icon: "lucide:users",
        description: "Manage accounts",
    },
    {
        label: "KYC Management",
        href: ROUTES.ADMIN_KYC,
        icon: "lucide:id-card",
        description: "Identity reviews",
    },
    {
        label: "Refunds",
        href: ROUTES.ADMIN_REFUNDS,
        icon: "lucide:banknote",
        description: "Refund approvals",
    },
    {
        label: "Facility & Schedule",
        href: ROUTES.ADMIN_FACILITY,
        icon: "lucide:building-2",
        description: "Clinics, services, shifts, leaves",
    },
    {
        label: "Role Management",
        href: ROUTES.ADMIN_ROLES,
        icon: "lucide:shield-half",
        description: "Roles & permissions",
    },
    {
        label: "Audit Logs",
        href: ROUTES.ADMIN_AUDIT_LOGS,
        icon: "lucide:scroll-text",
        description: "System activity history",
    },
] as const;

const ADMIN_ROLES = ['CLINIC_ADMIN', 'SUPER_ADMIN'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();

    // useEffect(() => {
    //     if (!user) {
    //         router.replace(ROUTES.LOGIN);
    //         return;
    //     }
    //     // if (!user.roles?.some(r => ADMIN_ROLES.includes(r))) {
    //     //     router.replace('/');
    //     // }
    // }, [user, router]);

    return (
        <AppShell>
        <div className="relative min-h-screen overflow-hidden">
            {/* Floating PNG decorations */}
            <div className="pointer-events-none fixed right-[4%] top-[16%] opacity-[0.25] dark:opacity-[0.12]">
                <Image src="/images/glassy_tooth.png" alt="" width={90} height={110} className="object-contain" />
            </div>
            <div className="pointer-events-none fixed bottom-[10%] left-[2%] rotate-[15deg] opacity-[0.20] dark:opacity-[0.10]">
                <Image src="/images/glassy_tool.png" alt="" width={72} height={72} className="object-contain" />
            </div>

            <div className="relative mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
                {/* Sidebar */}
                <aside className="hidden w-[220px] shrink-0 lg:block">
                    <div
                        className="sticky top-[80px] overflow-hidden rounded-[24px] border backdrop-blur-xl"
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
                        {/* Top accent bar */}
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-smile-primary/60" />

                        <div className="relative p-3">
                            {/* Section label */}
                            <p className="mb-3 px-3 font-inter text-[9px] font-bold uppercase tracking-[3px] text-smile-description">
                                Admin Panel
                            </p>

                            <nav className="flex flex-col gap-1">
                                {SIDEBAR_ITEMS.map((item) => {
                                    const isActive =
                                        item.href === ROUTES.ADMIN
                                            ? pathname === ROUTES.ADMIN
                                            : pathname.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition-all ${isActive
                                                ? "bg-smile-primary text-white shadow-[0_4px_14px_rgba(65,126,170,0.35)]"
                                                : "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
                                                }`}
                                        >
                                            {isActive && (
                                                <div
                                                    className="pointer-events-none absolute inset-0 rounded-xl"
                                                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)" }}
                                                />
                                            )}
                                            <div
                                                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${isActive
                                                    ? "bg-white/20"
                                                    : "bg-smile-primary-light group-hover:bg-smile-primary group-hover:shadow-[0_2px_8px_rgba(65,126,170,0.3)]"
                                                    }`}
                                            >
                                                <Icon
                                                    icon={item.icon}
                                                    width={16}
                                                    className={isActive ? "text-white" : "text-smile-primary group-hover:text-white"}
                                                />
                                            </div>
                                            <div className="relative min-w-0">
                                                <p className="font-poppins text-[13px] font-semibold leading-tight">{item.label}</p>
                                                <p
                                                    className={`font-inter text-[10px] leading-tight ${isActive ? "text-white/70" : "text-smile-description"
                                                        }`}
                                                >
                                                    {item.description}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Divider */}
                            <div className="mx-2 my-3 h-px" style={{ background: "var(--surface-panel-border)" }} />

                            {/* Admin badge */}
                            <div
                                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                style={{ background: "var(--surface-panel-bg)", border: "1px solid var(--surface-panel-border)" }}
                            >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-smile-primary text-[11px] font-bold text-white">
                                    A
                                </div>
                                <div className="min-w-0">
                                    <p className="font-inter text-[11px] font-semibold text-smile-primary-dark">Admin Area</p>
                                    <p className="font-inter text-[9px] text-smile-description">System access</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile nav bar */}
                <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border px-2 py-2 backdrop-blur-xl lg:hidden"
                    style={{ background: "var(--surface-card-bg)", borderColor: "var(--surface-card-border)", boxShadow: "var(--surface-card-shadow)" }}
                >
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive =
                            item.href === ROUTES.ADMIN
                                ? pathname === ROUTES.ADMIN
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-2 transition-all ${isActive ? "bg-smile-primary text-white shadow-[0_2px_10px_rgba(65,126,170,0.4)]" : "text-smile-description hover:text-smile-primary"
                                    }`}
                            >
                                <Icon icon={item.icon} width={18} />
                                <span className="font-inter text-[9px] font-semibold">{item.label.split(" ")[0]}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Main content */}
                <main className="relative min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
            </div>
        </div>
        </AppShell>
    );
}
