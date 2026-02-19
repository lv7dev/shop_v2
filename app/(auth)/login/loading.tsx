export default function LoginLoading() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="size-16 animate-pulse rounded-2xl bg-white/20" />
        <div className="mt-4 h-8 w-44 animate-pulse rounded-lg bg-white/15" />
        <div className="mt-2 h-4 w-60 animate-pulse rounded-lg bg-white/10" />
      </div>

      {/* Form fields */}
      <div className="mt-8 space-y-5">
        <div>
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white/10" />
        </div>
        <div>
          <div className="mb-2 h-4 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white/10" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-14 w-full animate-pulse rounded-2xl bg-white/15" />
      </div>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/20" />
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* Social buttons */}
      <div className="mt-6 flex gap-4">
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-white/10" />
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-white/10" />
      </div>

      {/* Sign up link */}
      <div className="mt-8 flex flex-col items-center gap-1">
        <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
        <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}
