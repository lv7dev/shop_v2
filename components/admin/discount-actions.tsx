"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteDiscount, toggleDiscount } from "@/actions/discount";

export function DiscountDeleteButton({
  discountId,
}: {
  discountId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteDiscount(discountId);
    if (result.success) {
      toast.success("Discount deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        <Trash2 className="size-3.5" />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete discount"
        description="Delete this discount code? This action cannot be undone."
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel="Delete"
      />
    </>
  );
}

export function DiscountToggleButton({
  discountId,
  isActive,
}: {
  discountId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await toggleDiscount(discountId);
    if (result.success) {
      toast.success(isActive ? "Discount deactivated" : "Discount activated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs"
      onClick={handleToggle}
      disabled={loading}
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
