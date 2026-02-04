export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgb(88, 28, 135) 0%, rgb(30, 58, 138) 35%, rgb(49, 46, 129) 71%)",
      }}
    >
      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(36deg, rgba(236, 72, 153, 0.2) 50%, rgba(168, 85, 247, 0.1) 85%, rgba(6, 182, 212, 0.2) 121%)",
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

      <div className="relative z-10 w-full max-w-[448px] px-4">
        {children}
      </div>
    </div>
  );
}
