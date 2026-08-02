"use client";

import { useRef, useState } from "react";

import type { AxiosError } from "axios";
import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
	AssistantDataCard,
	MessageText,
} from "@/features/booking-chat/components/ChatMessageView";
import type { DocumentSummary } from "@/features/booking-chat/documents.types";
import { useBookingChat } from "@/features/booking-chat/hooks/useBookingChat";
import {
	useDeleteDocument,
	useDocuments,
	useUpdateDocument,
	useUploadDocument,
} from "@/features/booking-chat/hooks/useDocuments";
import { formatDateTime } from "@/features/admin/utils/date.utils";
import { useTranslation } from "@/features/i18n";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { toast } from "@/shared/lib/toast";

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.md,.markdown";

function fastApiDetail(error: unknown): string | undefined {
	const detail = (error as AxiosError<{ detail?: string }> | undefined)
		?.response?.data?.detail;
	return typeof detail === "string" ? detail : undefined;
}

export function BookingChatbotAdmin() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const { data, isLoading, isError, refetch } = useDocuments();
	const uploadMutation = useUploadDocument();
	const updateMutation = useUpdateDocument();
	const deleteMutation = useDeleteDocument();

	const [uploadTarget, setUploadTarget] = useState<
		DocumentSummary | "new" | null
	>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dialogError, setDialogError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const documents = data?.documents ?? [];
	const isUpdate = uploadTarget !== null && uploadTarget !== "new";
	const isMutating = uploadMutation.isPending || updateMutation.isPending;

	function closeUploadDialog() {
		if (isMutating) return;
		setUploadTarget(null);
		setSelectedFile(null);
		setDialogError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function submitUploadDialog() {
		if (!selectedFile) return;
		setDialogError(null);
		try {
			const result = isUpdate
				? await updateMutation.mutateAsync({
						docId: (uploadTarget as DocumentSummary).doc_id,
						file: selectedFile,
					})
				: await uploadMutation.mutateAsync(selectedFile);
			toast.success(
				isUpdate
					? t("admin.bookingChatbot.updateSuccess", "Document updated")
					: t("admin.bookingChatbot.uploadSuccess", "Document uploaded"),
			);
			result.warnings.forEach((warning) => toast.warning(warning));
			closeUploadDialog();
		} catch (error) {
			const detail = fastApiDetail(error);
			setDialogError(
				detail ??
					t(
						"admin.bookingChatbot.uploadFailed",
						"Failed to save this document. Please try again.",
					),
			);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		try {
			await deleteMutation.mutateAsync(deleteTarget.doc_id);
			toast.success(
				t("admin.bookingChatbot.deleteSuccess", "Document deleted"),
			);
			setDeleteTarget(null);
		} catch {
			toast.error(
				t(
					"admin.bookingChatbot.deleteFailed",
					"Failed to delete this document.",
				),
			);
		}
	}

	const {
		input,
		setInput,
		currentMessages,
		canSend,
		isSending,
		hasError,
		pendingConfirmation,
		submitInput,
		confirmChange,
		selectSlot,
		selectDoctor,
		runAppointmentAction,
	} = useBookingChat(user?.userId, {
		storageIdentity: user?.userId ? `admin-test:${user.userId}` : undefined,
	});

	return (
		<div className="flex flex-col gap-6 font-inter">
			<PageHeader
				title={t("admin.bookingChatbot.title", "Booking chatbot")}
				description={t(
					"admin.bookingChatbot.subtitle",
					"Manage the knowledge base the AI scheduling assistant answers from, and test it directly.",
				)}
			>
				<Button onClick={() => setUploadTarget("new")}>
					<Icon icon="lucide:upload" />{" "}
					{t("admin.bookingChatbot.uploadNew", "Upload document")}
				</Button>
			</PageHeader>

			<div className="overflow-hidden rounded-2xl border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)]">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[640px] text-left text-sm">
						<thead className="border-b bg-muted/45 text-xs font-semibold uppercase tracking-wide text-muted-foreground [border-color:var(--surface-panel-border)]">
							<tr>
								<th className="px-4 py-3">
									{t("admin.bookingChatbot.colFilename", "File")}
								</th>
								<th className="px-4 py-3">
									{t("admin.bookingChatbot.colChunks", "Chunks")}
								</th>
								<th className="px-4 py-3">
									{t("admin.bookingChatbot.colUploadedAt", "Uploaded at")}
								</th>
								<th className="px-4 py-3 text-right">
									{t("admin.bookingChatbot.colActions", "Actions")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y [--tw-divide-opacity:1] [border-color:var(--surface-panel-border)]">
							{isLoading && (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-10 text-center text-smile-description"
									>
										<Icon
											icon="line-md:loading-twotone-loop"
											width={22}
											className="mx-auto mb-2 text-smile-primary"
										/>
										{t(
											"admin.bookingChatbot.loadingDocuments",
											"Loading documents…",
										)}
									</td>
								</tr>
							)}
							{isError && (
								<tr>
									<td colSpan={4} className="px-4 py-8">
										<ErrorMessage
											message={t(
												"admin.bookingChatbot.loadError",
												"Failed to load documents.",
											)}
											onRetry={() => void refetch()}
										/>
									</td>
								</tr>
							)}
							{!isLoading && !isError && documents.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-10 text-center text-smile-description"
									>
										{t(
											"admin.bookingChatbot.noDocuments",
											"No documents uploaded yet.",
										)}
									</td>
								</tr>
							)}
							{documents.map((doc) => (
								<tr key={doc.doc_id} className="transition hover:bg-muted/25">
									<td className="px-4 py-3 font-medium text-smile-title">
										<div className="flex items-center gap-2">
											<Icon
												icon="lucide:file-text"
												className="h-4 w-4 shrink-0 text-smile-description"
											/>
											{doc.filename}
										</div>
									</td>
									<td className="px-4 py-3 text-smile-description">
										{doc.chunk_count}
									</td>
									<td className="px-4 py-3 text-smile-description">
										{formatDateTime(doc.uploaded_at)}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setUploadTarget(doc)}
											>
												<Icon icon="lucide:refresh-cw" />{" "}
												{t("admin.bookingChatbot.update", "Update")}
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => setDeleteTarget(doc)}
											>
												<Icon icon="lucide:trash-2" />{" "}
												{t("common.delete", "Delete")}
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex flex-col gap-3 rounded-2xl border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] [box-shadow:var(--surface-card-shadow)]">
				<div className="flex items-center gap-3 border-b px-4 py-3 [border-color:var(--surface-panel-border)]">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary text-white">
						<Icon icon="lucide:flask-conical" className="h-5 w-5" />
					</div>
					<div>
						<p className="text-sm font-semibold text-smile-title">
							{t("admin.bookingChatbot.testChatTitle", "Test the assistant")}
						</p>
						<p className="text-xs text-smile-description">
							{t(
								"admin.bookingChatbot.testChatSubtitle",
								"Try questions against the documents above using your own admin account.",
							)}
						</p>
					</div>
				</div>

				<div className="flex max-h-[420px] min-h-[220px] flex-col gap-3 overflow-y-auto px-4 py-3">
					{currentMessages.map((message) => (
						<article
							key={message.id}
							className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
									message.role === "user"
										? "bg-smile-primary text-white"
										: "border [border-color:var(--surface-panel-border)] bg-muted/30 text-smile-title"
								}`}
							>
								<MessageText text={message.text} />
								{message.role === "assistant" ? (
									<AssistantDataCard
										message={message}
										onSelectDoctor={(doctor, flow) =>
											void selectDoctor(doctor, flow)
										}
										onSelectSlot={(slot, flow) => void selectSlot(slot, flow)}
										onAppointmentAction={(action) =>
											void runAppointmentAction(action)
										}
										isSending={isSending}
									/>
								) : null}
							</div>
						</article>
					))}
					{isSending ? (
						<p className="text-xs text-smile-description" aria-live="polite">
							{t(
								"booking.chat.reviewingRequest",
								"SMILE is reviewing your request",
							)}
						</p>
					) : null}
				</div>

				{pendingConfirmation ? (
					<div className="border-t border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
						<p className="text-sm font-medium text-amber-950 dark:text-amber-200">
							{pendingConfirmation.summary}
						</p>
						<div className="mt-3 flex gap-2">
							<Button size="sm" onClick={() => void confirmChange(true)}>
								{t("appointments.detail.confirm", "Confirm")}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => void confirmChange(false)}
							>
								{t("common.cancel", "Cancel")}
							</Button>
						</div>
					</div>
				) : null}

				{hasError ? (
					<div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
						{t(
							"booking.chat.unavailableError",
							"SMILE scheduling is temporarily unavailable. Please try again.",
						)}
					</div>
				) : null}

				<form
					onSubmit={submitInput}
					className="flex gap-2 border-t px-4 py-3 [border-color:var(--surface-panel-border)]"
				>
					<input
						value={input}
						onChange={(event) => setInput(event.target.value)}
						disabled={isSending}
						placeholder={t(
							"admin.bookingChatbot.testChatPlaceholder",
							"Ask what a patient might ask…",
						)}
						className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					/>
					<Button type="submit" disabled={!canSend}>
						{t("booking.chat.send", "Send")}
					</Button>
				</form>
			</div>

			<Dialog
				open={uploadTarget !== null}
				onOpenChange={(open) => {
					if (!open) closeUploadDialog();
				}}
			>
				<DialogContent
					showCloseButton={!isMutating}
					className="max-w-md font-inter"
				>
					<DialogHeader>
						<DialogTitle>
							{isUpdate
								? t("admin.bookingChatbot.updateDialogTitle", "Update document")
								: t(
										"admin.bookingChatbot.uploadDialogTitle",
										"Upload document",
									)}
						</DialogTitle>
						<DialogDescription>
							{isUpdate
								? t(
										"admin.bookingChatbot.updateDialogDesc",
										"Replace this document with a new file. The old content is kept until the new one finishes indexing.",
									)
								: t(
										"admin.bookingChatbot.uploadDialogDesc",
										"PDF, Word, or Markdown. Documents that are near-duplicates of an existing one are rejected.",
									)}
						</DialogDescription>
					</DialogHeader>
					<input
						ref={fileInputRef}
						type="file"
						accept={ACCEPTED_EXTENSIONS}
						disabled={isMutating}
						onChange={(event) =>
							setSelectedFile(event.target.files?.[0] ?? null)
						}
						className="rounded-md border px-3 py-2 text-sm [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					/>
					{dialogError ? (
						<p className="text-sm text-destructive">{dialogError}</p>
					) : null}
					<DialogFooter>
						<Button
							variant="outline"
							disabled={isMutating}
							onClick={closeUploadDialog}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button
							disabled={!selectedFile || isMutating}
							onClick={() => void submitUploadDialog()}
						>
							{isMutating && <Icon icon="line-md:loading-twotone-loop" />}
							{isUpdate
								? t("admin.bookingChatbot.update", "Update")
								: t("admin.bookingChatbot.uploadNew", "Upload document")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={deleteTarget !== null}
				title={t("admin.bookingChatbot.deleteConfirmTitle", "Delete document?")}
				description={
					deleteTarget
						? `${t(
								"admin.bookingChatbot.deleteConfirmDescPrefix",
								"The assistant will no longer use",
							)} "${deleteTarget.filename}" ${t(
								"admin.bookingChatbot.deleteConfirmDescSuffix",
								"to answer questions. This cannot be undone.",
							)}`
						: ""
				}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={confirmDelete}
				pending={deleteMutation.isPending}
				confirmLabel={t("common.delete", "Delete")}
				cancelLabel={t("common.cancel", "Cancel")}
			/>
		</div>
	);
}
