export {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	LOCALE_LABELS,
	LOCALE_COOKIE_NAME,
	LOCALE_COOKIE_MAX_AGE,
	type Locale,
} from "./config";
export { LocaleProvider, useLocale, useSetLocale } from "./provider/LocaleProvider";
export { useTranslation } from "./hooks/useTranslation";
