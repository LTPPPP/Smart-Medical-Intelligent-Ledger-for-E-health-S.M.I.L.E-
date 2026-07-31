import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Providers } from "./Providers";
import { PublicConfigProvider } from "./PublicConfigProvider";

vi.mock("@react-oauth/google", () => ({
	GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="google-provider">{children}</div>
	),
}));

vi.mock("@tanstack/react-query-devtools", () => ({
	ReactQueryDevtools: () => null,
}));

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/shared/components/common/NavigationProgress", () => ({
	NavigationProgress: () => null,
}));

vi.mock("@/shared/components/ui/tooltip", () => ({
	TooltipProvider: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

describe("Providers", () => {
	afterEach(() => cleanup());

	it("renders app content without mounting the removed booking chat", () => {
		render(
			<PublicConfigProvider
				config={{
					API_TIMEOUT: 10_000,
					GOOGLE_CLIENT_ID: "",
					CLOUDINARY_CLOUD_NAME: "",
					CLOUDINARY_API_KEY: "",
					VAPID_PUBLIC_KEY: "",
				}}
			>
				<Providers>
					<main>App content</main>
				</Providers>
			</PublicConfigProvider>,
		);

		expect(screen.getByText("App content")).toBeInTheDocument();
		expect(screen.queryByTestId("floating-booking-chat")).not.toBeInTheDocument();
	});
});
