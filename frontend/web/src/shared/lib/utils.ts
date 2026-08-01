import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Safe Callback URL */
export function getSafeCallbackUrl(
	callbackUrl: string | null | undefined,
	fallback: string,
): string {
	if (!callbackUrl) return fallback;
	if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//"))
		return fallback;
	return callbackUrl;
}
