// ============================================================
// NavigationProgress — thin top progress bar on route changes
// No external dependency, pure CSS animation via inline style
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
    const pathname = usePathname();
    const [state, setState] = useState<"idle" | "loading" | "complete">("idle");
    const [width, setWidth] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (pathname === prevPathname.current) return;
        prevPathname.current = pathname;

        // Clear any running timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (completeRef.current) clearTimeout(completeRef.current);

        // Start loading
        setState("loading");
        setWidth(0);

        // Quickly ramp to 85%
        requestAnimationFrame(() => {
            setWidth(85);
        });

        // After 350ms complete
        completeRef.current = setTimeout(() => {
            setWidth(100);
            setState("complete");

            // Hide after animation
            timerRef.current = setTimeout(() => {
                setState("idle");
                setWidth(0);
            }, 300);
        }, 350);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (completeRef.current) clearTimeout(completeRef.current);
        };
    }, [pathname]);

    if (state === "idle") return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-smile-primary shadow-[0_0_8px_rgba(var(--color-smile-primary-rgb,99,102,241),0.6)]"
            style={{
                width: `${width}%`,
                transition:
                    state === "complete"
                        ? "width 0.2s ease-out, opacity 0.3s ease-out 0.1s"
                        : "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: state === "complete" ? 0 : 1,
            }}
        />
    );
}
