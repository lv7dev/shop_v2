"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/actions/category";

export function CategoryDeleteButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this category? Products must be reassigned first."))
      return;
    setLoading(true);
    const result = await deleteCategory(categoryId);
    if (result.success) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
