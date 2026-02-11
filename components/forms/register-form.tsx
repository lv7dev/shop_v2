"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/actions/auth";
import { useCartStore } from "@/store/cart-store";

export function RegisterForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const localCartItems = items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    const result = await register(formData, localCartItems);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(result.redirectUrl);
  }

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-purple-400 to-pink-400">
          <Image src="/icons/fingerprint-icon.svg" alt="Logo" width={24} height={24} />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Sign up to get started
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 px-4 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <Image src="/icons/mail-icon.svg" alt="" width={16} height={16} />
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

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <Image src="/icons/lock-icon.svg" alt="" width={14} height={16} />
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
          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-white/60">Already have an account?</p>
        <Link href="/login" className="mt-1 inline-block text-base font-medium text-purple-300 hover:text-purple-200">
          Sign in
        </Link>
      </div>
    </div>
  );
}
