"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
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
  const t = useTranslations("admin.confirm");
  const tc = useTranslations("admin.common");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteDiscount(discountId);
    if (result.success) {
      toast.success(t("discountDeleted"));
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
        title={t("deleteDiscount")}
        description={t("deleteDiscountDesc")}
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel={tc("delete")}
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
  const t = useTranslations("admin.confirm");
  const tc = useTranslations("admin.common");
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await toggleDiscount(discountId);
    if (result.success) {
      toast.success(isActive ? t("discountDeactivated") : t("discountActivated"));
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
      {isActive ? tc("deactivate") : tc("activate")}
    </Button>
  );
}
