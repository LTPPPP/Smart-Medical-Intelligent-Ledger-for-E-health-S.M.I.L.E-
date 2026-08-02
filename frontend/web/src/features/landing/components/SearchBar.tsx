"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/features/i18n";
import { ROUTES } from "@/shared/constants/routes";

import { ArrowButton } from "./ArrowButton";

export function SearchBar() {
	const { t } = useTranslation();
	const router = useRouter();
	const [value, setValue] = useState("");

	function goToChat() {
		const trimmed = value.trim();
		router.push(
			trimmed ? `${ROUTES.CHAT}?q=${encodeURIComponent(trimmed)}` : ROUTES.CHAT,
		);
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				goToChat();
			}}
			className="flex items-center gap-2 rounded-full px-5 py-3 backdrop-blur-sm"
			style={{
				background: "var(--surface-input-bg)",
				border: "1px solid var(--surface-input-border)",
				boxShadow: "var(--surface-input-shadow)",
			}}
		>
			<input
				type="text"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder={t(
					"landing.searchBar.placeholder",
					"How can we help your smile today?",
				)}
				className="flex-1 bg-transparent font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description dark:text-[#E1E2E6] dark:placeholder:text-[#8B9199]"
				aria-label={t("landing.searchBar.ariaLabel", "Search dental services")}
			/>
			<ArrowButton size="sm" rotation={90} onClick={goToChat} />
		</form>
	);
}
