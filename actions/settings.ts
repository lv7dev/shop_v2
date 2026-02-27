"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";

export type PaymentSettings = {
  cod: { enabled: boolean };
  stripe: { enabled: boolean };
  momo: { enabled: boolean };
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  cod: { enabled: true },
  stripe: { enabled: false },
  momo: { enabled: false },
};

type SiteSettingsData = {
  payment?: PaymentSettings;
};

async function getSiteSettings(): Promise<SiteSettingsData> {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });
  return (settings?.data as SiteSettingsData) ?? {};
}

async function updateSiteSettings(data: Partial<SiteSettingsData>) {
  const existing = await getSiteSettings();
  const merged = { ...existing, ...data };

  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", data: merged as object },
    update: { data: merged as object },
  });

  return merged;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const settings = await getSiteSettings();
  return settings.payment ?? DEFAULT_PAYMENT_SETTINGS;
}

/**
 * Returns which payment methods are available to show in checkout.
 * A method is available if: enabled in settings AND env vars are configured.
 */
export async function getEnabledPaymentMethods(): Promise<string[]> {
  const settings = await getPaymentSettings();
  const methods: string[] = [];

  if (settings.cod.enabled) {
    methods.push("COD");
  }

  if (settings.stripe.enabled && process.env.STRIPE_SECRET_KEY) {
    methods.push("STRIPE");
  }

  if (
    settings.momo.enabled &&
    process.env.MOMO_PARTNER_CODE &&
    process.env.MOMO_ACCESS_KEY &&
    process.env.MOMO_SECRET_KEY
  ) {
    methods.push("MOMO");
  }

  return methods;
}

export async function updatePaymentSettings(payment: PaymentSettings) {
  await requireAdmin();

  try {
    await updateSiteSettings({ payment });
    revalidatePath("/dashboard/settings");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Update payment settings error:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
