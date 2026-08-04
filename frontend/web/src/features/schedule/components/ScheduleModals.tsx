"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { useDoctorDirectory } from "@/features/schedule/hooks/useDoctorDirectory";
import {
	useDoctorName,
	useDoctorNames,
} from "@/features/schedule/hooks/useDoctorName";
import { unwrapArr } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";
import { toast } from "@/shared/lib/toast";

const TEAL = "#38BDF8";
const modalWrap =
	"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md";
const modalCard =
	"w-full max-w-lg overflow-hidden rounded-[24px] border shadow-2xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)]";
const inputCls =
	"h-11 w-full rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

function GradientHeader({
	icon,
	title,
	onClose,
}: {
	icon: string;
	title: string;
	onClose: () => void;
}) {
	return (
		<div className="flex items-center justify-between bg-gradient-to-r from-smile-primary to-smile-primary-dark px-6 py-5">
			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
					<Icon icon={icon} width={18} className="text-white" />
				</div>
				<h3 className="font-poppins text-lg font-semibold text-white">
					{title}
				</h3>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
			>
				<Icon icon="lucide:x" width={18} />
			</button>
		</div>
	);
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
	return (
		<div className="mb-5 flex items-center justify-between">
			<h3 className="font-poppins text-lg font-semibold text-smile-title">
				{title}
			</h3>
			<button
				onClick={onClose}
				className="text-smile-description transition hover:text-smile-primary"
			>
				<Icon icon="lucide:x" width={18} />
			</button>
		</div>
	);
}

// Shift Transfer
export function TransferModal({
	scheduleId,
	fromDoctorId,
	onClose,
	onDone,
}: {
	scheduleId: string;
	fromDoctorId?: string;
	onClose: () => void;
	onDone: () => void;
}) {
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const fromDoctorName = useDoctorName(fromDoctorId);
	const { doctors, isLoading: doctorsLoading } = useDoctorDirectory();
	const [toDoctor, setToDoctor] = useState("");
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");
	const [mounted, setMounted] = useState(false);

	// Portal To document.body — Escapes AppShell's `relative z-10` Content
	// Wrapper, Whose Stacking Context Otherwise Sits Below The Sidebar/Header.
	useEffect(() => setMounted(true), []);

	const targets = doctors.filter((d) => d.id !== fromDoctorId);

	const mutation = useMutation({
		mutationFn: () =>
			apiClient.post(API_ENDPOINTS.SCHEDULE.TRANSFER(scheduleId), {
				to_doctor_id: toDoctor,
				transferred_by: user?.userId,
				reason,
				notes: notes || undefined,
			}),
		onSuccess: () => {
			toast.success(
				t(
					"schedule.modals.transferredToast",
					"Shift transferred — doctor notified",
				),
			);
			onDone();
		},
		onError: (e) =>
			toast.apiError(
				e,
				t("schedule.modals.transferFailedToast", "Failed to transfer shift"),
			),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!toDoctor) {
			setError(
				t(
					"schedule.modals.selectDoctorToTransfer",
					"Select a doctor to transfer to.",
				),
			);
			return;
		}
		if (!reason.trim()) {
			setError(t("schedule.modals.reasonRequired", "Reason is required."));
			return;
		}
		setError("");
		mutation.mutate();
	};

	if (!mounted) return null;

	return createPortal(
		<div className={modalWrap} onClick={onClose}>
			<div className={modalCard} onClick={(e) => e.stopPropagation()}>
				<GradientHeader
					icon="lucide:arrow-left-right"
					title={t("schedule.modals.transferTitle", "Transfer shift")}
					onClose={onClose}
				/>

				<div className="flex flex-col gap-4 p-6">
					<div className="flex items-center gap-3 rounded-xl border px-4 py-3 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-smile-primary/10">
							<Icon
								icon="lucide:user-round"
								width={16}
								className="text-smile-primary"
							/>
						</div>
						<p className="text-sm text-smile-description">
							{t(
								"schedule.modals.transferDescPrefix",
								"Transfer this shift from",
							)}{" "}
							<span className="font-semibold text-smile-title">
								{fromDoctorName}
							</span>{" "}
							{t(
								"schedule.modals.transferDescSuffix",
								"to another doctor. Both doctors will receive a notification.",
							)}
						</p>
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
							<Icon icon="lucide:alert-circle" width={15} /> {error}
						</div>
					)}

					<form onSubmit={submit} className="flex flex-col gap-4">
						<label className="flex flex-col gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
								{t("schedule.modals.transferToLabel", "Transfer to")}{" "}
								<span className="text-smile-primary">*</span>
							</span>
							<select
								className={inputCls}
								value={toDoctor}
								disabled={doctorsLoading}
								onChange={(e) => setToDoctor(e.target.value)}
							>
								<option
									value=""
									className="text-smile-title [background:var(--surface-input-bg)]"
								>
									{doctorsLoading
										? t("schedule.modals.loadingDoctors", "Loading doctors…")
										: t("schedule.modals.selectDoctor", "Select doctor…")}
								</option>
								{targets.map((d) => (
									<option
										key={d.id}
										value={d.id}
										className="text-smile-title [background:var(--surface-input-bg)]"
									>
										{d.name}
									</option>
								))}
							</select>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
								{t("schedule.modals.reasonLabel", "Reason")}{" "}
								<span className="text-smile-primary">*</span>
							</span>
							<input
								className={inputCls}
								value={reason}
								placeholder={t(
									"schedule.modals.reasonPlaceholder",
									"e.g. Annual leave",
								)}
								onChange={(e) => setReason(e.target.value)}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
								{t("schedule.modals.notesLabel", "Notes")}
							</span>
							<input
								className={inputCls}
								value={notes}
								placeholder={t("schedule.modals.notesPlaceholder", "Optional")}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</label>
						<div className="flex justify-end gap-3 pt-1">
							<button
								type="button"
								onClick={onClose}
								className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:opacity-80"
								style={{
									background: "var(--surface-panel-bg)",
									borderColor: "var(--surface-panel-border)",
								}}
							>
								{t("schedule.modals.cancel", "Cancel")}
							</button>
							<button
								type="submit"
								disabled={mutation.isPending}
								className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark disabled:opacity-60"
							>
								{mutation.isPending && (
									<Icon icon="line-md:loading-twotone-loop" width={16} />
								)}{" "}
								{t("schedule.modals.transfer", "Transfer")}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>,
		document.body,
	);
}

// Schedule Change History
interface ChangeRow {
	change_id?: string;
	change_type?: string;
	old_value?: unknown;
	new_value?: unknown;
	reason?: string;
	changed_by?: string;
	created_at?: string;
}

export function ChangesModal({
	scheduleId,
	onClose,
}: { scheduleId: string; onClose: () => void }) {
	const { t } = useTranslation();
	const [mounted, setMounted] = useState(false);
	const { data, isLoading } = useQuery({
		queryKey: ["schedule", scheduleId, "changes"],
		queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.CHANGES(scheduleId)),
	});
	const changes = useMemo(() => unwrapArr<ChangeRow>(data), [data]);
	const changedByNames = useDoctorNames(
		useMemo(() => changes.map((c) => c.changed_by), [changes]),
	);

	// Portal To document.body — Escapes AppShell's `relative z-10` Content
	// Wrapper, Whose Stacking Context Otherwise Sits Below The Sidebar/Header.
	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return createPortal(
		<div className={modalWrap} onClick={onClose}>
			<div
				className={`${modalCard} max-w-xl p-6`}
				onClick={(e) => e.stopPropagation()}
			>
				<Header
					title={t(
						"schedule.modals.changeHistoryTitle",
						"Schedule change history",
					)}
					onClose={onClose}
				/>
				{isLoading ? (
					<div className="flex items-center justify-center gap-2 py-10 text-smile-description">
						<Icon icon="line-md:loading-twotone-loop" width={20} />{" "}
						{t("schedule.modals.loading", "Loading…")}
					</div>
				) : changes.length === 0 ? (
					<p className="py-8 text-center text-sm text-smile-description">
						{t(
							"schedule.modals.noChanges",
							"No changes recorded for this schedule yet.",
						)}
					</p>
				) : (
					<div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
						{changes.map((c, i) => (
							<div
								key={c.change_id ?? i}
								className="rounded-xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]"
							>
								<div className="flex items-center justify-between">
									<span
										className="text-sm font-semibold capitalize"
										style={{ color: TEAL }}
									>
										{c.change_type ??
											t("schedule.modals.changeFallback", "change")}
									</span>
									<span className="text-xs text-smile-description">
										{c.created_at
											? new Date(c.created_at).toLocaleString()
											: ""}
									</span>
								</div>
								{c.reason && (
									<p className="mt-1 text-sm text-smile-description">
										{c.reason}
									</p>
								)}
								{c.changed_by && (
									<p className="mt-1 text-xs text-smile-description">
										{t("schedule.modals.byPrefix", "By:")}{" "}
										{changedByNames[c.changed_by]}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>,
		document.body,
	);
}
