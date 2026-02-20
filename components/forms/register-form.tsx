"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendRegistrationOtp, verifyRegistrationOtp } from "@/actions/otp";
import { useCartStore } from "@/store/cart-store";
import { OtpInput } from "@/components/forms/otp-input";

export function RegisterForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await sendRegistrationOtp(email, name, password);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setFormValues({ name, email, password });
    setResendCooldown(60);
    setStep("otp");
    setLoading(false);
  }

  const handleOtpSubmit = useCallback(
    async (otp: string) => {
      setError("");
      setLoading(true);

      const localCartItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        variantId: item.variantId ?? null,
      }));

      const result = await verifyRegistrationOtp(
        formValues.email,
        otp,
        formValues.name,
        formValues.password,
        localCartItems,
      );

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push(result.redirectUrl);
    },
    [formValues, items, router],
  );

  const handleResend = useCallback(async () => {
    setError("");
    setLoading(true);

    const result = await sendRegistrationOtp(
      formValues.email,
      formValues.name,
      formValues.password,
    );

    if ("error" in result) {
      setError(result.error);
    } else {
      setResendCooldown(60);
    }

    setLoading(false);
  }, [formValues]);

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-purple-400 to-pink-400">
          <Image
            src="/icons/fingerprint-icon.svg"
            alt="Logo"
            width={24}
            height={24}
          />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          {step === "form" ? "Create Account" : "Verify Email"}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {step === "form"
            ? "Sign up to get started"
            : "Enter the 6-digit code we sent to your email"}
        </p>
      </div>

      {/* Step: Form */}
      {step === "form" && (
        <>
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="mt-8 space-y-5">
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  required
                  defaultValue={formValues.name}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                />
              </div>

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
                    defaultValue={formValues.email}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Password
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
                    type="password"
                    name="password"
                    placeholder="Create a password (min 6 chars)"
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
                {loading ? "Sending code..." : "Create Account"}
              </button>
            </fieldset>
          </form>

          {/* Divider */}
          <div className="relative mt-8 flex items-center">
            <div className="flex-1 border-t border-white/20" />
            <span className="px-4 text-sm text-white/60">Or continue with</span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Social Buttons */}
          <div className="mt-6 flex gap-4">
            <a
              href="/api/auth/google"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <Image src="/icons/google-icon.svg" alt="" width={16} height={16} />
              Google
            </a>
            <a
              href="/api/auth/facebook"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <Image src="/icons/facebook-icon.svg" alt="" width={16} height={16} />
              Facebook
            </a>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-white/60">Already have an account?</p>
            <Link
              href="/login"
              className="mt-1 inline-block text-base font-medium text-purple-300 hover:text-purple-200"
            >
              Sign in
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

      {/* Step: OTP Verification */}
      {step === "otp" && (
        <div className="mt-8">
          <OtpInput
            onSubmit={handleOtpSubmit}
            onResend={handleResend}
            loading={loading}
            error={error}
            email={formValues.email}
            resendCooldown={resendCooldown}
          />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="text-sm text-white/60 transition hover:text-white/80"
            >
              &larr; Back to form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
