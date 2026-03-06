import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, TrendingUp, BarChart3, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminStats, getLowStockProducts, getLowStockCount, getRevenueOverTime, getOrdersPerDay, getTopSellingProducts } from "@/services/admin";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { OrdersChart } from "@/components/admin/charts/orders-chart";
import { TopProductsChart } from "@/components/admin/charts/top-products-chart";

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
  const [stats, lowStock, lowStockCount, revenueData, ordersData, topProducts] = await Promise.all([
    getAdminStats(),
    getLowStockProducts(),
    getLowStockCount(),
    getRevenueOverTime(30),
    getOrdersPerDay(30),
    getTopSellingProducts(10),
  ]);

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

  const allLowStockItems = [
    ...lowStock.products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold,
      image: p.images[0] as string | undefined,
      href: `/dashboard/products/${p.id}/edit`,
      variant: null as string | null,
    })),
    ...lowStock.variants.map((v) => ({
      id: v.id,
      name: v.productName,
      stock: v.stock,
      threshold: v.lowStockThreshold,
      image: v.images[0] as string | undefined,
      href: `/dashboard/products/${v.productId}/edit`,
      variant: v.sku,
    })),
  ].sort((a, b) => a.stock - b.stock);

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

      {/* Analytics Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-green-600" />
            <h2 className="text-lg font-semibold">Revenue (Last 30 Days)</h2>
          </div>
          <RevenueChart data={revenueData} />
        </div>
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Orders Per Day</h2>
          </div>
          <OrdersChart data={ordersData} />
        </div>
      </div>
      <div className="mt-4 rounded-lg border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="size-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Top Selling Products</h2>
        </div>
        <TopProductsChart data={topProducts} />
      </div>

      {/* Low stock alerts */}
      {allLowStockItems.length > 0 && (
        <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <div className="border-b border-orange-200 px-6 py-4 dark:border-orange-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-orange-600" />
                <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
                <Badge variant="destructive" className="ml-1">
                  {lowStockCount}
                </Badge>
              </div>
              <Link
                href="/dashboard/products?status=active"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all products
              </Link>
            </div>
          </div>
          <div className="divide-y divide-orange-200 dark:divide-orange-900/50">
            {allLowStockItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-orange-100/50 dark:hover:bg-orange-950/30"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="size-10 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                    <Package className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.variant}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.stock === 0 ? "destructive" : "outline"}
                    className={
                      item.stock === 0
                        ? ""
                        : "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
                    }
                  >
                    {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
