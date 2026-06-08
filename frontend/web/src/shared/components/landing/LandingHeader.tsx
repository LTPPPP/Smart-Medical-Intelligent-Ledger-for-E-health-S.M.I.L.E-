// ============================================================
// LandingHeader — Top navigation bar for the landing page
// Logo + nav pills + action icons + login button
// ============================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
    Globe,
    Moon,
    Sun,
    Bell,
    Stethoscope,
    LayoutGrid,
} from "lucide-react";

import { ArrowButton } from "./ArrowButton";
import { ROUTES } from "@/constants";

export function LandingHeader() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-[10px] dark:bg-black/80">
            <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
                {/* Logo */}
                <Link href={ROUTES.HOME} className="flex items-center gap-2">
                    <Image
                        src="/images/landing/logo.svg"
                        alt="S.M.I.L.E Logo"
                        width={32}
                        height={32}
                        priority
                    />
                    <span className="font-poppins text-2xl font-medium tracking-[2.4px] text-smile-primary">
                        SMILE
                    </span>
                </Link>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    {/* Pairing pill */}
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border-[0.5px] border-smile-primary bg-white/65 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary transition-colors hover:bg-smile-primary-light/40 md:flex dark:bg-white/10 dark:hover:bg-white/20"
                    >
                        <Stethoscope size={18} />
                        Pairing
                    </button>

                    {/* Application pill */}
                    <button
                        type="button"
                        className="hidden items-center gap-1.5 rounded-full border-[0.5px] border-smile-primary bg-white/65 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary transition-colors hover:bg-smile-primary-light/40 md:flex dark:bg-white/10 dark:hover:bg-white/20"
                    >
                        <LayoutGrid size={18} />
                        Application
                    </button>

                    {/* Icon buttons */}
                    <div className="hidden items-center gap-2 md:flex">
                        <button
                            type="button"
                            className="rounded-full p-1.5 text-smile-primary transition-colors hover:bg-smile-primary-light/30 dark:hover:bg-white/10"
                            aria-label="Language"
                        >
                            <Globe size={18} />
                        </button>
                        {mounted && (
                            <button
                                type="button"
                                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                                className="rounded-full p-1.5 text-smile-primary transition-colors hover:bg-smile-primary-light/30 dark:hover:bg-white/10"
                                aria-label="Toggle theme"
                            >
                                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        )}
                        <button
                            type="button"
                            className="rounded-full p-1.5 text-smile-primary transition-colors hover:bg-smile-primary-light/30 dark:hover:bg-white/10"
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                        </button>
                    </div>

                    {/* Login button */}
                    <Link
                        href={ROUTES.LOGIN}
                        className="flex items-center gap-2 rounded-full bg-white/65 px-4 py-1.5 font-poppins text-sm font-medium text-smile-primary transition-colors hover:bg-smile-primary-light/40 dark:bg-white/10 dark:hover:bg-white/20"
                    >
                        LOGIN
                        <ArrowButton size="sm" rotation={41.6} />
                    </Link>
                </div>
            </div>
        </header>
    );
}
