const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/** A browser-safe request reference that is also safe to write to logs. */
export function createCorrelationId(): string {
	try {
		if (typeof globalThis.crypto?.randomUUID === "function") {
			return globalThis.crypto.randomUUID();
		}
	} catch {
		// Fall through to the deterministic-free fallback below.
	}

	return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeCorrelationId(value: unknown): string | undefined {
	if (Array.isArray(value)) return sanitizeCorrelationId(value[0]);
	if (typeof value !== "string") return undefined;
	return CORRELATION_ID_PATTERN.test(value) ? value : undefined;
}

export function readCorrelationId(headers: unknown): string | undefined {
	if (!headers || typeof headers !== "object") return undefined;
	const source = headers as Record<string, unknown>;
	const value =
		source["x-correlation-id"] ??
		source["X-Correlation-ID"] ??
		(typeof (headers as { get?: unknown }).get === "function"
			? (headers as { get(name: string): unknown }).get("x-correlation-id")
			: undefined);
	return sanitizeCorrelationId(value);
}
