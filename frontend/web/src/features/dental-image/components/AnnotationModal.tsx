"use client";

import { useMemo, useState } from "react";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@/features/i18n";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { ENV } from "@/shared/constants/env";
import { toast } from "@/shared/lib/toast";

const GATEWAY = ENV.SERVICES.GATEWAY;

interface Annotation {
	annotation_id: string;
	image_id: string;
	annotated_by?: string;
	annotation_type?: string;
	annotation_data?: Record<string, unknown>;
	note?: string;
	created_at?: string;
}

const inputCls =
	"h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50";

export function AnnotationModal({
	imageId,
	annotatedBy,
	onClose,
}: {
	imageId: string;
	annotatedBy: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const actorLabel = (id?: string) =>
		id ? `${t("dentalImage.userPrefix", "User")} ${id.slice(0, 8)}` : "—";
	const qc = useQueryClient();
	const [annotationType, setAnnotationType] = useState("");
	const [note, setNote] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<Annotation | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["image-annotations", imageId],
		queryFn: () =>
			apiClient.get(`${GATEWAY}/image-annotations/image/${imageId}`),
		enabled: !!imageId,
	});
	const annotations = useMemo(() => unwrapArr<Annotation>(data), [data]);

	const inv = () =>
		qc.invalidateQueries({ queryKey: ["image-annotations", imageId] });

	const createAnn = useMutation({
		mutationFn: () =>
			apiClient.post(`${GATEWAY}/image-annotations`, {
				image_id: imageId,
				annotated_by: annotatedBy,
				annotation_type: annotationType.trim() || undefined,
				note: note.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(
				t("dentalImage.annotation.toasts.added", "Annotation added"),
			);
			setAnnotationType("");
			setNote("");
			inv();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"dentalImage.annotation.toasts.addFailed",
					"Failed to add annotation",
				),
			),
	});

	const deleteAnn = useMutation({
		mutationFn: (annotationId: string) =>
			apiClient.delete(`${GATEWAY}/image-annotations/${annotationId}`),
		onSuccess: () => {
			toast.success(
				t("dentalImage.annotation.toasts.deleted", "Annotation deleted"),
			);
			setDeleteTarget(null);
			inv();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"dentalImage.annotation.toasts.deleteFailed",
					"Failed to delete annotation",
				),
			),
	});

	const add = (e: React.FormEvent) => {
		e.preventDefault();
		if (!note.trim() && !annotationType.trim()) {
			toast.warning(
				t("dentalImage.annotation.noteOrTypeRequired", "Add a note or a type."),
			);
			return;
		}
		createAnn.mutate();
	};

	return (
		<>
			<section className="rounded-[20px] border p-6 [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)]">
				<div className="mb-5 flex items-center justify-between">
					<h3 className="font-poppins text-lg font-semibold text-smile-title">
						{t("dentalImage.annotation.heading", "Annotations")}
					</h3>
					<button
						onClick={onClose}
						className="text-smile-description transition hover:text-smile-primary"
					>
						<Icon icon="lucide:x" width={18} />
					</button>
				</div>

				{/* List */}
				<div className="mb-5 flex flex-col gap-2">
					{isLoading && (
						<div className="flex items-center gap-2 py-4 text-sm text-smile-description">
							<Icon icon="line-md:loading-twotone-loop" width={18} />{" "}
							{t("dentalImage.annotation.loading", "Loading annotations…")}
						</div>
					)}
					{isError && !isLoading && (
						<div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
							{t("dentalImage.annotation.loadError", "Failed to load.")}{" "}
							<button
								onClick={() => refetch()}
								className="font-semibold underline"
							>
								{t("common.retry", "Retry")}
							</button>
						</div>
					)}
					{!isLoading && !isError && annotations.length === 0 && (
						<p className="py-2 text-sm text-smile-description">
							{t("dentalImage.annotation.empty", "No annotations yet.")}
						</p>
					)}
					{annotations.map((a) => (
						<div
							key={a.annotation_id}
							className="flex items-start justify-between gap-3 rounded-xl border p-3 [border-color:var(--surface-panel-border)] [background:var(--surface-card-bg)]"
						>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									{a.annotation_type && (
										<span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-[11px] text-smile-primary">
											{a.annotation_type}
										</span>
									)}
									<span className="text-xs text-smile-description">
										{actorLabel(a.annotated_by)}
									</span>
								</div>
								{a.note && (
									<span className="text-sm text-smile-title">{a.note}</span>
								)}
							</div>
							<button
								onClick={() => setDeleteTarget(a)}
								className="shrink-0 rounded p-1 text-destructive transition hover:text-destructive/80"
							>
								<Icon icon="lucide:trash-2" width={14} />
							</button>
						</div>
					))}
				</div>

				{/* Add */}
				<form
					onSubmit={add}
					className="flex flex-col gap-3 border-t pt-4 [border-color:var(--surface-panel-border)]"
				>
					<input
						className={inputCls}
						value={annotationType}
						placeholder={t(
							"dentalImage.annotation.typePlaceholder",
							"Type (optional, e.g. finding)",
						)}
						onChange={(e) => setAnnotationType(e.target.value)}
					/>
					<textarea
						className="min-h-[70px] rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50"
						value={note}
						placeholder={t(
							"dentalImage.annotation.notePlaceholder",
							"Annotation note…",
						)}
						onChange={(e) => setNote(e.target.value)}
					/>
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={createAnn.isPending}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
						>
							{createAnn.isPending && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							{t("dentalImage.annotation.addLabel", "Add annotation")}
						</button>
					</div>
				</form>
			</section>
			<ConfirmDialog
				open={deleteTarget !== null}
				title={t(
					"dentalImage.annotation.deleteConfirmTitle",
					"Delete annotation?",
				)}
				description={t(
					"dentalImage.annotation.deleteConfirmDescription",
					"This annotation will be permanently deleted. This action cannot be undone.",
				)}
				pending={deleteAnn.isPending}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={() => {
					if (deleteTarget) deleteAnn.mutate(deleteTarget.annotation_id);
				}}
			/>
		</>
	);
}

export default AnnotationModal;
