import type { Metadata } from "next";
import { getPaymentSettings, getDeliverySettings, getPricingSettings } from "@/actions/settings";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { DeliverySettingsForm } from "@/components/admin/delivery-settings-form";
import { PricingSettingsForm } from "@/components/admin/pricing-settings-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Settings - Admin",
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.settings");

  const [paymentSettings, deliverySettings, pricingSettings] = await Promise.all([
    getPaymentSettings(),
    getDeliverySettings(),
    getPricingSettings(),
  ]);

  const envStatus = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    momo:
      !!process.env.MOMO_PARTNER_CODE &&
      !!process.env.MOMO_ACCESS_KEY &&
      !!process.env.MOMO_SECRET_KEY,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      <PaymentSettingsForm
        initialSettings={paymentSettings}
        envStatus={envStatus}
      />

      <div className="mt-10">
        <DeliverySettingsForm initialSettings={deliverySettings} />
      </div>

      <div className="mt-10">
        <PricingSettingsForm initialSettings={pricingSettings} />
      </div>
    </div>
  );
}
