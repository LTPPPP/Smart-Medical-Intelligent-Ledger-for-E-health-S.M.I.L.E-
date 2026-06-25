// ============================================================
// useAutoDismiss hook — state that clears itself after a delay
// (success/error banners, toasts, etc.)
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drop-in replacement for `useState<T | null>(null)` whose setter auto-clears
 * the value after `ms` milliseconds. Setting `null` explicitly cancels the
 * pending dismiss immediately.
 *
 * @example
 * const [msg, setMsg] = useAutoDismiss<{ type: "success" | "error"; text: string }>(4000);
 * setMsg({ type: "success", text: "Saved!" }); // auto-clears after 4s
 */
export function useAutoDismiss<T>(ms = 4000) {
  const [value, setValue] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setValueWithDismiss = useCallback(
    (next: T | null) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setValue(next);
      if (next !== null) {
        timerRef.current = setTimeout(() => setValue(null), ms);
      }
    },
    [ms],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return [value, setValueWithDismiss] as const;
}
