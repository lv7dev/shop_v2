"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type OtpInputProps = {
  onSubmit: (otp: string) => void;
  onResend: () => void;
  loading: boolean;
  error?: string;
  email: string;
  resendCooldown: number;
};

export function OtpInput({
  onSubmit,
  onResend,
  loading,
  error,
  email,
  resendCooldown,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const otp = digits.join("");
    if (otp.length === 6) {
      onSubmit(otp);
    }
  }, [digits, onSubmit]);

  function handleChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace when current is empty
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }

    if (e.key === "Enter") {
      handleSubmit();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);

    // Focus the next empty input, or the last one
    const nextEmpty = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  }

  const isComplete = digits.every((d) => d !== "");

  return (
    <div className="space-y-6">
      {/* OTP Inputs */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="size-12 rounded-2xl border border-white/20 bg-white/10 text-center text-xl font-bold text-white outline-none transition focus:border-purple-400 focus:bg-white/15 disabled:opacity-50 sm:size-14"
          />
        ))}
      </div>

      {/* Email info */}
      <p className="text-center text-sm text-white/60">
        Code sent to{" "}
        <span className="font-medium text-white/80">{email}</span>
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Verify button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !isComplete}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
      >
        {loading && (
          <svg
            className="size-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      {/* Resend */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-white/50">
            Resend code in{" "}
            <span className="font-medium text-white/70">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="text-sm font-medium text-purple-300 transition hover:text-purple-200 disabled:opacity-50"
          >
            Resend Code
          </button>
        )}
      </div>
    </div>
  );
}
