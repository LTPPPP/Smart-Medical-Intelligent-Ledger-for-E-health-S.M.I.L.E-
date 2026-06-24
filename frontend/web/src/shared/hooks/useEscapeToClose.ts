// ============================================================
// useEscapeToClose hook — closes a dialog/modal on Escape keydown
// ============================================================

"use client";

import { useEffect } from "react";

/**
 * Calls `onClose` whenever the user presses Escape while mounted.
 * Used by dialog components to keep keyboard-close behavior consistent.
 */
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
