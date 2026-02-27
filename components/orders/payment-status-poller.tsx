"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"polling" | "resolved">("polling");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/${orderId}/payment-status`);
        const data = await res.json();

        if (
          data.paymentStatus === "PAID" ||
          data.paymentStatus === "FAILED" ||
          data.paymentStatus === "EXPIRED"
        ) {
          setStatus("resolved");
          clearInterval(interval);
          router.refresh();
        } else if (attempts >= maxAttempts) {
          setStatus("resolved");
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        if (attempts >= maxAttempts) {
          setStatus("resolved");
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  if (status === "resolved") return null;

  return (
    <div className="mb-8 flex flex-col items-center rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
      <Loader2 className="mb-3 size-12 animate-spin text-blue-600" />
      <h2 className="mb-1 text-xl font-semibold text-blue-800">
        Verifying Payment...
      </h2>
      <p className="text-sm text-blue-700">
        Please wait while we confirm your payment.
      </p>
    </div>
  );
}
