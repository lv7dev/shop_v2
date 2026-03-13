"use client";

import { setExchangeRate } from "@/lib/utils";

export function ExchangeRateInit({ rate }: { rate: number }) {
  setExchangeRate(rate);
  return null;
}
