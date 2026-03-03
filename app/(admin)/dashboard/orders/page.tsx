import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOrders } from "@/services/admin";
import { formatPrice } from "@/lib/utils";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { DataTableFilter } from "@/components/admin/data-table-filter";
import { DataTablePagination } from "@/components/admin/data-table-pagination";

const OrderStatusSelect = dynamic(
  () => import("@/components/admin/order-status-select").then((mod) => mod.OrderStatusSelect)
);

export const metadata: Metadata = {
  title: "Manage Orders",
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.per_page) || 10);
  const search = params.q || undefined;
  const status = params.status || undefined;

  const { data: orders, total } = await getAdminOrders({
    page,
    perPage,
    search,
    status,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "order" : "orders"}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder="Search by order # or customer..." />
        <DataTableFilter paramKey="status" options={STATUS_OPTIONS} placeholder="Status" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.orderNumber.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{order.user.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      {order.items.slice(0, 2).map((item) => (
                        <p key={item.id} className="truncate text-sm text-muted-foreground">
                          {item.quantity}x {item.product.name}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 2} more
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(Number(order.total))}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination total={total} page={page} perPage={perPage} />
      </div>
    </div>
  );
}
