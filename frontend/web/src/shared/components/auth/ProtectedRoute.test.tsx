import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./ProtectedRoute";

const mocks = vi.hoisted(() => {
	const replace = vi.fn();
	const push = vi.fn();
	const rehydrate = vi.fn<() => Promise<void>>(() => Promise.resolve());
	const authState = {
		accessToken: "test-token",
		user: {
			roles: ["ROLE_DOCTOR"],
			permissions: [],
		},
	};
	const store = Object.assign(vi.fn(() => authState), {
		persist: {
			hasHydrated: () => true,
			onHydrate: () => () => undefined,
			onFinishHydration: () => () => undefined,
			rehydrate,
		},
	});
	return { replace, push, rehydrate, authState, store };
});

vi.mock("next/navigation", () => ({
	usePathname: () => "/schedules/doctors",
	useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));

vi.mock("@/features/auth/store/authStore", () => ({
	useAuthStore: mocks.store,
}));

vi.mock("@/shared/components/common/Loading", () => ({
	Loading: ({ text }: { text: string }) => <div>{text}</div>,
}));

describe("ProtectedRoute", () => {
	beforeEach(() => {
		mocks.replace.mockReset();
		mocks.push.mockReset();
		mocks.rehydrate.mockReset();
		mocks.rehydrate.mockResolvedValue();
		mocks.authState.accessToken = "test-token";
		mocks.authState.user.roles = ["ROLE_DOCTOR"];
		mocks.authState.user.permissions = [];
	});

	afterEach(() => cleanup());

	it("accepts ROLE_-prefixed roles after persisted auth rehydrates", async () => {
		render(
			<ProtectedRoute requiredRoles={["DOCTOR"]}>
				<div>Protected content</div>
			</ProtectedRoute>,
		);

		expect(await screen.findByText("Protected content")).toBeInTheDocument();
		expect(mocks.replace).not.toHaveBeenCalled();
	});

	it("does not redirect while persisted auth is still rehydrating", async () => {
		let finishHydration: (() => void) | undefined;
		mocks.rehydrate.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finishHydration = resolve;
				}),
		);

		render(
			<ProtectedRoute requiredRoles={["DOCTOR"]}>
				<div>Protected content</div>
			</ProtectedRoute>,
		);

		expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
		expect(mocks.replace).not.toHaveBeenCalled();

		await act(async () => finishHydration?.());

		expect(await screen.findByText("Protected content")).toBeInTheDocument();
		expect(mocks.replace).not.toHaveBeenCalled();
	});

	it("replaces a denied route with useful authorization context", async () => {
		render(
			<ProtectedRoute requiredRoles={["ADMIN", "MANAGER"]}>
				<div>Protected content</div>
			</ProtectedRoute>,
		);

		await waitFor(() =>
			expect(mocks.replace).toHaveBeenCalledWith(
				"/unauthorized?from=%2Fschedules%2Fdoctors&roles=ADMIN%2CMANAGER",
			),
		);
		expect(mocks.push).not.toHaveBeenCalled();
		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});
});
