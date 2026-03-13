import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrdersByUserId } from "@/services/orders";
import { requireAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  description: "View your order history and track current orders.",
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

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireAuth();
  const orders = await getOrdersByUserId(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("orders.myOrders")}</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">{t("orders.noOrders")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("orders.noOrdersDesc")}
          </p>
          <Button asChild>
            <Link href="/products">{t("orders.startShopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border p-6 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h2 className="font-semibold">
                      Order #{order.orderNumber.slice(-8).toUpperCase()}
                    </h2>
                    <Badge
                      className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-xs`}
                      variant="outline"
                    >
                      {t(`status.${order.status}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold">
                    {formatPrice(Number(order.total), order.currency)}
                  </span>
                  {order.paymentMethod !== "COD" && (
                    <p className="text-xs text-muted-foreground">
                      {t(`payment.${order.paymentMethod}`)} &middot;{" "}
                      {t(`payment.status.${order.paymentStatus}`)}
                    </p>
                  )}
                </div>
              </div>

              {/* Item thumbnails */}
              <div className="mt-4 flex items-center gap-3">
                <Package className="size-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="relative size-10 overflow-hidden rounded-full border-2 border-background bg-muted"
                    >
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ShoppingCart className="size-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("orders.item", { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
