import { cn } from "@/shared/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div
            className={cn("rounded-xl backdrop-blur-[16px]", className)}
            style={{
                background: "var(--surface-card-bg)",
                border: "1px solid var(--surface-card-border)",
                boxShadow: "var(--surface-card-shadow)",
            }}
        >
            {children}
        </div>
    );
}
