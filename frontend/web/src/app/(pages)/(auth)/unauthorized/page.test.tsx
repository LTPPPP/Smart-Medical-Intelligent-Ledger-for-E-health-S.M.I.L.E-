import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UnauthorizedPage from "./page";

const mocks = vi.hoisted(() => ({
	replace: vi.fn(),
	logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: mocks.replace }),
	useSearchParams: () =>
		new URLSearchParams(
			"from=%2Fschedules%2Fdoctors&roles=ADMIN%2CMANAGER",
		),
}));

vi.mock("@/features/auth/store/authStore", () => ({
	useAuthStore: () => ({
		user: { roles: ["ROLE_DOCTOR"] },
		logout: mocks.logout,
	}),
}));

vi.mock("@iconify/react", () => ({
	Icon: () => <span aria-hidden="true" />,
}));

describe("UnauthorizedPage", () => {
	beforeEach(() => {
		mocks.replace.mockReset();
		mocks.logout.mockReset();
	});

	it("explains the denied page and provides deterministic exits", async () => {
		render(<UnauthorizedPage />);

		expect(screen.getByText("/schedules/doctors")).toBeInTheDocument();
		expect(screen.getByText("Doctor")).toBeInTheDocument();
		expect(screen.getByText("Admin, Manager")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /go back/i }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
			"href",
			"/dashboard",
		);

		await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
		expect(mocks.logout).toHaveBeenCalledOnce();
		expect(mocks.replace).toHaveBeenCalledWith("/login");
	});
});
