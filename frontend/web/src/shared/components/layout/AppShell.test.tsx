import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	AppShell,
	SIDEBAR_COLLAPSED_STORAGE_KEY,
} from "@/shared/components/layout/AppShell";

const mocks = vi.hoisted(() => ({
	logout: vi.fn(),
	push: vi.fn(),
}));

vi.mock("next/image", () => ({
	default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard",
	useRouter: () => ({ push: mocks.push }),
}));

vi.mock("next-themes", () => ({
	useTheme: () => ({
		resolvedTheme: "light",
		setTheme: vi.fn(),
	}),
}));

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => (
		<span aria-hidden="true" data-icon={icon} />
	),
}));

vi.mock("@/features/auth/store/authStore", () => ({
	useAuthStore: () => ({
		user: {
			email: "admin@smile.test",
			fullName: "Admin User",
			roles: ["ROLE_ADMIN"],
		},
		logout: mocks.logout,
	}),
}));

vi.mock("@/features/notification/components/NotificationBell", () => ({
	NotificationBell: () => (
		<button type="button" aria-label="Notifications">
			Notifications
		</button>
	),
}));

describe("AppShell desktop sidebar", () => {
	beforeEach(() => {
		window.localStorage.clear();
		mocks.logout.mockReset();
		mocks.push.mockReset();
	});

	afterEach(() => cleanup());

	it("collapses the desktop rail, updates layout offsets, and restores the preference", async () => {
		const user = userEvent.setup();
		const firstRender = render(
			<AppShell>
				<main>Page content</main>
			</AppShell>,
		);

		const desktopSidebar = screen.getByTestId("desktop-sidebar");
		const shellContent = screen.getByTestId("app-shell-content");
		const collapseButton = screen.getByRole("button", {
			name: "Collapse sidebar",
		});

		expect(desktopSidebar).toHaveClass("w-72");
		expect(shellContent).toHaveClass("lg:pl-72");
		expect(collapseButton).toHaveAttribute("aria-expanded", "true");

		await user.click(collapseButton);

		expect(desktopSidebar).toHaveClass("w-20");
		expect(shellContent).toHaveClass("lg:pl-20");
		expect(
			screen.getByRole("button", { name: "Expand sidebar" }),
		).toHaveAttribute("aria-expanded", "false");
		expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
			"true",
		);

		firstRender.unmount();

		render(
			<AppShell>
				<main>Reloaded content</main>
			</AppShell>,
		);

		expect(
			await screen.findByRole("button", { name: "Expand sidebar" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("desktop-sidebar")).toHaveClass("w-20");
	});

	it("keeps the mobile drawer fully expanded when the desktop rail is collapsed", async () => {
		window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "true");
		const user = userEvent.setup();

		render(
			<AppShell>
				<main>Page content</main>
			</AppShell>,
		);

		expect(
			await screen.findByRole("button", { name: "Expand sidebar" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Open menu" }));

		const mobileSidebar = await screen.findByTestId("mobile-sidebar");
		expect(mobileSidebar).toHaveClass("w-72");
		expect(mobileSidebar).not.toHaveClass("w-20");
		expect(within(mobileSidebar).getByText("New Booking")).toBeVisible();
	});

	it("expands the rail before showing a collapsed navigation group", async () => {
		window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "true");
		const user = userEvent.setup();

		render(
			<AppShell>
				<main>Page content</main>
			</AppShell>,
		);

		await screen.findByRole("button", { name: "Expand sidebar" });
		await user.click(screen.getByRole("button", { name: "Admin Panel" }));

		expect(screen.getByTestId("desktop-sidebar")).toHaveClass("w-72");
		expect(screen.getByRole("button", { name: "Admin Panel" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		expect(
			screen.getByRole("link", { name: "User Management" }),
		).toBeInTheDocument();
		expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
			"false",
		);
	});
});
