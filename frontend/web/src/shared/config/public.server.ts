import "server-only";

import type { PublicConfig } from "./public";

function getApiTimeout(): number {
	const value = process.env.API_TIMEOUT ?? "10000";

	if (!/^\d+$/.test(value)) {
		throw new Error(
			"API_TIMEOUT must be a positive integer measured in milliseconds.",
		);
	}

	const timeout = Number(value);
	if (!Number.isSafeInteger(timeout) || timeout <= 0) {
		throw new Error(
			"API_TIMEOUT must be a positive integer measured in milliseconds.",
		);
	}

	return timeout;
}

export function getPublicConfig(): PublicConfig {
	return {
		API_TIMEOUT: getApiTimeout(),
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
		CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
		CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
		VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? "",
	};
}
