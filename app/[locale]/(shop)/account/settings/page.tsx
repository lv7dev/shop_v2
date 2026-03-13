import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account preferences and settings.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("account.settings")}</h1>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("account.preferences")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("account.preferencesDesc")}
        </p>
      </div>
    </div>
  );
}
