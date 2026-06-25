'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import { Icon } from '@iconify/react';

import { useChatbot } from '../hooks/useChatbot';
import type { ChatMessage } from '../types/chat.type';

const EXAMPLE_PROMPTS = [
  'Book me a dental checkup tomorrow at 9am',
  'What are your opening hours?',
  'Show available slots this week',
  'I need to reschedule my appointment',
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[80%] items-end gap-2 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isUser
              ? 'bg-smile-primary text-white'
              : 'bg-smile-primary-light text-smile-primary'
          }`}
        >
          <Icon
            icon={isUser ? 'lucide:user' : 'lucide:bot'}
            width={16}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div
            className={
              isUser
                ? 'rounded-2xl rounded-br-sm bg-smile-primary px-4 py-2.5 font-inter text-sm leading-relaxed text-white shadow-[0_4px_14px_rgba(65,126,170,0.28)]'
                : 'rounded-2xl rounded-bl-sm border px-4 py-2.5 font-inter text-sm leading-relaxed text-smile-title'
            }
            style={
              isUser
                ? undefined
                : {
                    background: 'var(--surface-card-bg)',
                    borderColor: 'var(--surface-card-border)',
                  }
            }
          >
            <span className="whitespace-pre-wrap">{message.content}</span>
          </div>
          <span
            className={`px-1 font-inter text-[10px] text-smile-description ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-end gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-smile-primary-light text-smile-primary">
          <Icon icon="lucide:bot" width={16} />
        </div>
        <div
          className="flex items-center gap-1 rounded-2xl rounded-bl-sm border px-4 py-3"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: 'var(--surface-card-border)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-smile-primary/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(94,255,136,0.25) 0%, rgba(65,126,170,0.22) 100%)',
        }}
      >
        <Icon icon="lucide:bot-message-square" width={30} className="text-smile-primary" />
      </div>
      <h2 className="font-poppins text-lg font-semibold text-smile-primary-dark">
        Booking Assistant
      </h2>
      <p className="mt-1.5 max-w-sm font-inter text-sm text-smile-description">
        Ask me to book, reschedule or cancel a dental appointment, check
        availability, or get clinic info. Try one of these:
      </p>
      <div className="mt-5 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="group flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left font-inter text-xs text-smile-title transition-all hover:border-smile-primary/40 hover:shadow-[0_4px_14px_rgba(65,126,170,0.12)]"
            style={{
              background: 'var(--surface-panel-bg)',
              borderColor: 'var(--surface-panel-border)',
            }}
          >
            <Icon
              icon="lucide:sparkles"
              width={13}
              className="shrink-0 text-smile-primary"
            />
            <span className="flex-1">{p}</span>
            <Icon
              icon="lucide:arrow-right"
              width={12}
              className="shrink-0 text-smile-description transition-transform group-hover:translate-x-0.5 group-hover:text-smile-primary"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatWindow() {
  const { messages, send, isSending, isError } = useChatbot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  const submit = (text: string) => {
    if (!text.trim() || isSending) return;
    send(text);
    setInput('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      className="flex h-[calc(100vh-9rem)] min-h-[480px] w-full flex-col overflow-hidden rounded-[24px] border backdrop-blur-xl"
      style={{
        background: 'var(--surface-card-bg)',
        borderColor: 'var(--surface-card-border)',
        boxShadow: 'var(--surface-card-shadow)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-5 py-3.5"
        style={{ borderColor: 'var(--surface-panel-border)' }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-smile-primary-light">
          <Icon icon="lucide:bot" width={18} className="text-smile-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-poppins text-sm font-semibold text-smile-primary-dark">
            Booking Assistant
          </p>
          <p className="flex items-center gap-1.5 font-inter text-[11px] text-smile-description">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eff88] shadow-[0_0_6px_#5eff88]" />
            S.M.I.L.E Dental Clinic
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {hasMessages ? (
          <>
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            {isSending && <TypingDots />}
          </>
        ) : (
          <EmptyState onPick={(text) => submit(text)} />
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 font-inter text-xs text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
          <Icon icon="lucide:alert-triangle" width={13} />
          Connection issue — please try again.
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t px-4 py-3"
        style={{ borderColor: 'var(--surface-panel-border)' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type your message…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border px-4 py-2.5 font-inter text-sm text-smile-title outline-none transition-colors placeholder:text-smile-description focus:border-smile-primary/50"
          style={{
            background: 'var(--surface-panel-bg)',
            borderColor: 'var(--surface-panel-border)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-smile-primary text-white transition-all hover:shadow-[0_4px_14px_rgba(65,126,170,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Icon
            icon={isSending ? 'lucide:loader-2' : 'lucide:send'}
            width={18}
            className={isSending ? 'animate-spin' : ''}
          />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
