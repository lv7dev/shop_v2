"use client";

import { Bell, CheckCheck, Tag, Zap, ShoppingBag, Package, Clock, DollarSign } from "lucide-react";
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
import { relativeTime } from "@/lib/utils";

function DiscountDetails({ data }: { data: Record<string, unknown> }) {
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
              Auto
            </>
          ) : (
            <>
              <Tag className="mr-0.5 size-2.5" />
              Code
            </>
          )}
        </Badge>
      )}
      {scope && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {scope === "ORDER" ? (
            <>
              <ShoppingBag className="mr-0.5 size-2.5" />
              Order
            </>
          ) : (
            <>
              <Package className="mr-0.5 size-2.5" />
              {productNames && productNames.length > 0
                ? `${productNames.length} product${productNames.length !== 1 ? "s" : ""}`
                : "Products"}
            </>
          )}
        </Badge>
      )}
      {minOrder != null && minOrder > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          <DollarSign className="mr-0.5 size-2.5" />
          Min ${minOrder.toFixed(0)}
        </Badge>
      )}
      {expiresAt && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          <Clock className="mr-0.5 size-2.5" />
          {new Date(expiresAt).toLocaleDateString()}
        </Badge>
      )}
      {scope === "PRODUCT" && productNames && productNames.length > 0 && (
        <p className="mt-0.5 w-full text-[10px] text-muted-foreground">
          {productNames.length <= 3
            ? productNames.join(", ")
            : `${productNames.slice(0, 2).join(", ")} +${productNames.length - 2} more`}
        </p>
      )}
    </div>
  );
}

function NotificationContent({ notification }: { notification: NotificationItem }) {
  const isDiscount = notification.type === "DISCOUNT" && notification.data;

  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{notification.title}</p>
      {isDiscount ? (
        <>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {Boolean(notification.data!.code) && notification.data!.method !== "AUTO" ? (
              <>
                Code:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {String(notification.data!.code)}
                </span>
                {" · "}
              </>
            ) : null}
            {notification.data!.type === "PERCENTAGE"
              ? `${notification.data!.value}% off`
              : `$${notification.data!.value} off`}
            {notification.data!.method === "AUTO" ? " · Auto-applied at checkout" : null}
          </p>
          <DiscountDetails data={notification.data!} />
        </>
      ) : (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        {relativeTime(new Date(notification.createdAt))}
      </p>
    </div>
  );
}

export function NotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications);
  const hydrated = useNotificationStore((s) => s._hydrated);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  async function handleMarkRead(id: string) {
    markRead(id);
    await markNotificationRead(id);
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
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
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
