"use client";

import { FormEvent, useMemo, useState } from "react";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { sendBookingChatMessage } from "@/features/booking-chat/api";
import type { BookingChatConfirmation, BookingChatMessage } from "@/features/booking-chat/types";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

function createSessionId(userId: string | undefined) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `web:${userId || "anonymous"}:${Date.now()}:${suffix}`;
}

export default function BookingChatPage() {
  const { user } = useAuthStore();
  const [sessionId] = useState(() => createSessionId(user?.userId));
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<BookingChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Bạn có thể hỏi tôi về lịch hẹn, đặt lịch khám răng, hủy lịch hoặc đổi lịch. Mọi thay đổi đều cần bạn xác nhận trước khi thực hiện.",
    },
  ]);
  const [pendingConfirmation, setPendingConfirmation] = useState<BookingChatConfirmation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patientId = user?.userId;
  const canSend = useMemo(() => Boolean(patientId && message.trim() && !isSending), [patientId, message, isSending]);

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend || !patientId) return;
    const trimmed = message.trim();
    setMessage("");
    setError(null);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    await sendToAgent({ message: trimmed });
  }

  async function confirmChange(confirmed: boolean) {
    if (!pendingConfirmation || !patientId) return;
    setError(null);
    setPendingConfirmation(null);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: confirmed ? "Tôi xác nhận thao tác này." : "Không, hủy thao tác này.",
      },
    ]);
    await sendToAgent(
      {
        message: confirmed ? "Confirm" : "Cancel confirmation",
        confirmation_token: pendingConfirmation.token,
        confirmed,
      },
    );
  }

  async function sendToAgent(
    payload: { message: string; confirmation_token?: string; confirmed?: boolean },
  ) {
    setIsSending(true);
    try {
      const response = await sendBookingChatMessage(
        {
          session_id: sessionId,
          message: payload.message,
          confirmation_token: payload.confirmation_token,
          confirmed: payload.confirmed,
        },
      );
      setPendingConfirmation(response.confirmation);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.reply,
          flow: response.flow,
          confirmation: response.confirmation,
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể kết nối trợ lý đặt lịch.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-950">Trợ lý đặt lịch nha khoa</h1>
              <p className="mt-1 text-sm text-slate-600">Tra cứu, đặt, hủy hoặc đổi lịch với bước xác nhận an toàn.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-smile-primary text-white">
              <Icon icon="lucide:message-circle" className="h-5 w-5" />
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((item) => (
              <article
                key={item.id}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    item.role === "user"
                      ? "bg-smile-primary text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p>{item.text}</p>
                  {item.flow && item.role === "assistant" ? (
                    <p className="mt-2 text-xs uppercase tracking-wide opacity-70">Flow: {item.flow}</p>
                  ) : null}
                </div>
              </article>
            ))}
            {isSending ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </div>
            ) : null}
          </div>

          {pendingConfirmation ? (
            <div className="border-t border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-950">{pendingConfirmation.summary}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void confirmChange(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-smile-primary px-4 py-2 text-sm font-semibold text-white hover:bg-smile-primary-dark disabled:opacity-60"
                  disabled={isSending}
                >
                  <Icon icon="lucide:check" className="h-4 w-4" />
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => void confirmChange(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={isSending}
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                  Hủy
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <form onSubmit={submitChat} className="flex gap-3 border-t border-slate-200 p-4">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ví dụ: Tôi muốn đặt lịch khám răng ngày 2027-02-03"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
              disabled={!patientId || isSending}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex items-center gap-2 rounded-lg bg-smile-primary px-5 py-3 text-sm font-semibold text-white hover:bg-smile-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="lucide:send" className="h-4 w-4" />
              Gửi
            </button>
          </form>
        </section>
      </main>
    </ProtectedRoute>
  );
}
