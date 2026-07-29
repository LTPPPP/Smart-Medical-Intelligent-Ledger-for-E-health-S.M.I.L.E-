declare namespace NodeJS {
	interface ProcessEnv {
		NEXT_PUBLIC_GATEWAY_URL: string;
		NEXT_PUBLIC_API_TIMEOUT: string;
		NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
		NODE_ENV: "development" | "production" | "test";
	}
}
