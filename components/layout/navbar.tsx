"use client";

import Link from "next/link";
import { ShoppingCart, Menu, Search, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { APP_NAME, NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const hydrated = useCartStore((s) => s._hydrated);
  const totalItems = useCartStore((s) => s.totalItems());
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

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
              {hydrated && totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
            <Link href="/account">
              <User className="size-5" />
            </Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={toggleMobileMenu}>
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
                    onClick={closeMobileMenu}
                    className="text-lg font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="text-lg font-medium"
                >
                  Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
