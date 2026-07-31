import type { ReactNode } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

type FeedbackTone = "error" | "warning" | "info" | "success";

const toneStyles: Record<
	FeedbackTone,
	{ container: string; icon: string; iconName: string }
> = {
	error: {
		container: "border-destructive/40 bg-destructive/10 text-destructive",
		icon: "text-destructive",
		iconName: "lucide:circle-alert",
	},
	warning: {
		container: "border-warning/40 bg-warning/10 text-foreground",
		icon: "text-warning",
		iconName: "lucide:triangle-alert",
	},
	info: {
		container: "border-info/40 bg-info/10 text-foreground",
		icon: "text-info",
		iconName: "lucide:info",
	},
	success: {
		container: "border-success/40 bg-success/10 text-foreground",
		icon: "text-success",
		iconName: "lucide:circle-check",
	},
};

interface InlineFeedbackProps {
	tone: FeedbackTone;
	title?: string;
	children: ReactNode;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
}

export function InlineFeedback({
	tone,
	title,
	children,
	actionLabel,
	onAction,
	className,
}: InlineFeedbackProps) {
	const style = toneStyles[tone];

	return (
		<div
			role={tone === "error" || tone === "warning" ? "alert" : "status"}
			className={cn(
				"flex items-start gap-3 rounded-xl border p-4 text-sm",
				style.container,
				className,
			)}
		>
			<Icon
				icon={style.iconName}
				className={cn("mt-0.5 size-4 shrink-0", style.icon)}
			/>
			<div className="min-w-0 flex-1">
				{title && <p className="font-semibold text-foreground">{title}</p>}
				<div className={cn("break-words", title && "mt-1")}>{children}</div>
				{actionLabel && onAction && (
					<button
						type="button"
						onClick={onAction}
						className="mt-2 rounded-md border border-current px-2.5 py-1.5 font-semibold transition hover:bg-background/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						{actionLabel}
					</button>
				)}
			</div>
		</div>
	);
}
