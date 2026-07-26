import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { GENDER } from "@/shared/constants/common";

import { sendBookingChatMessage } from "../api";
import { FloatingBookingChat } from "./FloatingBookingChat";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

vi.mock("../api", () => ({
	sendBookingChatMessage: vi.fn(),
}));

const LEGACY_STORAGE_KEY = "smile-booking-chat-conversations";
const PATIENT_STORAGE_KEY = "smile-booking-chat-conversations:patient-a";

describe("FloatingBookingChat transcript storage", () => {
	afterEach(() => cleanup());

	beforeEach(() => {
		window.localStorage.clear();
		vi.mocked(sendBookingChatMessage).mockReset();
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

	it("does not restore legacy global transcripts for the signed-in patient", async () => {
		window.localStorage.setItem(
			LEGACY_STORAGE_KEY,
			JSON.stringify([
				{
					id: "conversation-other",
					title: "Other patient",
					createdAt: 1,
					messages: [
						{
							id: "message-other",
							role: "user",
							text: "Other patient transcript",
							safeState: {},
						},
					],
				},
			]),
		);

		render(<FloatingBookingChat />);
		await userEvent.click(
			screen.getByRole("button", { name: "Open SMILE scheduling assistant" }),
		);

		expect(screen.getByText("SMILE scheduling assistant")).toBeInTheDocument();
		await waitFor(() =>
			expect(window.localStorage.getItem(PATIENT_STORAGE_KEY)).not.toBeNull(),
		);
		expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
		expect(
			screen.queryByText("Other patient transcript"),
		).not.toBeInTheDocument();
	});

	it("shows a chat-style assistant status bubble while the request is pending", async () => {
		let resolveRequest!: (
			value: Awaited<ReturnType<typeof sendBookingChatMessage>>,
		) => void;
		vi.mocked(sendBookingChatMessage).mockReturnValue(
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
			reply: "Please choose which appointment you want to reschedule below.",
			flow: "reschedule",
			safe_state: {},
			actions: [],
			confirmation: null,
			metadata: {},
		});

		await waitFor(() => {
			expect(
				screen.queryByText("SMILE is reviewing your request"),
			).not.toBeInTheDocument();
		});
	});
});
