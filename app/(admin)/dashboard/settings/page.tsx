import type { Metadata } from "next";
import { getPaymentSettings } from "@/actions/settings";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export const metadata: Metadata = {
  title: "Settings - Admin",
};

export default async function SettingsPage() {
  const paymentSettings = await getPaymentSettings();

  const envStatus = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    momo:
      !!process.env.MOMO_PARTNER_CODE &&
      !!process.env.MOMO_ACCESS_KEY &&
      !!process.env.MOMO_SECRET_KEY,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <PaymentSettingsForm
        initialSettings={paymentSettings}
        envStatus={envStatus}
      />
    </div>
  );
}
