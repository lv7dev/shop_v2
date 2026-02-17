"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createFacetValuesBatch,
  updateFacetValue,
  deleteFacetValue,
} from "@/actions/facet";

type FacetValue = {
  id: string;
  value: string;
  slug: string;
  _count: { products: number };
};

type FacetValuesManagerProps = {
  facetId: string;
  values: FacetValue[];
};

export function FacetValuesManager({ facetId, values }: FacetValuesManagerProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const raw = newValue.trim();
    if (!raw) return;

    setLoading(true);

    // Split by comma for batch creation
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);

    const result = await createFacetValuesBatch(facetId, parts);
    if (result.success) {
      const msg =
        result.created === 1
          ? "1 value added"
          : `${result.created} values added`;
      const skipMsg =
        result.skipped.length > 0
          ? ` (skipped: ${result.skipped.join(", ")})`
          : "";
      toast.success(msg + skipMsg);
      setNewValue("");
      setAdding(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleUpdate(id: string) {
    if (!editValue.trim()) return;
    setLoading(true);
    const result = await updateFacetValue(id, { value: editValue.trim() });
    if (result.success) {
      toast.success("Value updated");
      setEditingId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, productCount: number) {
    if (productCount > 0) {
      if (
        !confirm(
          `This value is used by ${productCount} product(s). Removing it will unlink those products. Continue?`
        )
      ) {
        return;
      }
    }
    setLoading(true);
    const result = await deleteFacetValue(id);
    if (result.success) {
      toast.success("Value deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  function startEdit(value: FacetValue) {
    setEditingId(value.id);
    setEditValue(value.value);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((val) =>
          editingId === val.id ? (
            <div key={val.id} className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 w-24 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(val.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => handleUpdate(val.id)}
                disabled={loading}
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setEditingId(null)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div key={val.id} className="group flex items-center gap-1">
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 pr-1"
                onClick={() => startEdit(val)}
              >
                {val.value}
                {val._count.products > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({val._count.products})
                  </span>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 opacity-0 group-hover:opacity-100"
                onClick={() => handleDelete(val.id, val._count.products)}
                disabled={loading}
              >
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
          )
        )}

        {adding ? (
          <div className="flex items-center gap-1">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="S, M, L, XL"
              className="h-7 w-40 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewValue("");
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleAdd}
              disabled={loading || !newValue.trim()}
            >
              <Check className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => {
                setAdding(false);
                setNewValue("");
              }}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
