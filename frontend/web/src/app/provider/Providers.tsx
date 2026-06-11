// ============================================================
// Client-side providers — wraps the entire app
// QueryClient + Theme + Tooltip + Toaster + NuqsAdapter
// ============================================================

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { NavigationProgress } from "@/shared/components/common/NavigationProgress";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { getQueryClient } from "@/shared/lib/queryClient";

interface ProvidersProps {
	children: React.ReactNode;
}

// Inner component so useTheme can be called inside ThemeProvider
function SonnerToaster() {
	const { resolvedTheme } = useTheme();
	return (
		<Toaster
			position="top-right"
			theme={(resolvedTheme as "light" | "dark" | "system") ?? "system"}
			richColors
			closeButton
			duration={4000}
		/>
	);
}

export function Providers({ children }: ProvidersProps) {
	const queryClient = getQueryClient();
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

	const app = (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<NuqsAdapter>
					<TooltipProvider delay={300}>
						<NavigationProgress />
						{children}
						<SonnerToaster />
					</TooltipProvider>
				</NuqsAdapter>
			</ThemeProvider>
			{process.env.NODE_ENV === "development" && (
				<ReactQueryDevtools
					initialIsOpen={false}
					buttonPosition="bottom-left"
				/>
			)}
		</QueryClientProvider>
	);

	if (!googleClientId) {
		return app;
	}

	return (
		<GoogleOAuthProvider clientId={googleClientId}>
			{app}
		</GoogleOAuthProvider>
	);
}

