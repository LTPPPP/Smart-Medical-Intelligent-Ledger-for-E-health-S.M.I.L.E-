// ============================================================
// useCountdown hook — second-by-second countdown (OTP resend, etc.)
// ============================================================

"use client";

import { useEffect, useState } from "react";

/**
 * Simple countdown timer in seconds.
 * Call `start(seconds)` to begin; `isActive` is true while `remaining > 0`.
 *
 * @example
 * const { remaining, isActive, start } = useCountdown();
 * start(60); // begins a 60s cooldown
 */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return {
    remaining,
    isActive: remaining > 0,
    start: (seconds: number) => setRemaining(seconds),
  };
}
