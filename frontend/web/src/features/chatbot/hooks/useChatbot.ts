'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { sendMessage } from '../api/chatbot.api';
import type {
  ChatHistoryEntry,
  ChatMessage,
  SendMessageResponse,
} from '../types/chat.type';

function makeId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSessionId(): string {
  return `web-${makeId()}`;
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState<string>(() => makeSessionId());

  const mutation = useMutation<SendMessageResponse, Error, string>({
    mutationFn: (message: string) => {
      const history: ChatHistoryEntry[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return sendMessage({ message, sessionId, history });
    },
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content:
            res.reply ||
            'Sorry, I could not generate a reply. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content:
            "I couldn't reach the booking assistant right now. Please make sure the service is running and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  const send = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message || mutation.isPending) return;

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
      mutation.mutate(message);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setMessages([]);
    mutation.reset();
  }, [mutation]);

  return useMemo(
    () => ({
      messages,
      sessionId,
      send,
      reset,
      isSending: mutation.isPending,
      isError: mutation.isError,
    }),
    [messages, sessionId, send, reset, mutation.isPending, mutation.isError],
  );
}
