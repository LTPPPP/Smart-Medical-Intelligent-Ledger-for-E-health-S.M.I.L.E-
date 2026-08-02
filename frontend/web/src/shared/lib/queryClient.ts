// Query Client

import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
	queries: {
		// Fresh For 5min
		staleTime: 5 * 60 * 1000,
		// Cache For 10min
		gcTime: 10 * 60 * 1000,
		// Retry Once
		retry: 1,
		// No Refetch Dev
		refetchOnWindowFocus: process.env.NODE_ENV === "production",
		// Refetch On Reconnect
		refetchOnReconnect: true,
	},
	mutations: {
		// No Mutation Retry
		retry: 0,
	},
};

function makeQueryClient(): QueryClient {
	return new QueryClient({ defaultOptions: queryConfig });
}

// Singleton Pattern
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
	if (typeof window === "undefined") {
		// Server New Client
		return makeQueryClient();
	}
	// Browser Reuse Client
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}
