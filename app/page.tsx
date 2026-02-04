import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgb(88, 28, 135) 0%, rgb(30, 58, 138) 35%, rgb(49, 46, 129) 71%)",
      }}
    >
      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(36deg, rgba(236, 72, 153, 0.2) 50%, rgba(168, 85, 247, 0.1) 85%, rgba(6, 182, 212, 0.2) 121%)",
        }}
      />

      {/* Decorative blurred circles */}
      <div className="absolute left-10 top-10 size-32 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-70 blur-sm" />
      <div className="absolute right-10 top-40 size-24 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-60 blur-sm" />
      <div className="absolute bottom-20 left-28 size-40 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-50 blur-sm" />
      <div className="absolute bottom-24 right-20 size-28 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-60 blur-sm" />

      {/* Small floating dots */}
      <div className="absolute left-[25%] top-0 size-4 rounded-full bg-white/30 opacity-17" />
      <div className="absolute right-[25%] top-0 size-2 rounded-full bg-white/40 opacity-15" />
      <div className="absolute right-[27%] top-[21%] size-3 rounded-full bg-white/25 opacity-14" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[448px] rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-purple-400 to-pink-400">
            <Image src="/fingerprint-icon.svg" alt="Logo" width={24} height={24} />
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
                <Image src="/mail-icon.svg" alt="" width={16} height={16} />
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
                <Image src="/lock-icon.svg" alt="" width={14} height={16} />
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
                <Image src="/eye-icon.svg" alt="Toggle password visibility" width={18} height={16} />
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
            <a href="#" className="text-sm font-medium text-purple-300 hover:text-purple-200">
              Forgot password?
            </a>
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
            <Image src="/google-icon.svg" alt="" width={16} height={16} />
            Google
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20">
            <Image src="/apple-icon.svg" alt="" width={12} height={16} />
            Apple
          </button>
        </div>

        {/* Sign up link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">{`Don't have an account?`}</p>
          <a href="#" className="mt-1 inline-block text-base font-medium text-purple-300 hover:text-purple-200">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
