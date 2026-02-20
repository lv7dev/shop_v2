"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from "@/actions/otp";
import { OtpInput } from "@/components/forms/otp-input";

type Step = "email" | "otp" | "newPassword" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    const result = await sendPasswordResetOtp(emailValue);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setEmail(emailValue.trim().toLowerCase());
    setResendCooldown(60);
    setStep("otp");
    setLoading(false);
  }

  // Step 2: Verify OTP
  const handleOtpSubmit = useCallback(
    async (otp: string) => {
      setError("");
      setLoading(true);

      const result = await verifyPasswordResetOtp(email, otp);

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setResetToken(result.resetToken);
      setStep("newPassword");
      setLoading(false);
    },
    [email],
  );

  // Resend OTP
  const handleResend = useCallback(async () => {
    setError("");
    setLoading(true);

    const result = await sendPasswordResetOtp(email);

    if ("error" in result) {
      setError(result.error);
    } else {
      setResendCooldown(60);
    }

    setLoading(false);
  }, [email]);

  // Step 3: Set new password
  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await resetPassword(resetToken, newPassword);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStep("success");
    setLoading(false);

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  // Dynamic header
  const headers: Record<Step, { title: string; subtitle: string }> = {
    email: {
      title: "Reset Password",
      subtitle: "Enter your email to receive a verification code",
    },
    otp: {
      title: "Enter Code",
      subtitle: "We sent a 6-digit code to your email",
    },
    newPassword: {
      title: "New Password",
      subtitle: "Create a strong password for your account",
    },
    success: {
      title: "Password Updated",
      subtitle: "Redirecting you to sign in...",
    },
  };

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-purple-400 to-pink-400">
          <Image
            src="/icons/lock-icon.svg"
            alt="Logo"
            width={24}
            height={24}
          />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          {headers[step].title}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {headers[step].subtitle}
        </p>
      </div>

      {/* Step: Email */}
      {step === "email" && (
        <>
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-5">
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Image
                      src="/icons/mail-icon.svg"
                      alt=""
                      width={16}
                      height={16}
                    />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    defaultValue={email}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
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
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </fieldset>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-purple-300 hover:text-purple-200"
            >
              &larr; Back to sign in
            </Link>
          </div>

          {/* Back to store */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-white/60 transition hover:text-white/80"
            >
              &larr; Back to Store
            </Link>
          </div>
        </>
      )}

      {/* Step: OTP */}
      {step === "otp" && (
        <div className="mt-8">
          <OtpInput
            onSubmit={handleOtpSubmit}
            onResend={handleResend}
            loading={loading}
            error={error}
            email={email}
            resendCooldown={resendCooldown}
          />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
              }}
              className="text-sm text-white/60 transition hover:text-white/80"
            >
              &larr; Change email
            </button>
          </div>
        </div>
      )}

      {/* Step: New Password */}
      {step === "newPassword" && (
        <>
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5">
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Image
                      src="/icons/lock-icon.svg"
                      alt=""
                      width={14}
                      height={16}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a new password (min 6 chars)"
                    required
                    minLength={6}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-12 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
                  >
                    <Image
                      src={showPassword ? "/icons/eye-off-icon.svg" : "/icons/eye-icon.svg"}
                      alt="Toggle password visibility"
                      width={18}
                      height={16}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Image
                      src="/icons/lock-icon.svg"
                      alt=""
                      width={14}
                      height={16}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
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
                {loading ? "Updating..." : "Update Password"}
              </button>
            </fieldset>
          </form>
        </>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="mt-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/20">
            <svg
              className="size-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-white">
            Password updated successfully!
          </p>
          <p className="mt-2 text-sm text-white/60">
            Redirecting to sign in...
          </p>
        </div>
      )}
    </div>
  );
}
