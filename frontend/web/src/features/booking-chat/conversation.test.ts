import { describe, expect, it } from "vitest";

import {
  appendConversationMessage,
  createConversation,
  getConversationStorageKey,
  loadStoredConversations,
  STORAGE_KEY_PREFIX,
} from "./conversation";
import type { BookingChatMessage } from "./types";

describe("booking chat conversation helpers", () => {
  it("scopes storage to the signed-in patient", () => {
    expect(getConversationStorageKey("patient-a")).toBe(`${STORAGE_KEY_PREFIX}:patient-a`);
    expect(getConversationStorageKey()).toBeNull();
  });

  it("removes legacy global storage and falls back for corrupt patient storage", () => {
    const storage = window.localStorage;
    storage.clear();
    storage.setItem(STORAGE_KEY_PREFIX, "legacy");
    storage.setItem(`${STORAGE_KEY_PREFIX}:patient-a`, "not-json");

    const conversations = loadStoredConversations(storage, `${STORAGE_KEY_PREFIX}:patient-a`);

    expect(storage.getItem(STORAGE_KEY_PREFIX)).toBeNull();
    expect(storage.getItem(`${STORAGE_KEY_PREFIX}:patient-a`)).toBeNull();
    expect(conversations).toHaveLength(1);
    expect(conversations[0]?.messages[0]?.id).toBe("welcome");
  });

  it("updates a new conversation title from the first user message", () => {
    const conversation = createConversation();
    const message: BookingChatMessage = {
      id: "message-1",
      role: "user",
      text: "I need a cleaning appointment next week",
      safeState: {},
    };

    const updated = appendConversationMessage(conversation, message);

    expect(updated.title).toBe("I need a cleaning appointment next week");
    expect(updated.messages).toHaveLength(2);
  });
});
