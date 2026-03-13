import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { getAddresses } from "@/actions/address";
import { getEnabledPaymentMethods } from "@/actions/settings";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase securely.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await getSession();
  const [{ addresses }, enabledMethods] = await Promise.all([
    session ? getAddresses() : Promise.resolve({ addresses: [] }),
    getEnabledPaymentMethods(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("checkout.title")}</h1>
      <CheckoutForm
        addresses={addresses}
        isAuthenticated={!!session}
        enabledPaymentMethods={enabledMethods}
      />
    </div>
  );
}
