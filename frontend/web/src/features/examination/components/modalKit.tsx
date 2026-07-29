"use client";

import { Icon } from "@iconify/react";

// ── shared dark-modal building blocks (mirrors RoomModal styling) ────────────
export const TEAL = "#38BDF8";
export const BLUE = "#92CDFD";
export const cardBase =
	"rounded-[20px] border backdrop-blur-md [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)]";

export const inputCls =
	"h-11 w-full rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";

export const areaCls =
	"min-h-[5rem] w-full rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]";

export function Field({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
				{label}
			</span>
			{children}
		</label>
	);
}

export function ModalShell({
	title,
	error,
	submitting,
	submitLabel = "Save",
	onClose,
	onSubmit,
	children,
}: {
	title: string;
	error?: string;
	submitting?: boolean;
	submitLabel?: string;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	children: React.ReactNode;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border backdrop-blur-md p-6 shadow-2xl"
				style={{
					background: "var(--surface-card-bg)",
					borderColor: "var(--surface-card-border)",
					boxShadow: "var(--surface-card-shadow)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
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

				{error && (
					<div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
						<Icon icon="lucide:alert-circle" width={15} /> {error}
					</div>
				)}

				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					{children}
					<div className="flex justify-end gap-3 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] hover:[border-color:var(--surface-card-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
							style={{
								background: BLUE,
								boxShadow: "0 0 15px rgba(146,205,253,0.3)",
							}}
						>
							{submitting && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}{" "}
							{submitLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
