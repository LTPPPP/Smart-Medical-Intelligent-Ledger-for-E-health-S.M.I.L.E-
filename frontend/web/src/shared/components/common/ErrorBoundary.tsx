// ============================================================
// ErrorBoundary — reusable error display for error.tsx files
// ============================================================

"use client";

import { Icon } from "@iconify/react";

import { Button } from "@/shared/components/ui/button";

interface ErrorBoundaryProps {
	error: Error & { digest?: string };
	reset: () => void;
	title?: string;
}

export function ErrorBoundary({
	error,
	reset,
	title = "Something went wrong",
}: ErrorBoundaryProps) {
	return (
		<div className="flex min-h-[25rem] flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<Icon
					icon="lucide:alert-triangle"
					className="h-8 w-8 text-destructive"
				/>
			</div>
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">{title}</h2>
				<p className="max-w-md text-sm text-muted-foreground">
					{error.message || "An unexpected error occurred. Please try again."}
				</p>
			</div>
			<Button onClick={reset} variant="outline" className="gap-2">
				<Icon icon="lucide:rotate-ccw" className="h-4 w-4" />
				Try again
			</Button>
		</div>
	);
}
