// I18n Configuration

export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";

export const LOCALE_LABELS: Record<Locale, string> = {
	vi: "Tiếng Việt",
	en: "English",
};

export const LOCALE_COOKIE_NAME = "smile_locale";
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 Year
