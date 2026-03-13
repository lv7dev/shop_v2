import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
});

// Mutable exchange rate — set per request (server) or per page load (client)
// Falls back to env var, then to 25 000
let _vndToUsdRate = Number(
  process.env.NEXT_PUBLIC_VND_TO_USD_RATE || 25000
);

/** Set the VND→USD rate (called from layout with DB value) */
export function setExchangeRate(rate: number) {
  _vndToUsdRate = rate;
}

/** Get the current VND→USD rate */
export function getExchangeRateValue(): number {
  return _vndToUsdRate;
}

/**
 * Format a price for display.
 *
 * @param price    - Amount (always stored as VND in the database)
 * @param localeOrCurrency
 *   • locale  "vi" → VND,  "en" → convert VND→USD
 *   • currency code "VND" | "USD" → format as-is (no conversion,
 *     used for order history where the amount is already in that currency)
 */
export function formatPrice(
  price: number,
  localeOrCurrency: string = "vi"
): string {
  switch (localeOrCurrency) {
    // Locales — convert from VND base price
    case "vi":
      return vndFormatter.format(price);
    case "en":
      return usdFormatter.format(price / _vndToUsdRate);

    // Explicit currency codes — no conversion (amount already in that currency)
    case "VND":
      return vndFormatter.format(price);
    case "USD":
      return usdFormatter.format(price);

    default:
      return vndFormatter.format(price);
  }
}

export function relativeTime(date: Date, locale: string = "vi"): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  if (seconds < 60) return rtf.format(0, "second"); // "just now" / "bây giờ"
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
