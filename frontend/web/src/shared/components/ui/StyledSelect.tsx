"use client";

import { Icon } from "@iconify/react";

const baseInputCls =
	"h-11 w-full rounded-xl border px-4 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50 [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]";

// Native <select> With A Custom Chevron — Hides The Native Arrow (`appearance-none`)
// So It Matches The Rest Of The App's Inputs Instead Of The OS Default Widget.
export function StyledSelect({
	value,
	onChange,
	disabled,
	className,
	children,
}: {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="relative">
			<select
				className={`${className ?? baseInputCls} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
			>
				{children}
			</select>
			<Icon
				icon="lucide:chevron-down"
				width={16}
				className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-smile-description"
			/>
		</div>
	);
}
