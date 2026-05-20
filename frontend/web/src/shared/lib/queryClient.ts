import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache data for 10 minutes after all observers unmount
    gcTime: 10 * 60 * 1000,
    // Retry once on failure
    retry: 1,
    // Don't refetch on window focus in development
    refetchOnWindowFocus: process.env.NODE_ENV === "production",
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // retry: 0 for mutations (don't retry payment, appointments etc.)
    retry: 0,
  },
};

function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: queryConfig });
}

// Singleton pattern: browser gets one instance, server gets a new one per request
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return makeQueryClient();
  }
  // Browser: reuse the same QueryClient
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
