"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateProduct, deleteProduct } from "@/actions/product";

export function AdminProductActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggleActive() {
    setLoading(true);
    const result = await updateProduct(productId, { isActive: !isActive });
    if (result.success) {
      toast.success(isActive ? "Product deactivated" : "Product activated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    const result = await deleteProduct(productId);
    if (result.success) {
      toast.success("Product deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" disabled={loading}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggleActive}>
          {isActive ? (
            <>
              <EyeOff className="mr-2 size-4" />
              Deactivate
            </>
          ) : (
            <>
              <Eye className="mr-2 size-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
