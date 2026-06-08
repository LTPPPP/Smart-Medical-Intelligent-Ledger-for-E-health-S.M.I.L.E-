"use client";

import { ErrorBoundary } from "@/components/shared";

export default function PatientDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorBoundary error={error} reset={reset} title="Failed to load patient" />;
}
