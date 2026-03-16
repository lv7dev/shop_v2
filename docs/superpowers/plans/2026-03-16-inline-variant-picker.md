# Inline Variant Picker & Quantity Stepper Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline variant selection and quantity stepper directly on every product card, so users can pick size/color and quantity without navigating to the detail page.

**Architecture:** Update Prisma listing queries to include full variant data (instead of just `_count`). Serialize variant data at each page/action boundary via a shared `serializeVariants()` helper. Build two new UI components (`QuantityStepper`, `CardVariantPicker`) and update existing `AddToCartButton` and `ProductCard`. Modify cart store's `addItem` to accept an optional quantity parameter.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, Prisma, Tailwind CSS, shadcn/ui, Vitest

**Spec:** `docs/superpowers/specs/2026-03-16-inline-variant-picker-design.md`

---

## Chunk 1: Cart Store & Shared Types

### Task 1: Add `CardVariant` type to `types/product.ts`

**Files:**
- Modify: `types/product.ts`

- [ ] **Step 1: Add the CardVariant type**

Add to the end of `types/product.ts`:

```ts
export type CardVariantOption = {
  facetId: string;
  facetName: string;
  facetValueId: string;
  facetValue: string;
};

export type CardVariant = {
  id: string;
  price: number;
  stock: number;
  options: CardVariantOption[];
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
git add types/product.ts
git commit -m "feat: add CardVariant type for inline variant picker"
```

---

### Task 2: Add `serializeVariants` helper in `lib/serialize.ts`

**Files:**
- Create: `lib/serialize.ts`

- [ ] **Step 1: Create the serializer**

Create `lib/serialize.ts`:

```ts
import type { CardVariant } from "@/types/product";

/**
 * Converts Prisma variant data (with nested options.facetValue.facet)
 * into the flat CardVariant[] shape for client transport.
 *
 * Reference shape: same include used by getProductBySlug() in services/products.ts:180-191
 */
export function serializeVariants(
  prismaVariants: {
    id: string;
    price: { toNumber?: () => number } | number;
    stock: number;
    options: {
      facetValue: {
        id: string;
        name: string;
        facet: { id: string; name: string };
      };
    }[];
  }[]
): CardVariant[] {
  return prismaVariants.map((v) => ({
    id: v.id,
    price: typeof v.price === "number" ? v.price : Number(v.price),
    stock: v.stock,
    options: v.options.map((o) => ({
      facetId: o.facetValue.facet.id,
      facetName: o.facetValue.facet.name,
      facetValueId: o.facetValue.id,
      facetValue: o.facetValue.name,
    })),
  }));
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/serialize.ts
git commit -m "feat: add serializeVariants helper for listing pages"
```

---

### Task 3: Update cart store `addItem` to accept optional quantity

**Files:**
- Modify: `store/cart-store.ts:27-83`
- Test: `tests/unit/cart-store.test.ts`

- [ ] **Step 1: Write failing tests for quantity parameter**

Add these tests inside the existing `describe("addItem")` block in `tests/unit/cart-store.test.ts`, after the existing tests (after line 77):

```ts
    it("adds a new item with custom quantity", () => {
      useCartStore.getState().addItem({ ...mockItem(), quantity: 3 });
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it("increments by custom quantity for existing item", () => {
      useCartStore.getState().addItem(mockItem());
      useCartStore.getState().addItem({ ...mockItem(), quantity: 4 });
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it("caps custom quantity at stock limit for new item", () => {
      useCartStore.getState().addItem({ ...mockItem({ stock: 3 }), quantity: 10 });
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it("caps custom quantity increment at stock limit", () => {
      const item = mockItem({ stock: 5 });
      useCartStore.getState().addItem(item); // qty = 1
      useCartStore.getState().addItem({ ...item, quantity: 10 }); // would be 11, capped at 5
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("defaults to quantity 1 when not specified (backward compat)", () => {
      useCartStore.getState().addItem(mockItem());
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/cart-store.test.ts 2>&1 | tail -30`
Expected: New tests fail — `addItem` ignores the `quantity` field, so "adds a new item with custom quantity" gets quantity 1 instead of 3.

- [ ] **Step 3: Update CartStore type and addItem implementation**

In `store/cart-store.ts`, change line 31:

```ts
// OLD
addItem: (item: Omit<CartItem, "quantity">) => void;
// NEW
addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
```

Then replace the `addItem` implementation (lines 52-83) with:

```ts
      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1;
          const key = cartItemKey(item);
          const existing = state.items.find(
            (i) => cartItemKey(i) === key
          );
          let newQuantity: number;

          if (existing) {
            newQuantity = Math.min(existing.quantity + qty, item.stock);
          } else {
            newQuantity = Math.min(qty, item.stock);
          }

          const newItems = existing
            ? state.items.map((i) =>
                cartItemKey(i) === key
                  ? { ...i, quantity: newQuantity }
                  : i
              )
            : [...state.items, { ...item, quantity: newQuantity }];

          if (state._isAuthenticated) {
            syncCartItemToDB(item.id, newQuantity, item.variantId).catch(
              () => {
                toast.error("Failed to sync cart. Please try again.");
              }
            );
          }

          return { items: newItems };
        }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/cart-store.test.ts 2>&1 | tail -30`
Expected: All tests pass (existing + new)

- [ ] **Step 5: Commit**

```bash
git add store/cart-store.ts tests/unit/cart-store.test.ts
git commit -m "feat: cart store addItem accepts optional quantity param"
```

---

## Chunk 2: Data Layer — Queries & Serialization

### Task 4: Update Prisma queries in `services/products.ts`

**Files:**
- Modify: `services/products.ts:77-79,148-151,219-225`

The variant include shape (copied from existing `getProductBySlug()` at lines 180-191):

```ts
variants: {
  include: {
    options: {
      include: {
        facetValue: {
          include: { facet: true },
        },
      },
    },
  },
}
```

- [ ] **Step 1: Update `getProducts()` — main query (line 151)**

Replace `_count: { select: { variants: true } }` with the full variants include:

```ts
// OLD (line 151)
include: { category: true, _count: { select: { variants: true } } },
// NEW
include: {
  category: true,
  variants: {
    include: {
      options: {
        include: {
          facetValue: {
            include: { facet: true },
          },
        },
      },
    },
  },
},
```

- [ ] **Step 2: Update `getProductsSortedByRating()` — second query (line 79)**

Same replacement at line 79:

```ts
// OLD (line 79)
include: { category: true, _count: { select: { variants: true } } },
// NEW
include: {
  category: true,
  variants: {
    include: {
      options: {
        include: {
          facetValue: {
            include: { facet: true },
          },
        },
      },
    },
  },
},
```

- [ ] **Step 3: Update `getRelatedProducts()` (line 225)**

Same replacement at line 225:

```ts
// OLD (line 225)
include: { category: true, _count: { select: { variants: true } } },
// NEW
include: {
  category: true,
  variants: {
    include: {
      options: {
        include: {
          facetValue: {
            include: { facet: true },
          },
        },
      },
    },
  },
},
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: May see errors in consuming files that reference `_count` — that's expected and will be fixed in following tasks.

- [ ] **Step 5: Commit**

```bash
git add services/products.ts
git commit -m "feat: include full variant data in listing product queries"
```

---

### Task 5: Update `actions/products.ts` serialization

**Files:**
- Modify: `actions/products.ts`

- [ ] **Step 1: Add import and update serialization**

Add import at top:

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace the serialization block (lines 24-37). The key change: remove `hasVariants` boolean, add `variants` array:

```ts
  const serialized = products.map((p) => {
    const cat = (p as typeof p & { category: { name: string; slug: string } | null }).category;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      images: p.images,
      stock: p.stock,
      category: cat ? { name: cat.name, slug: cat.slug } : null,
      activeDiscount: discountMap.get(p.id) ?? null,
      variants: serializeVariants((p as any).variants ?? []),
    };
  });
```

- [ ] **Step 2: Verify no TypeScript errors in this file**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "actions/products"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add actions/products.ts
git commit -m "feat: serialize full variant data in loadMoreProducts action"
```

---

### Task 6: Update `app/api/products/by-slugs/route.ts`

**Files:**
- Modify: `app/api/products/by-slugs/route.ts`

- [ ] **Step 1: Update query include and serialization**

Add import at top:

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace the include on line 14:

```ts
// OLD
include: { category: true, _count: { select: { variants: true } } },
// NEW
include: {
  category: true,
  variants: {
    include: {
      options: {
        include: {
          facetValue: {
            include: { facet: true },
          },
        },
      },
    },
  },
},
```

Update the serialization (lines 22-31) — replace `hasVariants` with `variants`:

```ts
    .map((p) => ({
      id: p!.id,
      name: p!.name,
      slug: p!.slug,
      price: Number(p!.price),
      images: p!.images,
      stock: p!.stock,
      category: p!.category ? { name: p!.category.name, slug: p!.category.slug } : null,
      variants: serializeVariants((p as any).variants ?? []),
    }));
```

- [ ] **Step 2: Commit**

```bash
git add 'app/api/products/by-slugs/route.ts'
git commit -m "feat: include variant data in by-slugs API response"
```

---

### Task 7: Update page-level serialization — products listing page

**Files:**
- Modify: `app/[locale]/(shop)/products/page.tsx:156-169`

- [ ] **Step 1: Add import and update serialization**

Add import at top (after existing imports):

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace the `initialProducts` mapping (lines 156-169). Replace `hasVariants` with `variants`:

```ts
                initialProducts={products.map((p) => {
                  const cat = (p as typeof p & { category: { name: string; slug: string } | null }).category;
                  return {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: Number(p.price),
                    images: p.images,
                    stock: p.stock,
                    category: cat ? { name: cat.name, slug: cat.slug } : null,
                    activeDiscount: discountMap.get(p.id) ?? null,
                    variants: serializeVariants((p as any).variants ?? []),
                  };
                })}
```

- [ ] **Step 2: Commit**

```bash
git add 'app/[locale]/(shop)/products/page.tsx'
git commit -m "feat: serialize variants for products listing page"
```

---

### Task 8: Update page-level serialization — home page

**Files:**
- Modify: `app/[locale]/(shop)/page.tsx:108-122`

- [ ] **Step 1: Add import and update ProductCard props**

Add import at top:

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace line 121 (`hasVariants=...`) with `variants`:

```ts
                  variants={serializeVariants((product as any).variants ?? [])}
```

Remove the `hasVariants` line entirely.

- [ ] **Step 2: Commit**

```bash
git add 'app/[locale]/(shop)/page.tsx'
git commit -m "feat: serialize variants for home page product cards"
```

---

### Task 9: Update page-level serialization — categories page

**Files:**
- Modify: `app/[locale]/(shop)/categories/[slug]/page.tsx:141-155`

- [ ] **Step 1: Add import and update ProductCard props**

Add import at top:

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace line 154 (`hasVariants=...`) with `variants`:

```ts
                  variants={serializeVariants((product as any).variants ?? [])}
```

Remove the `hasVariants` line entirely.

- [ ] **Step 2: Commit**

```bash
git add 'app/[locale]/(shop)/categories/[slug]/page.tsx'
git commit -m "feat: serialize variants for categories page product cards"
```

---

### Task 10: Update page-level serialization — product detail (related products)

**Files:**
- Modify: `app/[locale]/(shop)/products/[id]/page.tsx:492-504`

- [ ] **Step 1: Add import and update related product cards**

Add import at top:

```ts
import { serializeVariants } from "@/lib/serialize";
```

Replace line 503 (`hasVariants=...`) with `variants`:

```ts
                  variants={serializeVariants((rp as any).variants ?? [])}
```

Remove the `hasVariants` line entirely.

- [ ] **Step 2: Commit**

```bash
git add 'app/[locale]/(shop)/products/[id]/page.tsx'
git commit -m "feat: serialize variants for related product cards"
```

---

## Chunk 3: UI Components

### Task 11: Create `QuantityStepper` component

**Files:**
- Create: `components/products/quantity-stepper.tsx`

- [ ] **Step 1: Create the component**

Create `components/products/quantity-stepper.tsx`:

```tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (qty: number) => void;
  size?: "sm" | "default";
};

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  size = "sm",
}: QuantityStepperProps) {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(isSmall ? "size-7" : "size-8")}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={cn(isSmall ? "size-3" : "size-4")} />
      </Button>
      <span
        className={cn(
          "min-w-[2rem] text-center font-medium tabular-nums",
          isSmall ? "text-sm" : "text-base"
        )}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(isSmall ? "size-7" : "size-8")}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={cn(isSmall ? "size-3" : "size-4")} />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "quantity-stepper"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/products/quantity-stepper.tsx
git commit -m "feat: add shared QuantityStepper component"
```

---

### Task 12: Create `CardVariantPicker` component

**Files:**
- Create: `components/products/card-variant-picker.tsx`

- [ ] **Step 1: Create the component**

Create `components/products/card-variant-picker.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { cn, formatPrice } from "@/lib/utils";
import { QuantityStepper } from "./quantity-stepper";
import type { CardVariant } from "@/types/product";

type CardVariantPickerProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
  };
  variants: CardVariant[];
};

export function CardVariantPicker({ product, variants }: CardVariantPickerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

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

  // Pre-select first in-stock variant, or first variant if all out of stock
  const [selections, setSelections] = useState<Record<string, string>>(() => {
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
    setQuantity(1); // Reset quantity when changing variant
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
    const otherSelections = { ...selections, [facetId]: facetValueId };
    const otherValues = Object.entries(otherSelections);
    return variants.some((v) => {
      const optIds = new Set(v.options.map((o) => o.facetValueId));
      return otherValues.every(([, val]) => optIds.has(val));
    });
  }

  const allOutOfStock = variants.every((v) => v.stock === 0);
  const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = allOutOfStock || !selectedVariant || effectiveStock === 0;

  function handleAdd() {
    if (!selectedVariant || isOutOfStock) return;

    const variantLabel = selectedVariant.options
      .map((o) => `${o.facetName}: ${o.facetValue}`)
      .join(" / ");

    addItem({
      id: product.id,
      slug: product.slug,
      variantId: selectedVariant.id,
      name: product.name,
      variantLabel,
      price: effectivePrice,
      image: product.image,
      stock: effectiveStock,
      quantity,
    });

    setAdded(true);
    setQuantity(1);
    toast.success(t("product.addedToCart", { name: `${product.name} (${variantLabel})` }));
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-2">
      {/* Variant pills */}
      {facetGroups.map((group) => (
        <div key={group.facetId} className="flex flex-wrap gap-1">
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
                  "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
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
      ))}

      {/* Quantity stepper — only show when a valid in-stock variant is selected */}
      {!isOutOfStock && (
        <QuantityStepper
          value={quantity}
          max={effectiveStock}
          onChange={setQuantity}
          size="sm"
        />
      )}

      {/* Add to cart button */}
      <Button
        type="button"
        className="w-full"
        size="sm"
        onClick={handleAdd}
        disabled={isOutOfStock}
        variant={added ? "secondary" : "default"}
      >
        {isOutOfStock ? (
          t("product.outOfStock")
        ) : added ? (
          <>
            <Check className="size-3" />
            {t("product.added")}
          </>
        ) : (
          <>
            <ShoppingCart className="size-3" />
            {t("product.addToCart")} – {formatPrice(effectivePrice, locale)}
          </>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "card-variant-picker"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/products/card-variant-picker.tsx
git commit -m "feat: add CardVariantPicker component for inline variant selection"
```

---

### Task 13: Update `AddToCartButton` with quantity stepper

**Files:**
- Modify: `components/products/add-to-cart-button.tsx`

- [ ] **Step 1: Add QuantityStepper and quantity state**

Replace the full file content with:

```tsx
"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { QuantityStepper } from "./quantity-stepper";

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  size?: "sm" | "default";
};

export function AddToCartButton({ product, size = "sm" }: AddToCartButtonProps) {
  const t = useTranslations();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (product.stock === 0) {
    return (
      <Button type="button" className="w-full" disabled size={size === "sm" ? "sm" : "default"}>
        {t("product.outOfStock")}
      </Button>
    );
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, quantity });
    setAdded(true);
    setQuantity(1);
    toast.success(t("product.addedToCart", { name: product.name }));
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-2">
      <QuantityStepper
        value={quantity}
        max={product.stock}
        onChange={setQuantity}
        size={size}
      />
      <Button
        type="button"
        className="w-full"
        size={size === "sm" ? "sm" : "default"}
        onClick={handleAdd}
        variant={added ? "secondary" : "default"}
      >
        {added ? (
          <>
            <Check className="size-4" />
            {t("product.added")}
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" />
            {t("product.addToCart")}
          </>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "add-to-cart"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/products/add-to-cart-button.tsx
git commit -m "feat: add quantity stepper to AddToCartButton"
```

---

### Task 14: Update `ProductCard` — replace `hasVariants` with `variants`

**Files:**
- Modify: `components/products/product-card.tsx`

- [ ] **Step 1: Update the component**

Key changes to `components/products/product-card.tsx`:

1. Add imports:
```ts
import { CardVariantPicker } from "./card-variant-picker";
import type { CardVariant } from "@/types/product";
```

2. Remove the `Button` import (no longer needed — was used for "Select Options").

3. In `ProductCardProps`, replace `hasVariants?: boolean` with `variants?: CardVariant[]`.

4. In the component destructuring, replace `hasVariants` with `variants`.

5. Replace the price display (lines 106-108) to show range for variant products:
```tsx
        <div className="flex items-center gap-2">
          {variants && variants.length > 0 ? (() => {
            const prices = variants.map((v) => v.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return (
              <span className="text-lg font-bold">
                {min === max
                  ? formatPrice(min, locale)
                  : `${formatPrice(min, locale)} – ${formatPrice(max, locale)}`}
              </span>
            );
          })() : (
            <span className="text-lg font-bold">{formatPrice(price, locale)}</span>
          )}
        </div>
```

6. Update the stock overlay (line 77) — for variant products, compute total stock:
```tsx
          {(variants && variants.length > 0
            ? variants.reduce((sum, v) => sum + v.stock, 0) === 0
            : stock === 0) && (
```

7. Replace the `hasVariants` ternary (lines 115-126) with:
```tsx
        {variants && variants.length > 0 ? (
          <CardVariantPicker
            product={{ id, slug, name, price, image: images[0] ?? "" }}
            variants={variants}
          />
        ) : (
          <AddToCartButton
            product={{ id, slug, name, price, image: images[0] ?? "", stock }}
          />
        )}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "product-card"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/products/product-card.tsx
git commit -m "feat: ProductCard uses CardVariantPicker with price range"
```

---

## Chunk 4: Threading Data Through Consumer Components

### Task 15: Update `LoadMoreProducts` component

**Files:**
- Modify: `components/products/load-more-products.tsx`

- [ ] **Step 1: Update Product type and ProductCard props**

1. Add import:
```ts
import type { CardVariant } from "@/types/product";
```

2. In the `Product` type (lines 10-24), replace `hasVariants?: boolean` with `variants?: CardVariant[]`.

3. In the `ProductCard` rendering (line 83), replace `hasVariants={product.hasVariants}` with `variants={product.variants}`.

- [ ] **Step 2: Commit**

```bash
git add components/products/load-more-products.tsx
git commit -m "feat: thread variant data through LoadMoreProducts"
```

---

### Task 16: Update `RecentlyViewed` component

**Files:**
- Modify: `components/home/recently-viewed.tsx`

- [ ] **Step 1: Update Product type and ProductCard props**

1. Add import:
```ts
import type { CardVariant } from "@/types/product";
```

2. In the `Product` type (lines 8-17), replace `hasVariants?: boolean` with `variants?: CardVariant[]`.

3. In the `ProductCard` rendering (line 53), replace `hasVariants={product.hasVariants}` with `variants={product.variants}`.

- [ ] **Step 2: Commit**

```bash
git add components/home/recently-viewed.tsx
git commit -m "feat: thread variant data through RecentlyViewed"
```

---

## Chunk 5: Verification & Cleanup

### Task 17: TypeScript check and dev server verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | tail -30`
Expected: No errors (clean build)

- [ ] **Step 2: Start dev server and verify**

Run: `npm run dev`

Open the following pages and verify:
1. Home page (`/`) — product cards show variant pills for Cotton T-Shirt, quantity stepper for all others
2. Products page (`/products`) — same behavior with load-more working
3. Category page (`/categories/<slug>`) — variant cards work
4. Product detail page (`/products/cotton-t-shirt`) — related products show variant cards, main product AddToCartButton has quantity stepper

- [ ] **Step 3: Run all unit tests**

Run: `npx vitest run 2>&1 | tail -30`
Expected: All tests pass

- [ ] **Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: resolve any remaining issues from inline variant picker"
```
