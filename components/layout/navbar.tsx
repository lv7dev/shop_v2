"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store/cart-store";
import { APP_NAME, NAV_LINKS } from "@/lib/constants";
import { logout } from "@/actions/auth";

type NavbarProps = {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

export function Navbar({ user }: NavbarProps) {
  const hydrated = useCartStore((s) => s._hydrated);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const clearCart = useCartStore((s) => s.clearCart);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    clearCart(false); // Clear localStorage only, keep DB cart for next login
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">My Orders</Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 size-4" />
                        Admin Dashboard
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
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      Account
                    </Link>
                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      Orders
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="text-left text-lg font-medium text-destructive"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      Sign In
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
