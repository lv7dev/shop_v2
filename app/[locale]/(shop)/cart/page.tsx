import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartContent } from "@/components/cart/cart-content";

export const metadata: Metadata = {
  title: "Cart",
  description: "View and manage the items in your shopping cart.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("cart.title")}</h1>
      <CartContent />
    </div>
  );
}
