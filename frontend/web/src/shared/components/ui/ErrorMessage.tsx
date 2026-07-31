import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";
import { extractApiError, getApiErrorMetadata } from "@/shared/lib/toast";

interface ErrorMessageProps {
	message: string;
	error?: unknown;
	operation?: string;
	onRetry?: () => void;
	className?: string;
}

export const ErrorMessage = ({
	message,
	error,
	operation,
	onRetry,
	className,
}: ErrorMessageProps) => {
	const safeMessage = error ? extractApiError(error, message) : message;
	const metadata = error
		? getApiErrorMetadata(error, { operation: operation ?? "UI request" })
		: undefined;
	const diagnostics = [
		metadata?.status ? `HTTP ${metadata.status}` : undefined,
		metadata?.code ? `code: ${metadata.code}` : undefined,
		metadata?.correlationId ? `ref: ${metadata.correlationId}` : undefined,
	].filter(Boolean);

	return (
		<div
			role="alert"
			className={cn(
				"bg-red-50 border border-red-200 rounded-lg p-4",
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<Icon
					icon="mdi:alert-circle"
					className="text-red-600 flex-shrink-0 mt-0.5"
					width={20}
				/>
				<div className="flex-1">
					<p className="text-red-800 text-sm">{safeMessage}</p>
					{diagnostics.length > 0 && (
						<p className="mt-1 text-xs text-red-700/80">
							{diagnostics.join(" · ")}
						</p>
					)}
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="mt-2 text-red-600 text-sm font-medium hover:underline"
						>
							Try again
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
