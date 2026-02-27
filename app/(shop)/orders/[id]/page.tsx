import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle,
  ArrowLeft,
  Package,
  ShoppingCart,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/services/orders";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { PaymentStatusPoller } from "@/components/orders/payment-status-poller";
import { RetryPaymentButton } from "@/components/orders/retry-payment-button";

export const metadata: Metadata = {
  title: "Order Detail",
  description: "View your order details, items, and shipping information.",
  robots: { index: false, follow: false },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { new: isNew, payment } = await searchParams;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const showSuccessBanner =
    (isNew && order.paymentMethod === "COD") ||
    (payment === "success" && order.paymentStatus === "PAID");

  const showPaymentPendingBanner =
    payment === "momo" &&
    order.paymentStatus === "PENDING" &&
    order.paymentMethod === "MOMO";

  const showPaymentCancelledBanner =
    payment === "cancelled" && order.paymentStatus === "PENDING";

  const showPaymentFailedBanner =
    order.paymentStatus === "FAILED" || order.paymentStatus === "EXPIRED";

  const showPaymentPaidBanner =
    isNew && order.paymentStatus === "PAID" && order.paymentMethod !== "COD";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Success banner for COD or confirmed payment */}
      {(showSuccessBanner || showPaymentPaidBanner) && (
        <div className="mb-8 flex flex-col items-center rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle className="mb-3 size-12 text-green-600" />
          <h2 className="mb-1 text-xl font-semibold text-green-800">
            {order.paymentStatus === "PAID"
              ? "Payment Confirmed!"
              : "Order Placed Successfully!"}
          </h2>
          <p className="text-sm text-green-700">
            Thank you for your order. We&apos;ll send you updates as it&apos;s
            processed.
          </p>
        </div>
      )}

      {/* Polling banner for MoMo redirect return */}
      {showPaymentPendingBanner && <PaymentStatusPoller orderId={order.id} />}

      {/* Payment cancelled banner */}
      {showPaymentCancelledBanner && (
        <div className="mb-8 flex flex-col items-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="mb-3 size-12 text-amber-600" />
          <h2 className="mb-1 text-xl font-semibold text-amber-800">
            Payment Not Completed
          </h2>
          <p className="mb-4 text-sm text-amber-700">
            Your payment was not completed. The order is still pending.
          </p>
          <RetryPaymentButton
            orderId={order.id}
            paymentMethod={order.paymentMethod}
          />
        </div>
      )}

      {/* Payment failed/expired banner */}
      {showPaymentFailedBanner && (
        <div className="mb-8 flex flex-col items-center rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <XCircle className="mb-3 size-12 text-red-600" />
          <h2 className="mb-1 text-xl font-semibold text-red-800">
            {order.paymentStatus === "EXPIRED"
              ? "Payment Expired"
              : "Payment Failed"}
          </h2>
          <p className="text-sm text-red-700">
            {order.paymentStatus === "EXPIRED"
              ? "The payment window has expired. This order has been cancelled."
              : "Payment could not be processed. This order has been cancelled."}
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/orders">
              <ArrowLeft className="mr-1 size-4" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            Order #{order.orderNumber.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-xs`}
            variant="outline"
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>
          {order.paymentMethod !== "COD" && (
            <Badge
              className={`${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? ""} border-0 text-xs`}
              variant="outline"
            >
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Payment info */}
      {order.paymentMethod !== "COD" && (
        <div className="mb-6 rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
          {order.paymentId && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">{order.paymentId}</span>
            </div>
          )}
        </div>
      )}

      {/* Order items */}
      <div className="mb-6 rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="size-4" />
            Items ({order.items.length})
          </h2>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 px-6 py-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded bg-muted">
                {item.product.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ShoppingCart className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} x{" "}
                    {formatPrice(Number(item.price), order.currency)}
                  </p>
                </div>
                <span className="font-medium">
                  {formatPrice(
                    Number(item.price) * item.quantity,
                    order.currency
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order totals */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 font-semibold">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>
              {formatPrice(Number(order.subtotal), order.currency)}
            </span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Discount
                {order.discountCode ? ` (${order.discountCode})` : ""}
              </span>
              <span>
                -{formatPrice(Number(order.discountAmount), order.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {Number(order.shippingCost) === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(Number(order.shippingCost), order.currency)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(Number(order.tax), order.currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(Number(order.total), order.currency)}</span>
          </div>
        </div>

        {order.note && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="mb-1 text-sm font-medium">Order Notes</p>
              <p className="text-sm text-muted-foreground">{order.note}</p>
            </div>
          </>
        )}
      </div>

      {/* Shipping address */}
      {order.address && (
        <div className="mt-6 rounded-lg border p-6">
          <h2 className="mb-2 font-semibold">Shipping Address</h2>
          <div className="text-sm text-muted-foreground">
            <p>{order.address.name}</p>
            <p>{order.address.street}</p>
            <p>
              {order.address.city}, {order.address.state}{" "}
              {order.address.zipCode}
            </p>
            <p>{order.address.country}</p>
            {order.address.phone && <p>{order.address.phone}</p>}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/orders">View All Orders</Link>
        </Button>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
