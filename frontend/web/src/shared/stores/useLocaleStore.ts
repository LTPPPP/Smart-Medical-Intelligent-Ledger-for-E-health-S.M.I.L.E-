

import { create } from "zustand";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "@/config/i18n";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`),
  );
  return (match?.[1] as Locale) ?? DEFAULT_LOCALE;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    // Persist to cookie
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
    set({ locale });
  },
}));

// Selectors
export const useLocale = () => useLocaleStore((s) => s.locale);
export const useSetLocale = () => useLocaleStore((s) => s.setLocale);
