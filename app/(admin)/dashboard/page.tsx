import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminStats } from "@/services/admin";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin Dashboard",
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

export default async function DashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Orders",
      value: stats.orderCount.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      label: "Products",
      value: stats.productCount.toString(),
      icon: Package,
      color: "text-purple-600",
    },
    {
      label: "Customers",
      value: stats.customerCount.toString(),
      icon: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-8 rounded-lg border">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No orders yet.
          </div>
        ) : (
          <div className="divide-y">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href="/dashboard/orders"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    #{order.orderNumber.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.user.name || order.user.email} &middot;{" "}
                    {order._count.items}{" "}
                    {order._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-xs`}
                    variant="outline"
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  <span className="font-medium">
                    {formatPrice(Number(order.total))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
