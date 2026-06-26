import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { authApi } from "./auth";

vi.mock("@/shared/api/client", () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe("authApi.updateProfile", () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset();
  });

  it("sends editable profile fields to the account endpoint", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { accountId: "account-id" } });

    await authApi.updateProfile({
      fullName: "Nguyen Van A",
      dateOfBirth: "1995-06-15",
      gender: "MALE",
      address: "Da Nang",
      avatarUrl: "https://example.test/avatar.png",
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      expect.any(String),
      {
        fullName: "Nguyen Van A",
        dateOfBirth: "1995-06-15",
        gender: "MALE",
        address: "Da Nang",
        avatarUrl: "https://example.test/avatar.png",
      },
    );
  });
});
