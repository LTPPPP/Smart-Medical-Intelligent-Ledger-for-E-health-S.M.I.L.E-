import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Providers } from "./Providers";

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

vi.mock("@/features/booking-chat/components/FloatingBookingChat", () => ({
	FloatingBookingChat: () => <div data-testid="floating-booking-chat" />,
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

	it("mounts the floating booking chat globally", () => {
		render(
			<Providers>
				<main>App content</main>
			</Providers>,
		);

		expect(screen.getByText("App content")).toBeInTheDocument();
		expect(screen.getByTestId("floating-booking-chat")).toBeInTheDocument();
	});
});
