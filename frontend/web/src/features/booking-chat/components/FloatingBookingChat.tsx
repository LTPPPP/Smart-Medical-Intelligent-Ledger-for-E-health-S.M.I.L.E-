"use client";

import { FormEvent, useEffect, useState } from "react";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";

import { sendBookingChatMessage } from "../api";
import type { BookingChatActionRequest, BookingChatConfirmation, BookingChatMessage } from "../types";
import {
  AppointmentActionList,
  BookingSlotPicker,
  buildSlotSelectionMessage,
  slotLabel,
  type AppointmentAction,
  type AppointmentPreview,
  type BookingOptionPreview,
} from "./BookingChatControls";

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: BookingChatMessage[];
}

const STORAGE_KEY = "smile-booking-chat-conversations";

function createId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

function welcomeMessage(): BookingChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: "Hi, I am SMILE's scheduling assistant. Choose an option below or type what you need.",
    safeState: {},
  };
}

function createConversation() {
  return {
    id: createId("conversation"),
    title: "New conversation",
    createdAt: Date.now(),
    messages: [welcomeMessage()],
  };
}

function MessageText({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const shouldList = lines.length > 1 || lines.some((line) => /^[-*]\s+/.test(line));
  if (!shouldList) return <p>{text}</p>;
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const isBullet = /^[-*]\s+/.test(line);
        return isBullet ? (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{line.replace(/^[-*]\s+/, "")}</span>
          </div>
        ) : (
          <p key={`${line}-${index}`}>{line}</p>
        );
      })}
    </div>
  );
}

function AssistantDataCard({
  message,
  onSelectSlot,
  onAppointmentAction,
  isSending,
}: {
  message: BookingChatMessage;
  onSelectSlot: (option: BookingOptionPreview, flow?: BookingChatMessage["flow"]) => void;
  onAppointmentAction: (action: AppointmentAction) => void;
  isSending: boolean;
}) {
  const option = message.safeState?.booking_option as BookingOptionPreview | undefined;
  const options = message.safeState?.booking_options as BookingOptionPreview[] | undefined;
  const appointments = message.safeState?.appointments as AppointmentPreview[] | undefined;

  if (option) {
    const slotItems = options?.length ? options : [option];
    return (
      <BookingSlotPicker
        options={slotItems}
        disabled={isSending}
        onSelect={(item) => onSelectSlot(item, message.flow)}
      />
    );
  }

  if (Array.isArray(appointments) && appointments.length > 0) {
    return (
      <AppointmentActionList
        appointments={appointments}
        disabled={isSending}
        onAction={onAppointmentAction}
      />
    );
  }

  return null;
}

export function FloatingBookingChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? "");
  const [pendingConfirmation, setPendingConfirmation] = useState<BookingChatConfirmation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 780, height: 620 });
  const [historyOpen, setHistoryOpen] = useState(true);

  const patientId = user?.userId;
  const activeConversation = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const canSend = Boolean(patientId && input.trim() && !isSending);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setConversations(parsed);
        setActiveId(parsed[0].id);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  function updateConversation(conversationId: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId ? updater(conversation) : conversation
    )));
  }

  function addConversation() {
    const next = createConversation();
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
    setPendingConfirmation(null);
  }

  function appendMessage(conversationId: string, message: BookingChatMessage) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.title === "New conversation" && message.role === "user"
        ? message.text.slice(0, 42)
        : conversation.title,
      messages: [...conversation.messages, message],
    }));
  }

  function beginResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    function onMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(window.innerWidth - 32, Math.max(360, startWidth + (startX - moveEvent.clientX)));
      const nextHeight = Math.min(window.innerHeight - 32, Math.max(520, startHeight + (startY - moveEvent.clientY)));
      setSize({ width: nextWidth, height: nextHeight });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function submitInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    await sendToAgent(text, text);
  }

  async function confirmChange(confirmed: boolean) {
    if (!pendingConfirmation) return;
    setPendingConfirmation(null);
    await sendToAgent(
      confirmed ? "Confirm" : "Cancel confirmation",
      confirmed ? "Yes, confirm this change." : "No, do not make this change.",
      pendingConfirmation.token,
      confirmed,
      false,
    );
  }

  async function selectSlot(
    option: BookingOptionPreview,
    flow?: BookingChatMessage["flow"],
  ) {
    const message = buildSlotSelectionMessage(option, flow);
    const visibleText = `I choose ${slotLabel(option)}${option.doctor_name ? ` with ${option.doctor_name}` : ""}.`;
    await sendToAgent(message, visibleText, undefined, undefined, true, option.id);
  }

  async function runAppointmentAction(action: AppointmentAction) {
    await sendToAgent(
      action.request.message,
      action.visibleText,
      undefined,
      undefined,
      true,
      undefined,
      action.request,
    );
  }

  async function sendToAgent(
    message: string,
    visibleText = message,
    confirmationToken?: string,
    confirmed?: boolean,
    allowMultiOptionConfirmation = false,
    selectedBookingOptionId?: string,
    actionRequest?: BookingChatActionRequest,
  ) {
    if (!patientId || !activeConversation || isSending) return;
    const conversationId = activeConversation.id;
    setIsSending(true);
    setError(null);
    appendMessage(conversationId, {
      id: createId("message"),
      role: "user",
      text: visibleText,
      safeState: {},
    });
    try {
      const response = await sendBookingChatMessage({
        session_id: conversationId,
        message,
        action: actionRequest?.action,
        appointment_ref: actionRequest?.appointment_ref,
        selected_booking_option_id: selectedBookingOptionId,
        confirmation_token: confirmationToken,
        confirmed,
      });
      const hasMultipleBookingOptions = (response.flow === "booking" || response.flow === "reschedule")
        && Array.isArray(response.safe_state?.booking_options)
        && response.safe_state.booking_options.length > 1;
      setPendingConfirmation(hasMultipleBookingOptions && !allowMultiOptionConfirmation ? null : response.confirmation);
      appendMessage(conversationId, {
        id: createId("message"),
        role: "assistant",
        text: response.reply,
        flow: response.flow,
        confirmation: response.confirmation,
        safeState: response.safe_state,
      });
    } catch {
      setError("SMILE scheduling is temporarily unavailable. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  const currentMessages = activeConversation?.messages ?? [];

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-smile-primary text-white shadow-xl transition hover:bg-smile-primary-dark"
          aria-label="Open SMILE scheduling assistant"
        >
          <Icon icon="lucide:message-circle" className="h-6 w-6" />
        </button>
      ) : (
        <section
          className="fixed bottom-5 right-5 z-50 flex min-h-[520px] min-w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{ width: size.width, height: size.height, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)" }}
        >
          <button
            type="button"
            onPointerDown={beginResize}
            className="absolute left-1 top-1 z-10 flex h-4 w-4 cursor-nwse-resize items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 hover:text-smile-primary"
            aria-label="Resize chat"
            title="Drag to resize"
          >
            <Icon icon="lucide:grip" className="h-2.5 w-2.5 rotate-45" />
          </button>
          {historyOpen ? (
          <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-3 md:block">
            <button
              type="button"
              onClick={addConversation}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-smile-primary px-3 py-2 text-sm font-semibold text-white"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" />
              New chat
            </button>
            <div className="space-y-2 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id);
                    setPendingConfirmation(null);
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-xs ${conversation.id === activeId ? "bg-white text-smile-primary shadow-sm" : "text-slate-600 hover:bg-white"}`}
                >
                  <span className="block truncate font-semibold">{conversation.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {new Date(conversation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">SMILE scheduling assistant</p>
                <p className="text-xs text-slate-500">
                  {patientId ? "Using your signed-in account" : "Sign in to send appointment requests"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-smile-primary hover:text-smile-primary"
                >
                  <Icon icon={historyOpen ? "lucide:panel-left-close" : "lucide:panel-left-open"} className="h-4 w-4" />
                  {historyOpen ? "Hide history" : "Show history"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close chat"
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
              {currentMessages.map((message) => (
                <article key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-smile-primary text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                    <MessageText text={message.text} />
                    {message.role === "assistant" ? (
                      <AssistantDataCard
                        message={message}
                        onSelectSlot={(slot, flow) => void selectSlot(slot, flow)}
                        onAppointmentAction={(action) => void runAppointmentAction(action)}
                        isSending={isSending}
                      />
                    ) : null}
                  </div>
                </article>
              ))}
              {isSending ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                  Checking SMILE schedule...
                </div>
              ) : null}
            </div>

            {pendingConfirmation ? (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-950">{pendingConfirmation.summary}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => void confirmChange(true)} className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white">
                    Confirm
                  </button>
                  <button type="button" onClick={() => void confirmChange(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

            <form onSubmit={submitInput} className="flex gap-2 border-t border-slate-200 p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!patientId || isSending}
                placeholder={patientId ? "Type a scheduling request..." : "Sign in to use the assistant"}
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-smile-primary"
              />
              <button type="submit" disabled={!canSend} className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </section>
      )}

    </>
  );
}
