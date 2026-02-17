"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

type VariantOption = {
  facetId: string;
  facetName: string;
  facetValueId: string;
  facetValue: string;
};

type Variant = {
  id: string;
  sku: string | null;
  price: number;
  stock: number;
  options: VariantOption[];
};

type VariantPickerProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  variants: Variant[];
};

export function VariantPicker({ product, variants }: VariantPickerProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  // Extract unique facets and their values from variants
  const facetGroups = useMemo(() => {
    const groups = new Map<
      string,
      { facetId: string; facetName: string; values: { id: string; value: string }[] }
    >();

    for (const variant of variants) {
      for (const opt of variant.options) {
        if (!groups.has(opt.facetId)) {
          groups.set(opt.facetId, {
            facetId: opt.facetId,
            facetName: opt.facetName,
            values: [],
          });
        }
        const group = groups.get(opt.facetId)!;
        if (!group.values.find((v) => v.id === opt.facetValueId)) {
          group.values.push({ id: opt.facetValueId, value: opt.facetValue });
        }
      }
    }

    return Array.from(groups.values());
  }, [variants]);

  // State: selected facetValueId per facet
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    // Pre-select first available variant's options
    const first = variants.find((v) => v.stock > 0) || variants[0];
    if (!first) return {};
    const initial: Record<string, string> = {};
    for (const opt of first.options) {
      initial[opt.facetId] = opt.facetValueId;
    }
    return initial;
  });

  function selectOption(facetId: string, facetValueId: string) {
    setSelections((prev) => ({ ...prev, [facetId]: facetValueId }));
  }

  // Find matching variant
  const selectedVariant = useMemo(() => {
    const selValues = new Set(Object.values(selections));
    return variants.find((v) => {
      const optIds = new Set(v.options.map((o) => o.facetValueId));
      if (optIds.size !== selValues.size) return false;
      for (const val of selValues) {
        if (!optIds.has(val)) return false;
      }
      return true;
    });
  }, [variants, selections]);

  // Determine which values are available given current selections
  function isValueAvailable(facetId: string, facetValueId: string): boolean {
    // Check if any variant with this value (and current other selections) exists
    const otherSelections = { ...selections, [facetId]: facetValueId };
    const otherValues = Object.entries(otherSelections);

    return variants.some((v) => {
      const optIds = new Set(v.options.map((o) => o.facetValueId));
      return otherValues.every(([, val]) => optIds.has(val));
    });
  }

  const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = !selectedVariant || effectiveStock === 0;

  function handleAdd() {
    if (!selectedVariant || isOutOfStock) return;

    const variantLabel = selectedVariant.options
      .map((o) => `${o.facetName}: ${o.facetValue}`)
      .join(" / ");

    addItem({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantLabel,
      price: effectivePrice,
      image: product.image,
      stock: effectiveStock,
    });

    setAdded(true);
    toast.success(`${product.name} (${variantLabel}) added to cart`);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      {/* Option selectors */}
      {facetGroups.map((group) => (
        <div key={group.facetId} className="space-y-2">
          <Label className="text-sm font-medium">{group.facetName}</Label>
          <div className="flex flex-wrap gap-2">
            {group.values.map((val) => {
              const isSelected = selections[group.facetId] === val.id;
              const available = isValueAvailable(group.facetId, val.id);

              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => selectOption(group.facetId, val.id)}
                  disabled={!available}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                        ? "border-border bg-background hover:border-primary/50 hover:bg-accent"
                        : "border-border bg-muted text-muted-foreground/50 line-through cursor-not-allowed"
                  )}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected variant info */}
      {selectedVariant && (
        <div className="flex items-center gap-3 text-sm">
          {selectedVariant.sku && (
            <span className="text-muted-foreground">
              SKU: <span className="font-mono">{selectedVariant.sku}</span>
            </span>
          )}
          <Badge variant={effectiveStock > 0 ? "secondary" : "destructive"}>
            {effectiveStock > 0
              ? `${effectiveStock} in stock`
              : "Out of stock"}
          </Badge>
        </div>
      )}

      {!selectedVariant && Object.keys(selections).length > 0 && (
        <p className="text-sm text-muted-foreground">
          This combination is not available. Please select different options.
        </p>
      )}

      {/* Add to cart button */}
      <Button
        type="button"
        className="w-full"
        onClick={handleAdd}
        disabled={isOutOfStock}
        variant={added ? "secondary" : "default"}
      >
        {isOutOfStock ? (
          "Out of Stock"
        ) : added ? (
          <>
            <Check className="size-4" />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" />
            Add to Cart – ${effectivePrice.toFixed(2)}
          </>
        )}
      </Button>
    </div>
  );
}
