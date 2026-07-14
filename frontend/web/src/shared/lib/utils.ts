import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Only allow same-origin relative paths (rejects "//host", "https://host", etc.) to guard against open-redirect via callbackUrl. */
export function getSafeCallbackUrl(callbackUrl: string | null | undefined, fallback: string): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return fallback;
  return callbackUrl;
}
