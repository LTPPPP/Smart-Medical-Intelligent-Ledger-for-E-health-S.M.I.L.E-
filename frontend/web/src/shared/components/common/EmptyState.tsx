import { Icon } from "@iconify/react";
// Empty State

interface EmptyStateProps {
	icon?: string;
	title: string;
	description?: string;
	children?: React.ReactNode; // Action Buttons
}

export function EmptyState({
	icon = "lucide:file-question",
	title,
	description,
	children,
}: EmptyStateProps) {
	return (
		<div className="flex min-h-[25rem] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Icon icon={icon} className="h-8 w-8 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<h3 className="text-lg font-semibold">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}
