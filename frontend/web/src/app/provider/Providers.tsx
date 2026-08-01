// App Providers

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { usePublicConfig } from "@/app/provider/PublicConfigProvider";
import { LocaleProvider } from "@/features/i18n";
import { apiClient } from "@/shared/api/client";
import { NavigationProgress } from "@/shared/components/common/NavigationProgress";
import { ScaleProvider } from "@/shared/components/layout/ScaleProvider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { getQueryClient } from "@/shared/lib/queryClient";

interface ProvidersProps {
	children: React.ReactNode;
}

// Inner Theme Toaster
function SonnerToaster() {
	const { resolvedTheme } = useTheme();
	return (
		<Toaster
			position="top-right"
			theme={resolvedTheme === "dark" ? "dark" : "light"}
			richColors
			closeButton
			duration={4000}
		/>
	);
}

export function Providers({ children }: ProvidersProps) {
	const queryClient = getQueryClient();
	const { API_TIMEOUT, GOOGLE_CLIENT_ID } = usePublicConfig();
	apiClient.defaults.timeout = API_TIMEOUT;

	const app = (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				enableSystem={false}
				disableTransitionOnChange
			>
				<ScaleProvider>
					<LocaleProvider>
						<NuqsAdapter>
							<TooltipProvider delay={300}>
								<NavigationProgress />
								{children}
								<SonnerToaster />
							</TooltipProvider>
						</NuqsAdapter>
					</LocaleProvider>
				</ScaleProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);

	// Fallback Google Client Id
	const clientId =
		GOOGLE_CLIENT_ID ||
		"smile-google-not-configured.apps.googleusercontent.com";

	return <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider>;
}
