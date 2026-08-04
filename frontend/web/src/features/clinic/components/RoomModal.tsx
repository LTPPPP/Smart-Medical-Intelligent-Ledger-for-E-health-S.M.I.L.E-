"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@iconify/react";

import { FIELD_LIMITS } from "@/shared/constants/field-limits";
import { collectErrors, roomFormSchema } from "@/shared/lib/validators";

export interface RoomFormValues {
	room_name: string;
	room_code: string;
	room_type?: string;
	floor_number?: number | null;
	capacity?: number | null;
	status?: string;
}

const STATUS_OPTIONS: { value: string; label: string; dot: string }[] = [
	{ value: "AVAILABLE", label: "Available", dot: "bg-emerald-400" },
	{ value: "OCCUPIED", label: "Occupied", dot: "bg-amber-400" },
	{ value: "MAINTENANCE", label: "Maintenance", dot: "bg-red-400" },
];
// Matches Postgres Enum
const TYPE_OPTIONS: { value: string; label: string; icon: string }[] = [
	{ value: "examination", label: "Examination", icon: "lucide:stethoscope" },
	{ value: "surgery", label: "Surgery", icon: "lucide:syringe" },
	{ value: "imaging", label: "Imaging", icon: "lucide:scan" },
];

function Field({
	label,
	icon,
	children,
}: { label: string; icon?: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{icon && <Icon icon={icon} width={12} />}
				{label}
			</span>
			{children}
		</label>
	);
}

const inputCls =
	"h-11 rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

export function RoomModal({
	initial,
	submitting,
	title,
	onSubmit,
	onClose,
}: {
	initial?: Partial<RoomFormValues>;
	submitting?: boolean;
	title: string;
	onSubmit: (v: RoomFormValues) => void;
	onClose: () => void;
}) {
	const [mounted, setMounted] = useState(false);
	const [form, setForm] = useState<RoomFormValues>({
		room_name: "",
		room_code: "",
		room_type: "examination",
		floor_number: 1,
		capacity: 1,
		status: "AVAILABLE",
		...initial,
	});
	const [error, setError] = useState("");
	const set = (k: keyof RoomFormValues, v: string | number | null) =>
		setForm((f) => ({ ...f, [k]: v }));

	// Portal To document.body — Escapes AppShell's `relative z-10` Content
	// Wrapper, Whose Stacking Context Otherwise Sits Below The Sidebar/Header.
	useEffect(() => setMounted(true), []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		// Schema-Driven Validation
		const errs = collectErrors(roomFormSchema, form);
		const first = Object.values(errs)[0];
		if (first) {
			setError(first);
			return;
		}
		setError("");
		onSubmit(form);
	};

	if (!mounted) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg overflow-hidden rounded-[24px] border shadow-2xl"
				style={{
					background: "var(--surface-card-bg)",
					borderColor: "var(--surface-card-border)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between bg-gradient-to-r from-smile-primary to-smile-primary-dark px-6 py-5">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
							<Icon icon="lucide:door-open" width={18} className="text-white" />
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

				<form onSubmit={submit} className="flex flex-col gap-4 p-6">
					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
							<Icon icon="lucide:alert-circle" width={15} /> {error}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="Room name" icon="lucide:tag">
							<input
								className={inputCls}
								value={form.room_name}
								maxLength={FIELD_LIMITS.roomName}
								placeholder="Examination Room 1"
								onChange={(e) => set("room_name", e.target.value)}
							/>
						</Field>
						<Field label="Room code" icon="lucide:hash">
							<input
								className={inputCls}
								value={form.room_code}
								maxLength={FIELD_LIMITS.roomCode}
								placeholder="PK-01"
								onChange={(e) => set("room_code", e.target.value)}
							/>
						</Field>
					</div>

					<Field label="Type">
						<div className="grid grid-cols-3 gap-2">
							{TYPE_OPTIONS.map((opt) => {
								const active = form.room_type === opt.value;
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => set("room_type", opt.value)}
										className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
											active
												? "border-smile-primary bg-smile-primary/10 text-smile-primary"
												: "text-smile-description hover:border-smile-primary/40 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
										}`}
									>
										<Icon icon={opt.icon} width={18} />
										{opt.label}
									</button>
								);
							})}
						</div>
					</Field>

					<Field label="Status">
						<div className="grid grid-cols-3 gap-2">
							{STATUS_OPTIONS.map((opt) => {
								const active = form.status === opt.value;
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => set("status", opt.value)}
										className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
											active
												? "border-smile-primary bg-smile-primary/10 text-smile-primary"
												: "text-smile-description hover:border-smile-primary/40 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]"
										}`}
									>
										<span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
										{opt.label}
									</button>
								);
							})}
						</div>
					</Field>

					<div className="grid grid-cols-2 gap-4">
						<Field label="Floor" icon="lucide:layers">
							<input
								type="number"
								className={inputCls}
								value={form.floor_number ?? ""}
								onChange={(e) =>
									set(
										"floor_number",
										e.target.value ? Number(e.target.value) : null,
									)
								}
							/>
						</Field>
						<Field label="Capacity" icon="lucide:users">
							<input
								type="number"
								className={inputCls}
								value={form.capacity ?? ""}
								onChange={(e) =>
									set(
										"capacity",
										e.target.value ? Number(e.target.value) : null,
									)
								}
							/>
						</Field>
					</div>

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
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark disabled:opacity-60"
						>
							{submitting && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							Save
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
}

export default RoomModal;
