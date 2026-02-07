import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartAuthSync } from "@/components/cart/cart-auth-sync";
import { getCurrentUser } from "@/lib/auth";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <CartAuthSync isAuthenticated={!!user} />
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
