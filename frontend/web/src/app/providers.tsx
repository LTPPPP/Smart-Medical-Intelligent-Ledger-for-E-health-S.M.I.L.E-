// ============================================================
// Client-side providers — wraps the entire app
// QueryClient + Theme + Tooltip + Toaster + NuqsAdapter
// ============================================================

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/queryClient";
import { NavigationProgress } from "@/components/shared/NavigationProgress";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const queryClient = getQueryClient();

    return (
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
                        <Toaster
                            position="top-right"
                            richColors
                            closeButton
                            duration={4000}
                        />
                    </TooltipProvider>
                </NuqsAdapter>
            </ThemeProvider>
            {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            )}
        </QueryClientProvider>
    );
}
