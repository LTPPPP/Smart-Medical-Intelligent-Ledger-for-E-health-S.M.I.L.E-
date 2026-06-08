import { cn } from "@/lib/utils";

const RATING_COLORS = {
    good: "text-green-600 dark:text-green-400",
    "needs-improvement": "text-yellow-600 dark:text-yellow-400",
    poor: "text-red-600 dark:text-red-400",
};

interface MetricCardProps {
    label: string;
    value: string;
    rating?: "good" | "needs-improvement" | "poor";
}

export function MetricCard({ label, value, rating }: MetricCardProps) {
    return (
        <div className="flex flex-col items-center rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span
                className={cn(
                    "text-lg font-bold",
                    rating ? RATING_COLORS[rating] : "text-foreground"
                )}
            >
                {value}
            </span>
        </div>
    );
}
