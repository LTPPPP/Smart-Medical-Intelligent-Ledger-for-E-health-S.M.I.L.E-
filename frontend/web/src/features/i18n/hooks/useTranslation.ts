// ============================================================
// useTranslation — lightweight i18n hook with nested key access
// ============================================================

"use client";

import { useCallback, useMemo } from "react";

import type { Locale } from "../config";
import en from "../dictionaries/en";
import vi from "../dictionaries/vi";
import { useLocale } from "../provider/LocaleProvider";

const dictionaries: Record<Locale, Record<string, unknown>> = { vi, en };

/**
 * Resolve nested key like "auth.login" from a dictionary object
 */
function resolveKey(
	dict: Record<string, unknown>,
	key: string,
): string | undefined {
	const parts = key.split(".");
	let current: unknown = dict;

	for (const part of parts) {
		if (current === null || current === undefined) return;
		if (typeof current !== "object") return;
		current = (current as Record<string, unknown>)[part];
	}

	return typeof current === "string" ? current : undefined;
}

/**
 * Hook for accessing translations.
 * Returns a `t` function that resolves dot-notation keys.
 *
 * @example
 * const { t } = useTranslation();
 * t("auth.login") // "Đăng nhập" or "Sign In"
 */
export function useTranslation() {
	const locale = useLocale();

	const t = useCallback(
		(key: string, fallback?: string): string => {
			const dict = dictionaries[locale];
			return resolveKey(dict, key) ?? fallback ?? key;
		},
		[locale],
	);

	return useMemo(() => ({ t, locale }), [t, locale]);
}
