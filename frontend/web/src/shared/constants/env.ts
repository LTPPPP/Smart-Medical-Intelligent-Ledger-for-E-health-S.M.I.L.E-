const NEXT_API_URL = "/api/v1";

export const ENV = {
	API_URL: NEXT_API_URL,
	NODE_ENV: process.env.NODE_ENV || "development",
	SERVICES: {
		GATEWAY: NEXT_API_URL,
		IAM: NEXT_API_URL,
		CLINICAL: NEXT_API_URL,
		PAYMENT: NEXT_API_URL,
	},
} as const;

export const isDevelopment = ENV.NODE_ENV === "development";
export const isProduction = ENV.NODE_ENV === "production";
