"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { useCountdown } from "@/shared/hooks/useCountdown";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [slotIds] = useState(() => Array.from({ length }, () => Math.random().toString(36).slice(2)));
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value === "") inputRefs.current[0]?.focus();
  }, [value]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every(Boolean)) {
      onComplete?.(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = digits.slice();
      next[index - 1] = "";
      onChange(next.join(""));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={slotIds[index]}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 w-10 rounded-xl border text-center font-poppins text-lg font-semibold text-smile-title outline-none transition-colors duration-150 focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-12"
          style={{ background: "var(--surface-input-bg)", borderColor: "var(--surface-input-border)" }}
        />
      ))}
    </div>
  );
}

interface OtpResendButtonProps {
  onResend: () => void | Promise<void>;
  isSending?: boolean;
  cooldownSeconds?: number;
}

export function OtpResendButton({
  onResend,
  isSending = false,
  cooldownSeconds = 60,
}: OtpResendButtonProps) {
  const { remaining, isActive, start } = useCountdown();
  const [hasSentOnce, setHasSentOnce] = useState(false);

  const handleClick = async () => {
    if (isActive || isSending) return;
    await onResend();
    setHasSentOnce(true);
    start(cooldownSeconds);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isActive || isSending}
      className="min-h-11 shrink-0 rounded-xl border px-4 font-inter text-sm font-semibold text-smile-primary transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ borderColor: "var(--surface-panel-border)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isSending ? (
          <motion.span
            key="sending"
            className="inline-flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Icon icon="line-md:loading-twotone-loop" width={14} />
            Sending...
          </motion.span>
        ) : isActive ? (
          <motion.span
            key="cooldown"
            className="text-smile-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            Resend in {remaining}s
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {hasSentOnce ? "Resend OTP" : "Send OTP"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
