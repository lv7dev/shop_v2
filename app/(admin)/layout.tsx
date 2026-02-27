import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, FolderTree, Tags, Percent, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ADMIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { label: "Facets", href: "/dashboard/facets", icon: Tags },
  { label: "Discounts", href: "/dashboard/discounts", icon: Percent },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/40 md:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold">
            {APP_NAME} Admin
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {ADMIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to store
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
