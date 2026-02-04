import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-purple-400 to-pink-400">
          <Image src="/icons/fingerprint-icon.svg" alt="Logo" width={24} height={24} />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form className="mt-8 space-y-5">
        {/* Email */}
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
              placeholder="Enter your email"
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
              <Image src="/icons/lock-icon.svg" alt="" width={14} height={16} />
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-12 text-base text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
            >
              <Image src="/icons/eye-icon.svg" alt="Toggle password visibility" width={18} height={16} />
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
          <Link href="/forgot-password" className="text-sm font-medium text-purple-300 hover:text-purple-200">
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600"
        >
          Sign In
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
        <Link href="/register" className="mt-1 inline-block text-base font-medium text-purple-300 hover:text-purple-200">
          Sign up
        </Link>
      </div>
    </div>
  );
}
