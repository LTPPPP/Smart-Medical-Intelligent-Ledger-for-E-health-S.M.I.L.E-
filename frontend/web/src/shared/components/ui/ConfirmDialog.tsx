"use client";

import { Icon } from "@iconify/react";

import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void | Promise<void>;
	confirmLabel?: string;
	cancelLabel?: string;
	pending?: boolean;
	pendingLabel?: string;
	/** Icon Badge — Defaults To The Destructive Trash Icon For Delete Flows. */
	icon?: string;
	/** Confirm Button Tone — Defaults To Destructive (Red) For Delete Flows. */
	variant?: "destructive" | "default";
}

export function ConfirmDialog({
	open,
	title,
	description,
	onOpenChange,
	onConfirm,
	confirmLabel = "Delete",
	cancelLabel = "Cancel",
	pending = false,
	pendingLabel,
	icon = "lucide:trash-2",
	variant = "destructive",
}: ConfirmDialogProps) {
	const iconToneCls =
		variant === "destructive"
			? "bg-destructive/10 text-destructive"
			: "bg-primary/10 text-primary";
	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!pending) onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				showCloseButton={!pending}
				className="max-w-md overflow-hidden p-5 font-inter"
				aria-busy={pending}
			>
				<DialogHeader className="pr-8">
					<div className="flex items-start gap-3">
						<span
							className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconToneCls}`}
						>
							<Icon icon={icon} width={18} />
						</span>
						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogTitle className="text-base text-foreground">
								{title}
							</DialogTitle>
							<DialogDescription className="leading-5">
								{description}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>
				<DialogFooter className="mt-1">
					<Button
						type="button"
						variant="outline"
						disabled={pending}
						onClick={() => onOpenChange(false)}
					>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						variant={variant}
						disabled={pending}
						onClick={() => {
							void Promise.resolve()
								.then(onConfirm)
								.catch(() => undefined);
						}}
					>
						{pending && (
							<Icon icon="line-md:loading-twotone-loop" aria-hidden="true" />
						)}
						{pending ? (pendingLabel ?? "Deleting…") : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
