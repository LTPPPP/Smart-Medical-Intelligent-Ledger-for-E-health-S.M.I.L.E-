import { Badge } from "@/components/ui/badge";
import type { TestResult } from "./connectionTestTypes";

const VARIANTS: Record<TestResult["status"], string> = {
    idle: "bg-muted text-muted-foreground",
    running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const LABELS: Record<TestResult["status"], string> = {
    idle: "Idle",
    running: "Running...",
    success: "Success",
    error: "Failed",
};

export function StatusBadge({ status }: { status: TestResult["status"] }) {
    return <Badge className={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
