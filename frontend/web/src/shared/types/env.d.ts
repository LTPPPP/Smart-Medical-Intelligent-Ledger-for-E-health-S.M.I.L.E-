declare namespace NodeJS {
	interface ProcessEnv {
		BACKEND_URL?: string;
		API_TIMEOUT?: string;
		GOOGLE_CLIENT_ID?: string;
		CLOUDINARY_CLOUD_NAME?: string;
		CLOUDINARY_API_KEY?: string;
		VAPID_PUBLIC_KEY?: string;
		NODE_ENV: "development" | "production" | "test";
	}
}
