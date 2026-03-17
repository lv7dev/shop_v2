"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ShoppingCart,
  Heart,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchBar } from "@/components/layout/search-bar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { APP_NAME } from "@/lib/constants";
import { logout } from "@/actions/auth";

const MobileMenu = dynamic(
  () => import("./mobile-menu").then((mod) => mod.MobileMenu),
  { ssr: false }
);

type NavbarProps = {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations();
  const hydrated = useCartStore((s) => s._hydrated);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const clearCart = useCartStore((s) => s.clearCart);
  const wishlistHydrated = useWishlistStore((s) => s._hydrated);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const pathname = usePathname();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    clearCart(false);
    clearWishlist(false);
    logout();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          {APP_NAME}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            { label: t("common.home"), href: "/" as const },
            { label: t("common.products"), href: "/products" as const },
            { label: t("common.categories"), href: "/categories" as const },
          ].map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <SearchBar />
          <LanguageSwitcher />
          {user && <NotificationBell />}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist" className="relative">
              <Heart className="size-5" />
              <span
                className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white transition-transform ${
                  wishlistHydrated && wishlistCount > 0 ? "scale-100" : "scale-0"
                }`}
              >
                {wishlistCount}
              </span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingCart className="size-5" />
              <span
                className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground transition-transform ${
                  hydrated && totalItems > 0 ? "scale-100" : "scale-0"
                }`}
              >
                {totalItems}
              </span>
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || t("common.user")}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">{t("nav.myAccount")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">{t("nav.myOrders")}</Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 size-4" />
                        {t("nav.adminDashboard")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/login">{t("common.signIn")}</Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            {isMobileMenuOpen && (
              <MobileMenu
                user={user}
                totalItems={totalItems}
                hydrated={hydrated}
                wishlistCount={wishlistCount}
                wishlistHydrated={wishlistHydrated}
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            )}
          </Sheet>
        </div>
      </div>
    </header>
  );
}
