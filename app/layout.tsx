// Minimal root layout — [locale]/layout.tsx handles html/body/fonts/providers
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
