// ============================================================
// GradientText — Reusable gradient text component
// Renders text with the S.M.I.L.E brand gradient (#447593 → #5EFF88)
// ============================================================

import { cn } from "@/lib/utils";

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GradientText({
    children,
    className,
    as: Tag = "h2",
}: GradientTextProps) {
    return (
        <Tag
            className={cn(
                "bg-gradient-to-r from-[#447593] to-[#5EFF88] bg-clip-text text-transparent",
                className,
            )}
        >
            {children}
        </Tag>
    );
}
