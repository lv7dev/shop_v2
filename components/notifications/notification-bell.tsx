"use client";

import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CheckCheck, Tag, Zap, ShoppingBag, Package, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore, type NotificationItem } from "@/store/notification-store";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notification";
import { relativeTime, formatPrice } from "@/lib/utils";

function DiscountDetails({ data }: { data: Record<string, unknown> }) {
  const t = useTranslations("notification");
  const locale = useLocale();
  const scope = data.scope as string | undefined;
  const method = data.method as string | undefined;
  const productNames = data.productNames as string[] | undefined;
  const minOrder = data.minOrder as number | null | undefined;
  const expiresAt = data.expiresAt as string | null | undefined;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {method && (
        <Badge
          variant={method === "AUTO" ? "default" : "outline"}
          className="h-5 px-1.5 text-[10px]"
        >
          {method === "AUTO" ? (
            <>
              <Zap className="mr-0.5 size-2.5" />
              {t("auto")}
            </>
          ) : (
            <>
              <Tag className="mr-0.5 size-2.5" />
              {t("codeMethod")}
            </>
          )}
        </Badge>
      )}
      {scope && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {scope === "ORDER" ? (
            <>
              <ShoppingBag className="mr-0.5 size-2.5" />
              {t("order")}
            </>
          ) : (
            <>
              <Package className="mr-0.5 size-2.5" />
              {productNames && productNames.length > 0
                ? t("productCount", { count: productNames.length })
                : t("products")}
            </>
          )}
        </Badge>
      )}
      {minOrder != null && minOrder > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {t("minOrder", { amount: formatPrice(minOrder, locale) })}
        </Badge>
      )}
      {expiresAt && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          <Clock className="mr-0.5 size-2.5" />
          {new Date(expiresAt).toLocaleDateString(locale)}
        </Badge>
      )}
      {scope === "PRODUCT" && productNames && productNames.length > 0 && (
        <p className="mt-0.5 w-full text-[10px] text-muted-foreground">
          {productNames.length <= 3
            ? productNames.join(", ")
            : `${productNames.slice(0, 2).join(", ")} ${t("moreProducts", { count: productNames.length - 2 })}`}
        </p>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "LOW_STOCK") {
    return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />;
  }
  return null;
}

function useNotificationTitle(notification: NotificationItem) {
  const t = useTranslations("notification");
  const d = notification.data;
  switch (notification.type) {
    case "DISCOUNT":
      return t("titleDiscount");
    case "ORDER_UPDATE":
      return d?.status === "DELIVERED" ? t("titleDelivered") : t("titleShipped");
    case "LOW_STOCK": {
      const name = (d?.productName as string) ?? "";
      return d?.stock === 0
        ? t("titleOutOfStock", { name })
        : t("titleLowStock", { name });
    }
    default:
      return notification.title;
  }
}

function useNotificationMessage(notification: NotificationItem) {
  const t = useTranslations("notification");
  const d = notification.data;
  switch (notification.type) {
    case "ORDER_UPDATE": {
      const orderNum = ((d?.orderNumber as string) ?? "").slice(-8).toUpperCase();
      return d?.status === "DELIVERED"
        ? t("msgDelivered", { orderNumber: orderNum })
        : t("msgShipped", { orderNumber: orderNum });
    }
    case "LOW_STOCK": {
      const name = (d?.productName as string) ?? "";
      const stock = (d?.stock as number) ?? 0;
      const threshold = (d?.threshold as number) ?? 0;
      return stock === 0
        ? t("msgOutOfStock", { name })
        : t("msgLowStock", { name, stock, threshold });
    }
    default:
      return notification.message ?? "";
  }
}

function NotificationContent({ notification }: { notification: NotificationItem }) {
  const locale = useLocale();
  const t = useTranslations("notification");
  const isDiscount = notification.type === "DISCOUNT" && notification.data;
  const isLowStock = notification.type === "LOW_STOCK" && notification.data;
  const title = useNotificationTitle(notification);
  const message = useNotificationMessage(notification);

  return (
    <>
      <NotificationIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {isDiscount ? (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {Boolean(notification.data!.code) && notification.data!.method !== "AUTO" ? (
                <>
                  {t("code")}{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {String(notification.data!.code)}
                  </span>
                  {" · "}
                </>
              ) : null}
              {notification.data!.type === "PERCENTAGE"
                ? t("percentOff", { value: String(notification.data!.value) })
                : t("fixedOff", { value: formatPrice(Number(notification.data!.value), locale) })}
              {notification.data!.method === "AUTO" ? ` · ${t("autoApplied")}` : null}
            </p>
            <DiscountDetails data={notification.data!} />
          </>
        ) : isLowStock ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {relativeTime(new Date(notification.createdAt), locale)}
        </p>
      </div>
    </>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const t = useTranslations("notification");
  const notifications = useNotificationStore((s) => s.notifications);
  const hydrated = useNotificationStore((s) => s._hydrated);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  async function handleNotificationClick(n: NotificationItem) {
    if (!n.isRead) {
      markRead(n.id);
      await markNotificationRead(n.id);
    }
    if (n.type === "ORDER_UPDATE" && n.data?.orderId) {
      router.push(`/orders/${n.data.orderId}`);
    } else if (n.type === "LOW_STOCK" && n.data?.productId) {
      router.push(`/dashboard/products/${n.data.productId}/edit`);
    }
  }

  async function handleMarkAllRead() {
    markAllRead();
    await markAllNotificationsRead();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span
            className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground transition-transform ${
              hydrated && unreadCount > 0 ? "scale-100" : "scale-0"
            }`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="size-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                  !n.isRead ? "bg-accent/50" : ""
                }`}
              >
                <NotificationContent notification={n} />
                {!n.isRead && (
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
