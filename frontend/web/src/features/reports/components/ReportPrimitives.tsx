"use client";

import { Icon } from "@iconify/react";

// Shared theme-aware presentational primitives for reporting / list pages.
// Light glass by default; dark via CSS surface vars (set on .dark).
// TEAL/BLUE kept as named accents used by a few callers (charts, selects).
export const TEAL = "#38BDF8";
export const BLUE = "#417eaa";
export const cardBase =
	"rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]";

export function PageHeader({
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
				<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-smile-primary-light">
					<Icon icon={icon} width={24} className="text-smile-primary" />
				</span>
				<div>
					{eyebrow && (
						<p className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
							{eyebrow}
						</p>
					)}
					<h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">
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

export function StatCard({
	label,
	value,
	icon,
	loading,
	accent,
}: {
	label: string;
	value: React.ReactNode;
	icon: string;
	loading?: boolean;
	accent?: string;
}) {
	return (
		<div className={`${cardBase} relative overflow-hidden p-5`}>
			<p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">
				{label}
			</p>
			<p className="mt-2 font-poppins text-2xl font-bold text-smile-primary-dark">
				{loading ? "—" : value}
			</p>
			<div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary-light">
				<Icon
					icon={icon}
					width={18}
					style={accent ? { color: accent } : undefined}
					className={accent ? "" : "text-smile-primary"}
				/>
			</div>
		</div>
	);
}

export function CardPanel({
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
		<div className={`${cardBase} relative overflow-hidden`}>
			<div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[20px] bg-smile-primary/60" />
			<div className="flex items-center justify-between gap-2 border-b px-6 py-4 [border-color:var(--surface-panel-border)]">
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

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
	return (
		<div className="flex items-center justify-center gap-2 py-16 text-smile-description">
			<Icon icon="line-md:loading-twotone-loop" width={20} /> {label}
		</div>
	);
}

export function EmptyBlock({ label = "No data" }: { label?: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 py-14 text-smile-description">
			<Icon icon="lucide:inbox" width={28} />
			<p className="font-inter text-sm">{label}</p>
		</div>
	);
}

export function ErrorBlock({
	label = "Something went wrong.",
	onRetry,
}: {
	label?: string;
	onRetry?: () => void;
}) {
	return (
		<div
			className={`${cardBase} p-6 text-center font-inter text-sm text-red-500 dark:text-red-300`}
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
