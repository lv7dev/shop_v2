"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { MoreHorizontal, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { updateProduct, deleteProduct } from "@/actions/product";

export function AdminProductActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("admin.confirm");
  const tc = useTranslations("admin.common");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleToggleActive() {
    setLoading(true);
    const result = await updateProduct(productId, { isActive: !isActive });
    if (result.success) {
      toast.success(isActive ? t("productDeactivated") : t("productActivated"));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteProduct(productId);
    if (result.success) {
      toast.success(t("productDeleted"));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={loading}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${productId}/edit`}>
              <Pencil className="mr-2 size-4" />
              {tc("edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? (
              <>
                <EyeOff className="mr-2 size-4" />
                {tc("deactivate")}
              </>
            ) : (
              <>
                <Eye className="mr-2 size-4" />
                {tc("activate")}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            {tc("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteProduct")}
        description={t("deleteProductDesc")}
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel={tc("delete")}
      />
    </>
  );
}
