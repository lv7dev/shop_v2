import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
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

const OrderStatusSelect = dynamic(
  () => import("@/components/admin/order-status-select").then((mod) => mod.OrderStatusSelect)
);

export const metadata: Metadata = {
  title: "Manage Orders",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <span className="text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
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
      </div>
    </div>
  );
}
