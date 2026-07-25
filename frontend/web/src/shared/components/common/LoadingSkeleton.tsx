// ============================================================
// LoadingSkeleton — reusable loading states
// ============================================================

import { Skeleton } from "@/shared/components/ui/skeleton";

interface LoadingSkeletonProps {
	/** Number of skeleton rows */
	rows?: number;
	/** Show a card-like skeleton */
	variant?: "list" | "card" | "table";
}

export function LoadingSkeleton({
	rows = 5,
	variant = "list",
}: LoadingSkeletonProps) {
	if (variant === "card") {
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="rounded-lg border p-6">
						<Skeleton className="mb-4 h-4 w-3/4" />
						<Skeleton className="mb-2 h-3 w-full" />
						<Skeleton className="mb-2 h-3 w-5/6" />
						<Skeleton className="h-3 w-2/3" />
					</div>
				))}
			</div>
		);
	}

	if (variant === "table") {
		return (
			<div className="rounded-lg border">
				{/* Header */}
				<div className="flex gap-4 border-b p-4">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-1/4" />
				</div>
				{/* Rows */}
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="flex gap-4 border-b p-4 last:border-0">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
					</div>
				))}
			</div>
		);
	}

	// Default: list variant
	return (
		<div className="space-y-4">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="flex items-center gap-4">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
			))}
		</div>
	);
}
