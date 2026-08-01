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

interface Category {
	category_id: string;
	category_name: string;
	description?: string;
}

const inputCls =
	"h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50";

export function CategoryModal({ onClose }: { onClose: () => void }) {
	const { t } = useTranslation();
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["image-categories"],
		queryFn: () => apiClient.get(`${GATEWAY}/image-categories`),
	});
	const categories = useMemo(() => unwrapArr<Category>(data), [data]);

	const inv = () => qc.invalidateQueries({ queryKey: ["image-categories"] });
	const reset = () => {
		setEditingId(null);
		setName("");
		setDescription("");
	};

	const createCat = useMutation({
		mutationFn: () =>
			apiClient.post(`${GATEWAY}/image-categories`, {
				category_name: name.trim(),
				description: description.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("dentalImage.category.toasts.added", "Category added"));
			reset();
			inv();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("dentalImage.category.toasts.addFailed", "Failed to add category"),
			),
	});

	const updateCat = useMutation({
		mutationFn: (id: string) =>
			apiClient.patch(`${GATEWAY}/image-categories/${id}`, {
				category_name: name.trim(),
				description: description.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(
				t("dentalImage.category.toasts.updated", "Category updated"),
			);
			reset();
			inv();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"dentalImage.category.toasts.updateFailed",
					"Failed to update category",
				),
			),
	});

	const deleteCat = useMutation({
		mutationFn: (id: string) =>
			apiClient.delete(`${GATEWAY}/image-categories/${id}`),
		onSuccess: () => {
			toast.success(
				t("dentalImage.category.toasts.deleted", "Category deleted"),
			);
			setDeleteTarget(null);
			inv();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t(
					"dentalImage.category.toasts.deleteFailed",
					"Failed to delete category",
				),
			),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.warning(
				t("dentalImage.category.nameRequired", "Category name is required."),
			);
			return;
		}
		if (editingId) updateCat.mutate(editingId);
		else createCat.mutate();
	};

	const saving = createCat.isPending || updateCat.isPending;

	return (
		<>
			<section className="rounded-[20px] border p-6 [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)]">
				<div className="mb-5 flex items-center justify-between">
					<h3 className="font-poppins text-lg font-semibold text-smile-title">
						{t("dentalImage.category.heading", "Image categories")}
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
							{t("dentalImage.category.loading", "Loading categories…")}
						</div>
					)}
					{isError && !isLoading && (
						<div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
							{t("dentalImage.category.loadError", "Failed to load.")}{" "}
							<button
								onClick={() => refetch()}
								className="font-semibold underline"
							>
								{t("common.retry", "Retry")}
							</button>
						</div>
					)}
					{!isLoading && !isError && categories.length === 0 && (
						<p className="py-2 text-sm text-smile-description">
							{t("dentalImage.category.empty", "No categories yet.")}
						</p>
					)}
					{categories.map((c) => (
						<div
							key={c.category_id}
							className="flex items-start justify-between gap-3 rounded-xl border p-3 [border-color:var(--surface-panel-border)] [background:var(--surface-card-bg)]"
						>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold text-smile-title">
									{c.category_name}
								</span>
								{c.description && (
									<span className="text-xs text-smile-description">
										{c.description}
									</span>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<button
									onClick={() => {
										setEditingId(c.category_id);
										setName(c.category_name);
										setDescription(c.description ?? "");
									}}
									className="rounded p-1 text-smile-description transition hover:text-smile-primary"
								>
									<Icon icon="lucide:pencil" width={14} />
								</button>
								<button
									onClick={() => setDeleteTarget(c)}
									className="rounded p-1 text-destructive transition hover:text-destructive/80"
								>
									<Icon icon="lucide:trash-2" width={14} />
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Add / edit */}
				<form
					onSubmit={submit}
					className="flex flex-col gap-3 border-t pt-4 [border-color:var(--surface-panel-border)]"
				>
					<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
						{editingId
							? t("dentalImage.category.editLabel", "Edit category")
							: t("dentalImage.category.addLabel", "Add category")}
					</span>
					<input
						className={inputCls}
						value={name}
						placeholder={t(
							"dentalImage.category.namePlaceholder",
							"Category name",
						)}
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						className={inputCls}
						value={description}
						placeholder={t(
							"dentalImage.category.descriptionPlaceholder",
							"Description (optional)",
						)}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<div className="flex justify-end gap-3">
						{editingId && (
							<button
								type="button"
								onClick={reset}
								className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
							>
								{t("dentalImage.category.cancelEdit", "Cancel edit")}
							</button>
						)}
						<button
							type="submit"
							disabled={saving}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
						>
							{saving && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							{editingId
								? t("dentalImage.category.save", "Save")
								: t("dentalImage.category.add", "Add")}
						</button>
					</div>
				</form>
			</section>
			<ConfirmDialog
				open={deleteTarget !== null}
				title={t(
					"dentalImage.category.deleteConfirmTitle",
					"Delete image category?",
				)}
				description={
					deleteTarget
						? `${t("dentalImage.category.deleteConfirmPrefix", "Category")} "${deleteTarget.category_name}" ${t("dentalImage.category.deleteConfirmSuffix", "will be permanently deleted. This action cannot be undone.")}`
						: ""
				}
				pending={deleteCat.isPending}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={() => {
					if (deleteTarget) deleteCat.mutate(deleteTarget.category_id);
				}}
			/>
		</>
	);
}

export default CategoryModal;
