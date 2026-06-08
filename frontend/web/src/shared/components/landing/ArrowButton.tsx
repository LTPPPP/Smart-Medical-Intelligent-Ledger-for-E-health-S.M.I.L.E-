// ============================================================
// ArrowButton — Reusable green circle arrow button
// Matches the Figma design: #5EFF88 circle with rotated arrow
// ============================================================

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface ArrowButtonProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    rotation?: number;
    onClick?: () => void;
}

const sizeMap = {
    sm: { circle: "h-6 w-6", icon: 14 },
    md: { circle: "h-9 w-9", icon: 20 },
    lg: { circle: "h-[42px] w-[42px]", icon: 24 },
} as const;

export function ArrowButton({
    size = "md",
    className,
    rotation = 41.6,
    onClick,
}: ArrowButtonProps) {
    const { circle, icon } = sizeMap[size];
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center justify-center rounded-full bg-smile-accent transition-transform hover:scale-110",
                circle,
                className,
            )}
            aria-label="Navigate"
        >
            <ArrowUp
                size={icon}
                className="text-smile-primary"
                style={{ transform: `rotate(${rotation}deg)` }}
            />
        </button>
    );
}
