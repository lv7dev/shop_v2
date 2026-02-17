"use client";

import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FacetValueOption = {
  id: string;
  value: string;
  facetId: string;
  facetName: string;
  facetSlug: string;
};

export type VariantData = {
  id?: string;
  sku: string;
  price: string;
  stock: string;
  facetValueIds: Set<string>;
};

type VariantManagerProps = {
  facetOptions: FacetValueOption[];
  facetGroups: { id: string; name: string; slug: string; values: { id: string; value: string }[] }[];
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  basePrice: string;
};

export function VariantManager({
  facetOptions,
  facetGroups,
  variants,
  onChange,
  basePrice,
}: VariantManagerProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  function addVariant() {
    const newVariant: VariantData = {
      sku: "",
      price: basePrice || "0",
      stock: "0",
      facetValueIds: new Set(),
    };
    const updated = [...variants, newVariant];
    onChange(updated);
    // Open the newly added variant
    setOpenItems([...openItems, `variant-${updated.length - 1}`]);
  }

  function duplicateVariant(index: number) {
    const source = variants[index];
    const newVariant: VariantData = {
      sku: "",
      price: source.price,
      stock: source.stock,
      facetValueIds: new Set(source.facetValueIds),
    };
    const updated = [...variants];
    updated.splice(index + 1, 0, newVariant);
    onChange(updated);
    setOpenItems([...openItems, `variant-${index + 1}`]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantData, value: string) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function toggleVariantFacetValue(index: number, facetValueId: string) {
    const updated = [...variants];
    const next = new Set(updated[index].facetValueIds);
    if (next.has(facetValueId)) {
      next.delete(facetValueId);
    } else {
      next.add(facetValueId);
    }
    updated[index] = { ...updated[index], facetValueIds: next };
    onChange(updated);
  }

  function getVariantLabel(variant: VariantData): string {
    if (variant.facetValueIds.size === 0) {
      return "No options selected";
    }

    const labels: string[] = [];
    for (const group of facetGroups) {
      const selectedValues = group.values.filter((v) =>
        variant.facetValueIds.has(v.id)
      );
      if (selectedValues.length > 0) {
        labels.push(`${group.name}: ${selectedValues.map((v) => v.value).join(", ")}`);
      }
    }
    return labels.join(" / ") || "No options selected";
  }

  // Filter to only show facets that are relevant for variants (e.g., Size, Color)
  const variantFacetGroups = facetGroups.filter((g) => g.values.length > 0);

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Variants</h2>
          <p className="text-sm text-muted-foreground">
            Add variants for different sizes, colors, etc. Each variant has its
            own price, stock, and SKU.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          className="gap-1"
        >
          <Plus className="size-4" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No variants yet. Click &quot;Add Variant&quot; to create one.
          <br />
          <span className="text-xs">
            When variants exist, the base product price/stock become defaults.
            Each variant overrides them.
          </span>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
          className="space-y-2"
        >
          {variants.map((variant, index) => (
            <AccordionItem
              key={index}
              value={`variant-${index}`}
              className="rounded-lg border px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex flex-1 items-center gap-3 text-left">
                  <span className="text-sm font-medium">
                    Variant {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {getVariantLabel(variant)}
                  </span>
                  {variant.sku && (
                    <Badge variant="secondary" className="text-xs">
                      {variant.sku}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs ml-auto mr-2">
                    ${variant.price || "0"} / {variant.stock || "0"} in stock
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  {/* Options selection */}
                  {variantFacetGroups.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Options</Label>
                      {variantFacetGroups.map((group) => (
                        <div key={group.id} className="space-y-1.5">
                          <span className="text-xs text-muted-foreground">
                            {group.name}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {group.values.map((val) => (
                              <label
                                key={val.id}
                                className="flex items-center gap-1.5 text-sm"
                              >
                                <Checkbox
                                  checked={variant.facetValueIds.has(val.id)}
                                  onCheckedChange={() =>
                                    toggleVariantFacetValue(index, val.id)
                                  }
                                />
                                {val.value}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price / Stock / SKU */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Stock *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        placeholder="VARIANT-SKU-001"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => duplicateVariant(index)}
                    >
                      <Copy className="size-3" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
