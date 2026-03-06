"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadInvoiceButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (!res.ok) throw new Error("Failed to generate invoice");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header or use fallback
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `invoice-${orderId.slice(-8)}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      console.error("Invoice download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Download className="mr-2 size-4" />
      )}
      {loading ? "Generating..." : "Download Invoice"}
    </Button>
  );
}
