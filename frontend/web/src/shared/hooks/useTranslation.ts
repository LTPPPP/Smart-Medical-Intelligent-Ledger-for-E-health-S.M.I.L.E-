

"use client";

import { useCallback, useMemo } from "react";

import type { Locale } from "@/config/i18n";
import { useLocale } from "@/shared/stores/useLocaleStore";

// Lazy-load dictionaries to avoid bundling both in initial chunk
const dictionaries: Record<Locale, () => Promise<Record<string, unknown>>> = {
  vi: () => import("@/locales/vi/index").then((m) => m.default),
  en: () => import("@/locales/en/index").then((m) => m.default),
};

// Cache loaded dictionaries in memory
const cache = new Map<Locale, Record<string, unknown>>();

if (typeof window !== "undefined") {
  void dictionaries.vi().then((d) => cache.set("vi", d));
  void dictionaries.en().then((d) => cache.set("en", d));
}

/**
 * Resolve nested key like "auth.login" from a dictionary object
 */
function resolveKey(dict: Record<string, unknown>, key: string): string | undefined {
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
      const dict = cache.get(locale);
      if (!dict) return fallback ?? key;
      return resolveKey(dict, key) ?? fallback ?? key;
    },
    [locale],
  );

  return useMemo(() => ({ t, locale }), [t, locale]);
}
