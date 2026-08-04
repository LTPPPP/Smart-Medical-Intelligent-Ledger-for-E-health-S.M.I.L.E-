import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { GENDER } from "@/shared/constants/common";

import { streamBookingChatMessage } from "../api";
import { FloatingBookingChat } from "./FloatingBookingChat";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

vi.mock("../api", () => ({
	streamBookingChatMessage: vi.fn(),
}));

vi.mock("@/features/i18n", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/features/i18n")>();
	return {
		...actual,
		useTranslation: () => ({
			t: (_key: string, fallback?: string) => fallback ?? _key,
			locale: "en" as const,
		}),
	};
});

describe("FloatingBookingChat", () => {
	afterEach(() => cleanup());

	beforeEach(() => {
		vi.mocked(streamBookingChatMessage).mockReset();
		useAuthStore.setState({
			user: {
				userId: "patient-a",
				username: "patient-a",
				email: "patient-a@example.test",
				phone: "",
				fullName: "Patient A",
				dateOfBirth: "",
				gender: GENDER.UNKNOWN,
				avatarUrl: "",
				status: "ACTIVE",
				emailVerified: true,
				phoneVerified: false,
				lastLoginAt: null,
				createdAt: "",
				updatedAt: "",
				roles: ["PATIENT"],
				permissions: [],
			},
			accessToken: "token-a",
			refreshToken: "refresh-a",
		});
	});

	it("starts with only the welcome message — no transcript persists across mounts", async () => {
		render(<FloatingBookingChat />);
		await userEvent.click(
			screen.getByRole("button", { name: "Open SMILE scheduling assistant" }),
		);

		expect(screen.getByText("SMILE scheduling assistant")).toBeInTheDocument();
		expect(
			screen.getByText(/Choose an option below or type what you need/),
		).toBeInTheDocument();
	});

	it("shows a chat-style assistant status bubble while the request is pending", async () => {
		let resolveRequest!: (
			value: Awaited<ReturnType<typeof streamBookingChatMessage>>,
		) => void;
		vi.mocked(streamBookingChatMessage).mockReturnValue(
			new Promise((resolve) => {
				resolveRequest = resolve;
			}),
		);

		render(<FloatingBookingChat />);
		await userEvent.click(
			screen.getByRole("button", { name: "Open SMILE scheduling assistant" }),
		);
		await userEvent.type(
			screen.getByPlaceholderText("Type a scheduling request..."),
			"change my appointment",
		);
		await userEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(
			screen.getByText("SMILE is reviewing your request"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Checking your appointments and available times."),
		).toBeInTheDocument();

		resolveRequest({
			type: "final",
			reply: "Please choose which appointment you want to reschedule below.",
			flow: "reschedule",
			safe_state: {},
			state: {},
		});

		await waitFor(() => {
			expect(
				screen.queryByText("SMILE is reviewing your request"),
			).not.toBeInTheDocument();
		});
	});
});
