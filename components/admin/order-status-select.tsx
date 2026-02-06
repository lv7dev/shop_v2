"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/actions/order";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    const result = await updateOrderStatus(
      orderId,
      newStatus as (typeof STATUSES)[number]
    );
    if (result.success) {
      toast.success(`Order updated to ${ORDER_STATUS_LABELS[newStatus]}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {ORDER_STATUS_LABELS[status] ?? status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
