"use client";

import Link from "next/link";

import { Icon } from "@iconify/react";

// ── Shared theme-aware dashboard primitives (light glass / dark via CSS vars) ──

export function DashboardHeader({
	eyebrow,
	title,
	subtitle,
	icon,
	right,
}: {
	eyebrow?: string;
	title: string;
	subtitle?: string;
	icon: string;
	right?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex items-center gap-4">
				<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-smile-primary-light">
					<Icon icon={icon} width={24} className="text-smile-primary" />
				</span>
				<div>
					{eyebrow && (
						<p className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
							{eyebrow}
						</p>
					)}
					<h1 className="font-poppins text-[26px] font-bold tracking-tight text-smile-primary-dark">
						{title}
					</h1>
					{subtitle && (
						<p className="font-inter text-sm text-smile-description">
							{subtitle}
						</p>
					)}
				</div>
			</div>
			{right && <div className="flex items-center gap-2">{right}</div>}
		</div>
	);
}

export function DashStat({
	label,
	value,
	icon,
	loading,
	accent = false,
}: {
	label: string;
	value: React.ReactNode;
	icon: string;
	loading?: boolean;
	accent?: boolean;
}) {
	if (accent) {
		return (
			<div
				className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02]"
				style={{
					background:
						"linear-gradient(135deg, var(--color-smile-primary,#417eaa) 0%, #2a6494 65%, #0a2e4a 100%)",
					boxShadow: "0 6px 24px rgba(65,126,170,0.45)",
				}}
			>
				<div
					className="pointer-events-none absolute inset-0 rounded-2xl"
					style={{
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)",
					}}
				/>
				<p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-white/60">
					{label}
				</p>
				<p className="mt-1.5 font-poppins text-2xl font-bold text-white">
					{loading ? "—" : value}
				</p>
				<div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
					<Icon icon={icon} width={18} className="text-white" />
				</div>
			</div>
		);
	}
	return (
		<div
			className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02]"
			style={{
				background: "var(--surface-card-bg)",
				borderColor: "var(--surface-card-border)",
				boxShadow: "var(--surface-card-shadow)",
			}}
		>
			<p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">
				{label}
			</p>
			<p className="mt-1.5 font-poppins text-2xl font-bold text-smile-primary-dark">
				{loading ? "—" : value}
			</p>
			<div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary-light">
				<Icon icon={icon} width={18} className="text-smile-primary" />
			</div>
		</div>
	);
}

export function DashPanel({
	title,
	icon,
	children,
	right,
}: {
	title: string;
	icon: string;
	children: React.ReactNode;
	right?: React.ReactNode;
}) {
	return (
		<div
			className="relative overflow-hidden rounded-[20px] border backdrop-blur-xl"
			style={{
				background: "var(--surface-card-bg)",
				borderColor: "var(--surface-card-border)",
				boxShadow: "var(--surface-card-shadow)",
			}}
		>
			<div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[20px] bg-smile-primary/60" />
			<div
				className="flex items-center justify-between gap-2 border-b px-6 py-4"
				style={{ borderColor: "var(--surface-panel-border)" }}
			>
				<div className="flex items-center gap-2">
					<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary-light">
						<Icon icon={icon} width={16} className="text-smile-primary" />
					</span>
					<p className="font-poppins text-sm font-semibold text-smile-primary-dark">
						{title}
					</p>
				</div>
				{right}
			</div>
			{children}
		</div>
	);
}

export function DashLoading({ label = "Loading…" }: { label?: string }) {
	return (
		<div className="flex items-center justify-center gap-2 py-16 text-smile-description">
			<Icon icon="line-md:loading-twotone-loop" width={20} /> {label}
		</div>
	);
}

export function DashEmpty({ label = "No data" }: { label?: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 py-14 text-smile-description">
			<Icon icon="lucide:inbox" width={28} />
			<p className="font-inter text-sm">{label}</p>
		</div>
	);
}

export function DashError({
	label = "Something went wrong.",
	onRetry,
}: { label?: string; onRetry?: () => void }) {
	return (
		<div
			className="rounded-[20px] border p-6 text-center font-inter text-sm text-red-500 dark:text-red-400"
			style={{
				background: "var(--surface-card-bg)",
				borderColor: "var(--surface-card-border)",
			}}
		>
			{label}{" "}
			{onRetry && (
				<button onClick={onRetry} className="font-semibold underline">
					Retry
				</button>
			)}
		</div>
	);
}

export function DashQuickLink({
	href,
	icon,
	label,
	description,
}: { href: string; icon: string; label: string; description: string }) {
	return (
		<Link
			href={href}
			className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all hover:border-smile-primary/40 hover:shadow-[0_4px_20px_rgba(65,126,170,0.12)]"
			style={{
				background: "var(--surface-panel-bg)",
				borderColor: "var(--surface-panel-border)",
			}}
		>
			<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-smile-primary-light transition-all group-hover:bg-smile-primary">
				<Icon
					icon={icon}
					width={20}
					className="text-smile-primary transition-colors group-hover:text-white"
				/>
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-poppins text-sm font-semibold text-smile-primary-dark">
					{label}
				</p>
				<p className="truncate font-inter text-xs text-smile-description">
					{description}
				</p>
			</div>
			<Icon
				icon="lucide:arrow-right"
				width={14}
				className="shrink-0 text-smile-description transition-all group-hover:translate-x-1 group-hover:text-smile-primary"
			/>
		</Link>
	);
}

export const STATUS_STYLE: Record<string, string> = {
	scheduled: "text-smile-primary",
	confirmed: "text-emerald-500 dark:text-emerald-300",
	completed: "text-emerald-500 dark:text-emerald-300",
	in_progress: "text-smile-primary",
	active: "text-emerald-500 dark:text-emerald-300",
	pending: "text-amber-500 dark:text-amber-300",
	cancelled: "text-red-500 dark:text-red-300",
	no_show: "text-red-500 dark:text-red-300",
};

export const fmtDate = (d?: string) => (d ? String(d).split("T")[0] : "—");
export const num = (v: unknown): number => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};
