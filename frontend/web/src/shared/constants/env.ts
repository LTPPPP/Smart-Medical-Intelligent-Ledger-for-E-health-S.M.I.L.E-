// All backend traffic goes through the API Gateway (gateway-service), which proxies
// /api/v1/<resource> to the underlying microservices (iam-service, clinical-emr-service,
// payment-service, ...). There's a single gateway origin, so the FE only needs one URL.
const NEXT_API_URL =
	process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080/api/v1";

export const ENV = {
	API_URL: NEXT_API_URL,
	NODE_ENV: process.env.NODE_ENV || "development",
	API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10),
	GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",

	// All keyed to the same gateway origin today — kept as named aliases (matching
	// the backend service split) so call sites read as "which service this hits",
	// not as independently-configurable URLs.
	SERVICES: {
		GATEWAY: NEXT_API_URL,
		IAM: NEXT_API_URL,
		CLINICAL: NEXT_API_URL,
		PAYMENT: NEXT_API_URL,
	},
} as const;

export const isDevelopment = ENV.NODE_ENV === "development";
export const isProduction = ENV.NODE_ENV === "production";
