import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/services/orders";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Order Detail",
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

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {isNew && (
        <div className="mb-8 flex flex-col items-center rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle className="mb-3 size-12 text-green-600" />
          <h2 className="mb-1 text-xl font-semibold text-green-800">
            Order Placed Successfully!
          </h2>
          <p className="text-sm text-green-700">
            Thank you for your order. We&apos;ll send you updates as it&apos;s
            processed.
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
        <Badge
          className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-xs`}
          variant="outline"
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

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
                    Qty: {item.quantity} x {formatPrice(Number(item.price))}
                  </p>
                </div>
                <span className="font-medium">
                  {formatPrice(Number(item.price) * item.quantity)}
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
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {Number(order.shippingCost) === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(Number(order.shippingCost))
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(Number(order.tax))}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(Number(order.total))}</span>
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
