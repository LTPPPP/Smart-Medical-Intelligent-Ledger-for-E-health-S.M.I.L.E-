"use client";

import { ArrowButton } from "./ArrowButton";

export function SearchBar() {
	return (
		<div
			className="flex items-center gap-2 rounded-full px-5 py-3 backdrop-blur-sm"
			style={{
				background: "var(--surface-input-bg)",
				border: "1px solid var(--surface-input-border)",
				boxShadow: "var(--surface-input-shadow)",
			}}
		>
			<input
				type="text"
				placeholder="How can we help your smile today?"
				className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description dark:text-[#E1E2E6] dark:placeholder:text-[#8B9199]"
				aria-label="Search dental services"
			/>
			<ArrowButton size="sm" rotation={90} />
		</div>
	);
}
