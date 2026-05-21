"use client";

import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

// ============================================================
// Types
// ============================================================

export type ThemeToggleVariant = "icon" | "dropdown";

export interface ThemeToggleProps {
    /**
     * "icon"     — single button that toggles light ↔ dark (default)
     * "dropdown" — dropdown with Light / Dark / System options
     */
    variant?: ThemeToggleVariant;
    /** Extra className forwarded to the root element */
    className?: string;
}

// ============================================================
// Helpers
// ============================================================

function ThemeIcon({ theme }: { theme: string | undefined }) {
    if (theme === "dark") return <Icon icon="lucide:moon" className="size-4" />;
    if (theme === "light") return <Icon icon="lucide:sun" className="size-4" />;
    return <Icon icon="lucide:monitor" className="size-4" />;
}

// ============================================================
// Icon variant — toggles light ↔ dark
// ============================================================

function IconToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();

    const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className={className}
        >
            <Icon icon="lucide:sun" className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Icon icon="lucide:moon" className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

// ============================================================
// Dropdown variant — Light / Dark / System
// ============================================================

function DropdownToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Select theme"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
            >
                <ThemeIcon theme={theme} />
                <span className="sr-only">Select theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="gap-2"
                >
                    <Icon icon="lucide:sun" className="size-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="gap-2"
                >
                    <Icon icon="lucide:moon" className="size-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="gap-2"
                >
                    <Icon icon="lucide:monitor" className="size-4" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ============================================================
// Public component
// ============================================================

/**
 * ThemeToggle — reusable light/dark theme switcher.
 *
 * @example
 * // Simple icon toggle (light ↔ dark)
 * <ThemeToggle />
 *
 * @example
 * // Dropdown with Light / Dark / System options
 * <ThemeToggle variant="dropdown" />
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
    // Avoid hydration mismatch — render nothing on the server.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                disabled
                aria-hidden
                className={className}
            >
                <Icon icon="lucide:sun" className="size-4 opacity-0" />
            </Button>
        );
    }

    if (variant === "dropdown") return <DropdownToggle className={className} />;
    return <IconToggle className={className} />;
}
