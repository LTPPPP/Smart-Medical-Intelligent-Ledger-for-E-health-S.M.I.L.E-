import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

interface ErrorMessageProps {
	message: string;
	onRetry?: () => void;
	className?: string;
}

export const ErrorMessage = ({
	message,
	onRetry,
	className,
}: ErrorMessageProps) => {
	return (
		<div
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
					<p className="text-red-800 text-sm">{message}</p>
					{onRetry && (
						<button
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
