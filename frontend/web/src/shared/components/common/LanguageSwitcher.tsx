// ============================================================
// LanguageSwitcher — compact locale toggle for the Header
// ============================================================

"use client";

import { Icon } from "@iconify/react";

import {
	LOCALE_LABELS,
	SUPPORTED_LOCALES,
	type Locale,
	useLocale,
	useSetLocale,
} from "@/features/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

export function LanguageSwitcher() {
	const locale = useLocale();
	const setLocale = useSetLocale();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(props) => (
					<button
						type="button"
						aria-label="Change language"
						className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary aria-expanded:bg-smile-primary-light/40 aria-expanded:text-smile-primary"
						{...props}
					>
						<Icon icon="lucide:globe" width={18} />
					</button>
				)}
			/>
			<DropdownMenuContent align="end">
				{SUPPORTED_LOCALES.map((loc) => (
					<DropdownMenuItem
						key={loc}
						onClick={() => setLocale(loc as Locale)}
						className={cn(locale === loc && "bg-accent font-medium")}
					>
						{LOCALE_LABELS[loc]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
