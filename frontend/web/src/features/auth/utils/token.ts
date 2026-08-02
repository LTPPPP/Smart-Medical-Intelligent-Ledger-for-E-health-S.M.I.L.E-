// JWT Token Helpers

export function decodeJwt<T = Record<string, unknown>>(
	token?: string | null,
): T | null {
	if (!token) return null;
	try {
		const base64Url = token.split(".")[1];
		if (!base64Url) return null;

		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join(""),
		);

		return JSON.parse(jsonPayload) as T;
	} catch {
		return null;
	}
}

// Check Token Expiry
export function isTokenExpired(token: string): boolean {
	const decoded = decodeJwt<{ exp?: number }>(token);
	if (!decoded || !decoded.exp) return true;

	const now = Math.floor(Date.now() / 1000);
	return decoded.exp < now;
}
