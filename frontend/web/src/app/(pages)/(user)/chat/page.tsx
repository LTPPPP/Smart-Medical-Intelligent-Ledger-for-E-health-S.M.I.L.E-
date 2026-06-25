"use client";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { ChatWindow } from "@/features/chatbot/components/ChatWindow";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden bg-background">
        {/* Liquid blobs */}
        <div className="liquid-blob pointer-events-none absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
        <div className="liquid-blob-slow pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
        <div className="liquid-blob-fast pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />

        {/* Header */}
        <LandingHeader />

        <main className="relative mx-auto max-w-4xl px-4 py-8">
          {/* Page heading */}
          <div className="mb-5">
            <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
              Support
            </p>
            <h1 className="font-poppins text-3xl font-semibold text-smile-primary md:text-4xl">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                Booking Assistant
              </span>
            </h1>
            <p className="mt-1.5 font-inter text-sm text-smile-title">
              Chat to book, reschedule or cancel appointments at{" "}
              <span className="font-semibold text-smile-primary">S.M.I.L.E</span>.
            </p>
          </div>

          <ChatWindow />
        </main>
      </div>
    </ProtectedRoute>
  );
}
