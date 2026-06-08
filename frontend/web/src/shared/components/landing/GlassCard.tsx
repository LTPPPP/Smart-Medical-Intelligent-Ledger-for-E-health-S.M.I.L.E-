// ============================================================
// GlassCard — Reusable glassmorphism card component
// Matches: backdrop-blur, inset box-shadow, semi-transparent bg
// ============================================================

import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-[5px] bg-white/[0.02] shadow-[0px_5px_5px_rgba(0,0,0,0.25),inset_-2px_-2px_4px_rgba(255,255,255,0.25),inset_2px_2px_4px_rgba(255,255,255,0.25)] backdrop-blur-[10px] dark:bg-white/[0.06]",
                className,
            )}
        >
            {children}
        </div>
    );
}
