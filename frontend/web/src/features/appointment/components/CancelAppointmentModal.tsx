"use client";

import { useEffect, useState } from "react";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";

export function CancelAppointmentModal({
	open,
	submitting,
	onSubmit,
	onClose,
}: {
	open: boolean;
	submitting?: boolean;
	onSubmit: (reason: string) => void;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (open) {
			setReason("");
			setError("");
		}
	}, [open]);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!reason.trim()) {
			setError(
				t(
					"appointments.cancelModal.reasonRequired",
					"A cancellation reason is required.",
				),
			);
			return;
		}
		setError("");
		onSubmit(reason.trim());
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!submitting && !next) onClose();
			}}
		>
			<DialogContent
				showCloseButton={!submitting}
				className="max-w-md font-inter"
				aria-busy={submitting}
			>
				<DialogHeader>
					<DialogTitle>
						{t("appointments.cancelModal.title", "Cancel Appointment")}
					</DialogTitle>
					<DialogDescription>
						{t(
							"appointments.cancelModal.description",
							"This will mark the appointment as cancelled. Please provide a reason.",
						)}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={submit} className="flex flex-col gap-4">
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-semibold uppercase tracking-[1px] text-muted-foreground">
							{t("appointments.cancelModal.reasonLabel", "Reason")}
						</span>
						<Textarea
							rows={3}
							value={reason}
							placeholder={t(
								"appointments.cancelModal.reasonPlaceholder",
								"e.g. Patient requested reschedule",
							)}
							onChange={(e) => setReason(e.target.value)}
							disabled={submitting}
							className="min-h-24 resize-y"
						/>
					</label>

					{error && (
						<p
							role="alert"
							className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{error}
						</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={submitting}
							onClick={onClose}
						>
							{t("appointments.cancelModal.keepIt", "Keep it")}
						</Button>
						<Button type="submit" variant="destructive" disabled={submitting}>
							{submitting && (
								<Icon icon="line-md:loading-twotone-loop" aria-hidden="true" />
							)}
							{t("appointments.cancelModal.submit", "Cancel Appointment")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CancelAppointmentModal;
