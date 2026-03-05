"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, ChevronDown, Package, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
  facetGroups,
  variants,
  onChange,
  basePrice,
}: VariantManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function addVariant() {
    const newVariant: VariantData = {
      sku: "",
      price: basePrice || "0",
      stock: "0",
      facetValueIds: new Set(),
    };
    const updated = [...variants, newVariant];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
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
    setExpandedIndex(index + 1);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
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

  function toggleExpand(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  function getOptionBadges(variant: VariantData) {
    const badges: { facetName: string; value: string }[] = [];
    for (const group of facetGroups) {
      const selected = group.values.filter((v) => variant.facetValueIds.has(v.id));
      for (const val of selected) {
        badges.push({ facetName: group.name, value: val.value });
      }
    }
    return badges;
  }

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
        <>
          {/* Table header */}
          <div className="hidden items-center gap-3 border-b px-3 pb-2 sm:grid sm:grid-cols-[1fr_5.5rem_4.5rem_7rem_1.5rem]">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Options
            </span>
            <span className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Price
            </span>
            <span className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stock
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SKU
            </span>
            <span />
          </div>

          <div className="space-y-1.5">
            {variants.map((variant, index) => {
              const isExpanded = expandedIndex === index;
              const optionBadges = getOptionBadges(variant);
              const stockNum = Number(variant.stock) || 0;

              return (
                <div
                  key={index}
                  className={`rounded-lg border transition-colors ${
                    isExpanded
                      ? "border-primary/30 shadow-sm ring-1 ring-primary/10"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(index)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left sm:grid sm:grid-cols-[1fr_5.5rem_4.5rem_7rem_1.5rem]"
                  >
                    {/* Options */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/30" />
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        {optionBadges.length > 0 ? (
                          optionBadges.map((badge, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="h-5.5 gap-1 rounded-md px-1.5 text-[11px] font-normal"
                            >
                              <span className="text-muted-foreground">
                                {badge.facetName}:
                              </span>
                              <span className="font-medium">{badge.value}</span>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-muted-foreground/60">
                            No options
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <span className="hidden text-right text-sm font-medium tabular-nums sm:block">
                      ${variant.price || "0.00"}
                    </span>

                    {/* Stock */}
                    <span
                      className={`hidden text-right text-sm tabular-nums sm:block ${
                        stockNum === 0
                          ? "font-semibold text-destructive"
                          : stockNum <= 10
                            ? "font-medium text-orange-600 dark:text-orange-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {variant.stock || "0"}
                    </span>

                    {/* SKU */}
                    <span className="hidden truncate font-mono text-xs text-muted-foreground sm:block">
                      {variant.sku || "—"}
                    </span>

                    {/* Chevron */}
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Mobile summary */}
                  {!isExpanded && (
                    <div className="flex items-center gap-3 border-t border-dashed px-3 py-1.5 text-xs text-muted-foreground sm:hidden">
                      <span className="font-medium">${variant.price || "0.00"}</span>
                      <span className="text-muted-foreground/30">&middot;</span>
                      <span className={stockNum === 0 ? "text-destructive" : ""}>
                        {variant.stock || "0"} in stock
                      </span>
                      {variant.sku && (
                        <>
                          <span className="text-muted-foreground/30">&middot;</span>
                          <span className="font-mono">{variant.sku}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-4">
                      {/* Options selection */}
                      {variantFacetGroups.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Options</Label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {variantFacetGroups.map((group) => (
                              <div
                                key={group.id}
                                className="rounded-md border bg-muted/30 p-3 space-y-2"
                              >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {group.name}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.values.map((val) => {
                                    const isSelected = variant.facetValueIds.has(val.id);
                                    return (
                                      <label
                                        key={val.id}
                                        className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-all ${
                                          isSelected
                                            ? "border-primary/50 bg-primary/5 text-foreground shadow-sm"
                                            : "border-transparent bg-background text-muted-foreground hover:border-border hover:text-foreground"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            toggleVariantFacetValue(index, val.id)
                                          }
                                          className="size-3.5"
                                        />
                                        {val.value}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price / Stock / SKU */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
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
                        <div className="space-y-1.5">
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
                        <div className="space-y-1.5">
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
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => duplicateVariant(index)}
                          >
                            <Copy className="size-3" />
                            Duplicate
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="size-3" />
                            Remove
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => setExpandedIndex(null)}
                        >
                          Collapse
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="size-4" />
              <span>
                {variants.length} variant{variants.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Total stock:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
                </span>
              </span>
              <span>
                Price:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  ${Math.min(...variants.map((v) => Number(v.price) || 0)).toFixed(2)}
                  {" – $"}
                  {Math.max(...variants.map((v) => Number(v.price) || 0)).toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
