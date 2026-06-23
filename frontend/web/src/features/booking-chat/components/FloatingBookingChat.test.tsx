import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";

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
  beforeEach(() => {
    window.localStorage.clear();
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
});
