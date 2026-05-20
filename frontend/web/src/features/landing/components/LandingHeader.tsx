

"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";

import { ROUTES } from "@/shared/constants";

import { ArrowButton } from "./ArrowButton";

export function LandingHeader() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

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
                    {/* Pairing pill */}
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary/10 md:flex dark:border-[rgba(146,205,253,0.25)] dark:bg-[rgba(146,205,253,0.06)] dark:text-[#92CDFD] dark:hover:bg-[rgba(146,205,253,0.12)]"
                    >
                        <Icon icon="lucide:stethoscope" width={16} />
                        Pairing
                    </button>

                    {/* Application pill */}
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary/10 md:flex dark:border-[rgba(69,240,207,0.25)] dark:bg-[rgba(69,240,207,0.06)] dark:text-[#45F0CF] dark:hover:bg-[rgba(69,240,207,0.12)]"
                    >
                        <Icon icon="lucide:layout-grid" width={16} />
                        Application
                    </button>

                    {/* Icon buttons */}
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

                    {/* Login button */}
                    <Link
                        href={ROUTES.LOGIN}
                        className="flex items-center gap-2 rounded-full border border-smile-accent/40 bg-smile-accent/10 px-5 py-2 font-poppins text-sm font-semibold text-[#2a7a45] backdrop-blur-sm transition-all hover:bg-smile-accent/20 dark:border-[rgba(94,255,136,0.35)] dark:bg-[rgba(94,255,136,0.08)] dark:text-[#5eff88] dark:hover:bg-[rgba(94,255,136,0.15)]"
                    >
                        LOGIN
                        <ArrowButton size="sm" rotation={41.6} />
                    </Link>
                </div>
            </div>
        </header>
    );
}
