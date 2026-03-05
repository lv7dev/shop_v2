"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Search,
  Home,
  Package,
  Grid3X3,
  UserCircle,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
} from "lucide-react";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useNotificationStore } from "@/store/notification-store";
import { APP_NAME } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
];

type MobileMenuProps = {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  totalItems: number;
  hydrated: boolean;
  wishlistCount: number;
  wishlistHydrated: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export function MobileMenu({
  user,
  totalItems,
  hydrated,
  wishlistCount,
  wishlistHydrated,
  onClose,
  onLogout,
}: MobileMenuProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const notifHydrated = useNotificationStore((s) => s._hydrated);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  }

  return (
    <SheetContent side="right" className="w-80 p-0">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle className="text-left text-lg">{APP_NAME}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Search */}
        <form onSubmit={handleSearch} className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        {/* User info card */}
        {user && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigate
          </p>
          {NAV_ITEMS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <link.icon className="size-4 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ShoppingCart className="size-4 text-muted-foreground" />
            Cart
            {hydrated && totalItems > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Heart className="size-4 text-muted-foreground" />
            Wishlist
            {wishlistHydrated && wishlistCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          {user && (
            <Link
              href="#"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Bell className="size-4 text-muted-foreground" />
              Notifications
              {notifHydrated && unreadCount > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <Separator className="mx-4" />

        {/* Account section */}
        <div className="flex flex-col gap-1 p-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          {user ? (
            <>
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <UserCircle className="size-4 text-muted-foreground" />
                My Account
              </Link>
              <Link
                href="/orders"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ClipboardList className="size-4 text-muted-foreground" />
                My Orders
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Admin Dashboard
                </Link>
              )}

              <Separator className="my-2" />

              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <LogIn className="size-4 text-muted-foreground" />
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <UserPlus className="size-4 text-muted-foreground" />
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </SheetContent>
  );
}
