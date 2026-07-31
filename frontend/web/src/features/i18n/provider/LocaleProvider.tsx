"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_MAX_AGE,
	LOCALE_COOKIE_NAME,
	type Locale,
} from "../config";

interface LocaleContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
	locale: DEFAULT_LOCALE,
	setLocale: () => {},
});

function readLocaleCookie(): Locale | undefined {
	if (typeof document === "undefined") return undefined;
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`),
	);
	return match?.[1] as Locale | undefined;
}

/**
 * Provides the active locale to the app and keeps <html lang> in sync so
 * screen readers/browser features match what's actually rendered.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

	useEffect(() => {
		const stored = readLocaleCookie() ?? DEFAULT_LOCALE;
		setLocaleState(stored);
		document.documentElement.lang = stored;
	}, []);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		document.documentElement.lang = next;
		document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
	}, []);

	return (
		<LocaleContext.Provider value={{ locale, setLocale }}>
			{children}
		</LocaleContext.Provider>
	);
}

export const useLocale = () => useContext(LocaleContext).locale;
export const useSetLocale = () => useContext(LocaleContext).setLocale;
