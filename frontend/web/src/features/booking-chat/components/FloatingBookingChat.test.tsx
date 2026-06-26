import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";

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
        gender: "OTHER",
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
      JSON.stringify([{
        id: "conversation-other",
        title: "Other patient",
        createdAt: 1,
        messages: [{
          id: "message-other",
          role: "user",
          text: "Other patient transcript",
          safeState: {},
        }],
      }]),
    );

    render(<FloatingBookingChat />);
    await userEvent.click(screen.getByRole("button", { name: "Open SMILE scheduling assistant" }));

    expect(screen.getByText("SMILE scheduling assistant")).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem(PATIENT_STORAGE_KEY)).not.toBeNull());
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(screen.queryByText("Other patient transcript")).not.toBeInTheDocument();
  });

  it("shows a chat-style assistant status bubble while the request is pending", async () => {
    let resolveRequest!: (value: Awaited<ReturnType<typeof sendBookingChatMessage>>) => void;
    vi.mocked(sendBookingChatMessage).mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    render(<FloatingBookingChat />);
    await userEvent.click(screen.getByRole("button", { name: "Open SMILE scheduling assistant" }));
    await userEvent.type(screen.getByPlaceholderText("Type a scheduling request..."), "change my appointment");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("SMILE is reviewing your request")).toBeInTheDocument();
    expect(screen.getByText("Checking your appointments and available times.")).toBeInTheDocument();

    resolveRequest({
      reply: "Please choose which appointment you want to reschedule below.",
      flow: "reschedule",
      safe_state: {},
      actions: [],
      confirmation: null,
      metadata: {},
    });

    await waitFor(() => {
      expect(screen.queryByText("SMILE is reviewing your request")).not.toBeInTheDocument();
    });
  });

  it("allows signed-in users restored with an accountId-only auth payload to send", async () => {
    vi.mocked(sendBookingChatMessage).mockResolvedValue({
      reply: "Which dental service do you need?",
      flow: "booking",
      safe_state: {},
      actions: [],
      confirmation: null,
      metadata: {},
    });
    useAuthStore.setState({
      user: {
        accountId: "account-only-a",
        username: "patient-a",
        email: "patient-a@example.test",
        roles: ["PATIENT"],
        permissions: [],
      } as unknown as ReturnType<typeof useAuthStore.getState>["user"],
      accessToken: "token-a",
      refreshToken: "refresh-a",
    });

    render(<FloatingBookingChat />);
    await userEvent.click(screen.getByRole("button", { name: "Open SMILE scheduling assistant" }));
    await userEvent.type(screen.getByPlaceholderText("Type a scheduling request..."), "book an appointment");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(sendBookingChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "book an appointment" }),
    ));
  });
});
