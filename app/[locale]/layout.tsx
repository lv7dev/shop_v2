import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { routing } from "@/i18n/routing";
import { APP_NAME } from "@/lib/constants";
import { getBaseUrl } from "@/lib/seo";
import { getExchangeRate } from "@/actions/settings";
import { setExchangeRate } from "@/lib/utils";
import { ExchangeRateInit } from "@/components/exchange-rate-init";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description:
      locale === "vi"
        ? "Khám phá sản phẩm cao cấp với giá tốt nhất. Miễn phí giao hàng cho đơn hàng từ 1.000.000₫."
        : "Discover premium products at unbeatable prices. Free shipping on orders over 1,000,000₫.",
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        vi: "/vi",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, exchangeRate] = await Promise.all([
    getMessages(),
    getExchangeRate(),
  ]);

  // Set for server-side formatPrice calls in this request
  setExchangeRate(exchangeRate);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: APP_NAME,
            url: getBaseUrl(),
          }),
        }}
      />
      <ExchangeRateInit rate={exchangeRate} />
      <NextIntlClientProvider messages={messages}>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster />
      </NextIntlClientProvider>
    </>
  );
}
