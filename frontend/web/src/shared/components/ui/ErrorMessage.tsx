import { extractApiError, getApiErrorMetadata } from "@/shared/lib/toast";

import { InlineFeedback } from "./InlineFeedback";

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
		<InlineFeedback
			tone="error"
			className={className}
			actionLabel={onRetry ? "Try again" : undefined}
			onAction={onRetry}
		>
			<p>{safeMessage}</p>
			{diagnostics.length > 0 && (
				<p className="mt-1 text-xs">{diagnostics.join(" · ")}</p>
			)}
		</InlineFeedback>
	);
};
