"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryPaymentButton({
  orderId,
  paymentMethod,
}: {
  orderId: string;
  paymentMethod: string;
}) {
  const [loading, setLoading] = useState(false);

  const endpoint =
    paymentMethod === "STRIPE"
      ? "/api/checkout/stripe"
      : "/api/checkout/momo";

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      const url = data.url || data.payUrl;
      if (url) {
        window.location.assign(url);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRetry} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        "Retry Payment"
      )}
    </Button>
  );
}
