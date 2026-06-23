"use client";

import { Icon } from "@iconify/react";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-smile-primary text-white">
            <Icon icon="lucide:message-circle" className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">SMILE scheduling assistant</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The assistant now runs as a floating chat bubble across the app. Use the button in the bottom-right corner
            to open it, resize the chat window, start a new conversation, or use the guided booking flow.
          </p>
        </div>
      </section>
    </main>
  );
}
