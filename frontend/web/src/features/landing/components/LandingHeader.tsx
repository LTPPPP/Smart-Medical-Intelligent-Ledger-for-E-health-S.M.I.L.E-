

"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ROUTES } from "@/shared/constants";

import { ArrowButton } from "./ArrowButton";

const NAV_ITEMS = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "lucide:layout-dashboard" },
    { label: "Appointments", href: ROUTES.APPOINTMENTS, icon: "lucide:calendar-clock" },
    { label: "Services", href: ROUTES.SERVICES, icon: "lucide:stethoscope" },
    { label: "Clinics", href: ROUTES.CLINICS, icon: "lucide:hospital" },
] as const;

const ACCOUNT_ITEMS = [
    { label: "Profile", href: ROUTES.PROFILE, icon: "lucide:user-circle" },
] as const;

export function LandingHeader() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [confirmingLogout, setConfirmingLogout] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const { user } = useAuthStore();
    const { logout, isLoggingOut } = useAuth();

    useEffect(() => setMounted(true), []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close dropdown on route change
    useEffect(() => { if (pathname != null) setDropdownOpen(false); }, [pathname]);

    // Reset the logout confirm step whenever the dropdown closes
    useEffect(() => {
        if (!dropdownOpen) setConfirmingLogout(false);
    }, [dropdownOpen]);

    // Auto-revert the logout confirm step after 3s of inactivity
    useEffect(() => {
        if (!confirmingLogout) return;
        const t = setTimeout(() => setConfirmingLogout(false), 3000);
        return () => clearTimeout(t);
    }, [confirmingLogout]);

    const handleSignOutClick = () => {
        if (confirmingLogout) {
            logout();
        } else {
            setConfirmingLogout(true);
        }
    };

    return (
        <header
            className="sticky top-0 z-50 w-full backdrop-blur-[20px]"
            style={{
                background: "var(--surface-nav-bg)",
                borderBottom: "1px solid var(--surface-nav-border)",
            }}
        >
            <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
                {/* Logo */}
                <Link href={ROUTES.HOME} className="flex items-center gap-2.5">
                    <Image
                        src="/images/logo.png"
                        alt="S.M.I.L.E Logo"
                        width={36}
                        height={36}
                        priority
                    />
                    <span className="font-poppins text-xl font-semibold tracking-[3px] text-smile-primary dark:text-[#92CDFD]">
                        S.M.I.L.E
                    </span>
                </Link>

                {/* Right actions */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary/10 md:flex dark:border-[rgba(146,205,253,0.25)] dark:bg-[rgba(146,205,253,0.06)] dark:text-[#92CDFD] dark:hover:bg-[rgba(146,205,253,0.12)]"
                    >
                        <Icon icon="lucide:stethoscope" width={16} />
                        Pairing
                    </button>
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary/10 md:flex dark:border-[rgba(69,240,207,0.25)] dark:bg-[rgba(69,240,207,0.06)] dark:text-[#45F0CF] dark:hover:bg-[rgba(69,240,207,0.12)]"
                    >
                        <Icon icon="lucide:layout-grid" width={16} />
                        Application
                    </button>

                    {/* Utility icon buttons */}
                    <div className="hidden items-center gap-0.5 md:flex">
                        <button
                            type="button"
                            className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/30 hover:text-smile-primary dark:text-[#8B9199] dark:hover:bg-white/[0.06] dark:hover:text-[#92CDFD]"
                            aria-label="Language"
                        >
                            <Icon icon="lucide:globe" width={17} />
                        </button>
                        {mounted && (
                            <button
                                type="button"
                                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                                className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/30 hover:text-smile-primary dark:text-[#8B9199] dark:hover:bg-white/[0.06] dark:hover:text-[#92CDFD]"
                                aria-label="Toggle theme"
                            >
                                {resolvedTheme === "dark"
                                    ? <Icon icon="lucide:sun" width={17} />
                                    : <Icon icon="lucide:moon" width={17} />}
                            </button>
                        )}
                        <button
                            type="button"
                            className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/30 hover:text-smile-primary dark:text-[#8B9199] dark:hover:bg-white/[0.06] dark:hover:text-[#92CDFD]"
                            aria-label="Notifications"
                        >
                            <Icon icon="lucide:bell" width={17} />
                        </button>
                    </div>

                    {/* Auth area */}
                    {user ? (
                        /* Avatar + Facebook-style dropdown */
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(o => !o)}
                                className="flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 transition-all hover:border-smile-primary/40"
                                style={{
                                    background: "var(--surface-card-bg)",
                                    borderColor: "var(--surface-card-border)",
                                }}
                            >
                                {/* Avatar */}
                                {user.avatarUrl ? (
                                    <Image
                                        src={user.avatarUrl}
                                        alt={user.fullName || "Avatar"}
                                        width={28}
                                        height={28}
                                        className="h-7 w-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-smile-primary text-xs font-bold text-white">
                                        {user.fullName?.charAt(0).toUpperCase() ?? "?"}
                                    </div>
                                )}
                                <span className="hidden font-inter text-sm font-medium text-smile-title sm:block">
                                    {user.fullName?.split(" ")[0]}
                                </span>
                                <Icon
                                    icon="lucide:chevron-down"
                                    width={13}
                                    className={`text-smile-description transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {/* Dropdown panel */}
                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.14, ease: "easeOut" }}
                                        className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl bg-white/[0.94] dark:bg-[rgba(18,24,34,0.97)]"
                                        style={{
                                            borderColor: "var(--surface-card-border)",
                                            boxShadow: "var(--surface-card-shadow)",
                                        }}
                                    >
                                        {/* User info */}
                                        <div
                                            className="flex items-center gap-3 bg-black/[0.04] px-4 py-3.5 dark:bg-white/[0.07]"
                                            style={{ borderBottom: "1px solid var(--surface-panel-border)" }}
                                        >
                                            {user.avatarUrl ? (
                                                <Image
                                                    src={user.avatarUrl}
                                                    alt={user.fullName || "Avatar"}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-smile-primary/20"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-smile-primary text-sm font-bold text-white">
                                                    {user.fullName?.charAt(0).toUpperCase() ?? "?"}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-poppins text-sm font-semibold text-smile-primary-dark">
                                                    {user.fullName}
                                                </p>
                                                <p className="truncate font-inter text-xs text-smile-description">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Navigation items */}
                                        <div className="p-1.5">
                                            {NAV_ITEMS.map(item => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm transition-all hover:text-smile-primary ${pathname === item.href
                                                        ? "bg-smile-primary-light font-semibold text-smile-primary"
                                                        : "text-smile-title hover:bg-smile-primary-light/50"
                                                        }`}
                                                >
                                                    <Icon icon={item.icon} width={16} className="shrink-0" />
                                                    {item.label}
                                                    {pathname === item.href && (
                                                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-smile-primary" />
                                                    )}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Divider */}
                                        <div className="mx-3 h-px" style={{ background: "var(--surface-panel-border)" }} />

                                        {/* Account items */}
                                        <div className="p-1.5">
                                            {ACCOUNT_ITEMS.map(item => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/50 hover:text-smile-primary"
                                                >
                                                    <Icon icon={item.icon} width={16} className="shrink-0" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Divider */}
                                        <div className="mx-3 h-px" style={{ background: "var(--surface-panel-border)" }} />

                                        {/* Sign out */}
                                        <div className="p-1.5">
                                            <button
                                                type="button"
                                                onClick={handleSignOutClick}
                                                disabled={isLoggingOut}
                                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm transition-all disabled:opacity-60 ${confirmingLogout
                                                    ? "bg-red-100 text-red-600 dark:bg-red-950/50"
                                                    : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    }`}
                                            >
                                                {isLoggingOut
                                                    ? <Icon icon="line-md:loading-twotone-loop" width={16} className="shrink-0" />
                                                    : <Icon icon={confirmingLogout ? "lucide:alert-triangle" : "lucide:log-out"} width={16} className="shrink-0" />}
                                                <AnimatePresence mode="wait" initial={false}>
                                                    <motion.span
                                                        key={confirmingLogout ? "confirm" : "idle"}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        {isLoggingOut ? "Signing out…" : confirmingLogout ? "Click again to confirm" : "Sign Out"}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* Login button */
                        <Link
                            href={ROUTES.LOGIN}
                            className="flex items-center gap-2 rounded-full border border-smile-accent/40 bg-smile-accent/10 px-5 py-2 font-poppins text-sm font-semibold text-[#2a7a45] backdrop-blur-sm transition-all hover:bg-smile-accent/20 dark:border-[rgba(94,255,136,0.35)] dark:bg-[rgba(94,255,136,0.08)] dark:text-[#5eff88] dark:hover:bg-[rgba(94,255,136,0.15)]"
                        >
                            LOGIN
                            <ArrowButton size="sm" rotation={41.6} />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
