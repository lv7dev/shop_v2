"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithCart } from "@/actions/auth";
import { useCartStore } from "@/store/cart-store";
import { CartMergeModal } from "@/components/cart/cart-merge-modal";
import type { CartDbItemInput } from "@/types/cart";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const items = useCartStore((s) => s.items);
  const replaceCart = useCartStore((s) => s.replaceCart);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeContext, setMergeContext] = useState<{
    localCartItems: CartDbItemInput[];
    dbCartItemCount: number;
    redirectUrl: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const localCartItems: CartDbItemInput[] = items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    const result = await loginWithCart(formData, localCartItems);

    // Auth error (invalid credentials, etc.)
    if ("error" in result && !("success" in result)) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Cart conflict — need user to choose merge strategy
    if ("success" in result && result.error === "MERGE_NEEDED") {
      setMergeContext({
        localCartItems,
        dbCartItemCount: result.dbCartItemCount ?? 0,
        redirectUrl: result.redirectUrl,
      });
      setShowMergeModal(true);
      setLoading(false);
      return;
    }

    // No conflict — cart was handled server-side
    if ("items" in result && result.items.length > 0) {
      replaceCart(result.items);
    }
    router.push(result.redirectUrl);
  }

  async function callMergeAPI(
    localCartItems: CartDbItemInput[],
    strategy: "merge" | "keep_db",
  ) {
    const res = await fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localCartItems, strategy }),
    });
    return res.json() as Promise<{
      success: boolean;
      items: { id: string; name: string; price: number; image: string; quantity: number; stock: number }[];
    }>;
  }

  async function handleMerge() {
    if (!mergeContext) return;

    try {
      const result = await callMergeAPI(
        mergeContext.localCartItems,
        "merge",
      );

      if (!result.success) {
        setError("Failed to merge carts. Please try again.");
        setShowMergeModal(false);
        return;
      }

      replaceCart(result.items);
      setShowMergeModal(false);
      router.push(mergeContext.redirectUrl);
    } catch (err) {
      console.error("[LoginForm] Cart merge error:", err);
      setError("An error occurred while merging carts.");
      setShowMergeModal(false);
    }
  }

  async function handleKeepDb() {
    if (!mergeContext) return;

    try {
      const result = await callMergeAPI([], "keep_db");

      if (!result.success) {
        setError("Failed to load saved cart. Please try again.");
        setShowMergeModal(false);
        return;
      }

      replaceCart(result.items);
      setShowMergeModal(false);
      router.push(mergeContext.redirectUrl);
    } catch (err) {
      console.error("Cart load error:", err);
      setError("An error occurred while loading your cart.");
      setShowMergeModal(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-linear-to-r from-purple-400 to-pink-400">
            <Image
              src="/icons/fingerprint-icon.svg"
              alt="Logo"
              width={24}
              height={24}
            />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form action={handleSubmit} className="mt-8 space-y-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          {/* Email */}
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
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
              />
            </div>
          </div>

          {/* Password */}
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
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                required
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-12 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
              >
                <Image
                  src="/icons/eye-icon.svg"
                  alt="Toggle password visibility"
                  width={18}
                  height={16}
                />
              </button>
            </div>
          </div>

          {/* Remember me / Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                className="size-4 rounded border-black bg-white accent-purple-500"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-purple-300 hover:text-purple-200"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mt-8 flex items-center">
          <div className="flex-1 border-t border-white/20" />
          <span className="px-4 text-sm text-white/60">Or continue with</span>
          <div className="flex-1 border-t border-white/20" />
        </div>

        {/* Social Buttons */}
        <div className="mt-6 flex gap-4">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20">
            <Image src="/icons/google-icon.svg" alt="" width={16} height={16} />
            Google
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20">
            <Image src="/icons/apple-icon.svg" alt="" width={12} height={16} />
            Apple
          </button>
        </div>

        {/* Sign up link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">{`Don't have an account?`}</p>
          <Link
            href="/register"
            className="mt-1 inline-block text-base font-medium text-purple-300 hover:text-purple-200"
          >
            Sign up
          </Link>
        </div>
      </div>

      <CartMergeModal
        open={showMergeModal}
        localItemCount={mergeContext?.localCartItems.length || 0}
        dbItemCount={mergeContext?.dbCartItemCount || 0}
        onMerge={handleMerge}
        onKeepDb={handleKeepDb}
      />
    </>
  );
}
