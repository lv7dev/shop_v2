import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeliveryTrackingData } from "@/actions/delivery";
import { DeliveryTrackingMap } from "@/components/orders/delivery-tracking-map";

export const metadata: Metadata = {
  title: "Track Delivery",
  robots: { index: false, follow: false },
};

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDeliveryTrackingData(id);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href={`/orders/${id}`}>
            <ArrowLeft className="mr-1 size-4" />
            Back to Order
          </Link>
        </Button>
        <div className="flex flex-col items-center gap-4 rounded-lg border p-12 text-center">
          <AlertTriangle className="size-12 text-amber-500" />
          <h1 className="text-xl font-semibold">Tracking Unavailable</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {result.error}
          </p>
          <Button asChild>
            <Link href={`/orders/${id}`}>View Order Details</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <DeliveryTrackingMap
        orderId={id}
        hqLat={result.hqLat}
        hqLng={result.hqLng}
        hqAddress={result.hqAddress}
        destLat={result.destLat}
        destLng={result.destLng}
        simulationDurationMinutes={result.simulationDurationMinutes}
        orderNumber={result.orderNumber}
        alreadyDelivered={result.isDelivered}
      />
    </div>
  );
}
