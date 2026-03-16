# Inline Variant Picker & Quantity Stepper on Product Cards

## Problem

Products with variants (size, color) currently show a "Select Options" button that links to the detail page. Users cannot choose variants or quantity from the product listing. Products without variants lack a quantity picker — they can only add 1 at a time.

## Solution

Add inline variant selection and quantity stepper directly on every product card.

## Data Flow

### Current

Listing queries fetch `_count: { select: { variants: true } }` — only a boolean flag. Cards receive `hasVariants?: boolean`.

### New

Listing queries fetch full variant data with options/facets. Cards receive:

```ts
// Defined in types/product.ts (new file)
type CardVariant = {
  id: string;
  price: number;
  stock: number;
  options: {
    facetId: string;
    facetName: string;
    facetValueId: string;
    facetValue: string;
  }[];
};
```

Note: `sku` is intentionally excluded — not needed on listing cards.

### Queries to update

| Location | Current include | New include |
|----------|----------------|-------------|
| `services/products.ts` `getProducts()` | `_count: { select: { variants: true } }` | Full `variants` with `options.facetValue.facet` |
| `services/products.ts` `getProductsSortedByRating()` | Same | Same |
| `services/products.ts` `getRelatedProducts()` | Same | Same |
| `app/api/products/by-slugs/route.ts` | Same | Same |

### Variant include shape (Prisma)

Reference: `getProductBySlug()` already includes this shape. Listing queries adopt the same include:

```ts
variants: {
  include: {
    options: {
      include: {
        facetValue: {
          include: { facet: true }
        }
      }
    }
  }
}
```

### Serialization

All serialization points map Prisma variant data into `CardVariant[]`:

```ts
// Shared serializer (in types/product.ts or utils)
function serializeVariants(prismaVariants): CardVariant[] {
  return prismaVariants.map(v => ({
    id: v.id,
    price: Number(v.price), // Decimal → number
    stock: v.stock,
    options: v.options.map(o => ({
      facetId: o.facetValue.facet.id,
      facetName: o.facetValue.facet.name,
      facetValueId: o.facetValue.id,
      facetValue: o.facetValue.name,
    })),
  }));
}
```

Serialization locations:
- `actions/products.ts` — `loadMoreProducts()`
- `app/[locale]/(shop)/products/page.tsx` — products listing
- `app/[locale]/(shop)/page.tsx` — home page
- `app/[locale]/(shop)/categories/[slug]/page.tsx` — categories page
- `app/[locale]/(shop)/products/[id]/page.tsx` — related products
- `app/api/products/by-slugs/route.ts` — recently viewed API

## New Shared Component: `QuantityStepper`

File: `components/products/quantity-stepper.tsx`

Extracted as a shared component used by both `CardVariantPicker` and `AddToCartButton`.

```ts
type QuantityStepperProps = {
  value: number;
  min?: number; // default 1
  max: number;  // stock limit
  onChange: (qty: number) => void;
  size?: "sm" | "default"; // "sm" for card, "default" for detail page
};
```

Renders `[−] qty [+]` with min/max clamping. Buttons have `aria-label="Decrease quantity"` / `aria-label="Increase quantity"`.

## New Component: `CardVariantPicker`

File: `components/products/card-variant-picker.tsx`

### Props

```ts
type CardVariantPickerProps = {
  product: { id: string; slug: string; name: string; price: number; image: string };
  variants: CardVariant[];
};
```

### Behavior

- Extracts facet groups from variants (same logic as detail page `VariantPicker`)
- Pre-selects first in-stock variant; if ALL variants are out of stock, pre-selects the first variant and shows disabled "Out of Stock" button
- Renders compact pill buttons per facet (no labels — just values like `S`, `M`, `Black`)
- Shows `QuantityStepper` component
- Shows "Add to Cart – $price" button with selected variant's price
- Disables unavailable combinations (line-through styling)
- On add: calls `addItem()` with `variantId`, `variantLabel`, correct price/stock, and chosen quantity

### Edge cases

- **All variants out of stock**: Show variant pills (all disabled with line-through), hide quantity stepper, show disabled "Out of Stock" button
- **Single variant**: Still show pills (e.g., just `[M]` selected) so variant label is visible
- **No matching variant for selection**: Show "Unavailable" text, disable add button

### Layout (compact)

```
[S] [M] [L] [XL]
[Black] [White] [Navy]
[−] [1] [+]
[  Add to Cart – $25.00  ]
```

Pills use smaller sizing than detail page (`px-2 py-1 text-xs`).

## Updated `ProductCard` Layout

### Products WITH variants

```
[Image]
[Category]
[Product Name]
[$25.00 – $29.00]           ← price range
<CardVariantPicker />       ← variant pills + qty + add button
```

Replace `hasVariants` boolean prop with `variants?: CardVariant[]`. Price display: `ProductCard` computes min/max from the `variants` array client-side and shows range when they differ, single price when equal.

**Stock overlay**: For products with variants, compute total stock as `variants.reduce((sum, v) => sum + v.stock, 0)`. Show the out-of-stock overlay only when total variant stock is 0.

### Products WITHOUT variants

```
[Image]
[Category]
[Product Name]
[$90.00]
[−] [1] [+]                ← quantity stepper
[  Add to Cart  ]
```

## Updated `AddToCartButton`

Add quantity stepper for non-variant products:
- Internal `quantity` state (default 1)
- Render `QuantityStepper` above the button
- Pass quantity to `addItem()`
- Reset quantity to 1 after successful add
- Add optional `size` prop (`"sm" | "default"`, default `"sm"` for cards) forwarded to `QuantityStepper`
- Detail page usage at `products/[id]/page.tsx` can pass `size="default"`

## Cart Store Change

`addItem` currently hardcodes quantity to 1 for new items and increments by 1 for existing. Change signature:

```ts
addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
```

Update both the `CartStore` type definition (`addItem` field) and the implementation.

### Exact logic (immutable pattern matching existing store)

```ts
addItem: (item) =>
  set((state) => {
    const qty = item.quantity ?? 1;
    const key = cartItemKey(item);
    const existing = state.items.find((i) => cartItemKey(i) === key);
    let newQuantity: number;

    if (existing) {
      newQuantity = Math.min(existing.quantity + qty, item.stock);
    } else {
      newQuantity = Math.min(qty, item.stock);
    }

    const newItems = existing
      ? state.items.map((i) =>
          cartItemKey(i) === key ? { ...i, quantity: newQuantity } : i
        )
      : [...state.items, { ...item, quantity: newQuantity }];

    if (state._isAuthenticated) {
      syncCartItemToDB(item.id, newQuantity, item.variantId).catch(() => {
        toast.error("Failed to sync cart. Please try again.");
      });
    }

    return { items: newItems };
  }),
```

**Backward compatibility**: All existing `addItem()` callers pass no `quantity` field, so they default to `1` — same behavior as before. No caller changes needed except the new components that pass explicit quantities.

`syncCartItemToDB` already receives the final quantity value (not a delta), so its implementation doesn't change.

## i18n Keys

No new translation keys needed. Existing keys used:
- `product.addToCart`, `product.outOfStock`, `product.added`, `product.addedToCart`

The `CardVariantPicker` reuses the same `product.*` namespace.

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `types/product.ts` | NEW | Shared `CardVariant` type |
| `lib/serialize.ts` | NEW | `serializeVariants()` helper (keeps type files pure) |
| `components/products/quantity-stepper.tsx` | NEW | Shared quantity stepper component |
| `components/products/card-variant-picker.tsx` | NEW | Compact variant picker for cards |
| `store/cart-store.ts` | EDIT | `addItem` accepts optional `quantity` param |
| `services/products.ts` | EDIT | Include full variants in listing queries |
| `actions/products.ts` | EDIT | Serialize variants in loadMoreProducts |
| `components/products/product-card.tsx` | EDIT | Use CardVariantPicker, show price range |
| `components/products/add-to-cart-button.tsx` | EDIT | Add QuantityStepper |
| `components/products/load-more-products.tsx` | EDIT | Change `Product` type: `hasVariants` → `variants?: CardVariant[]`, pass to cards |
| `components/home/recently-viewed.tsx` | EDIT | Change `Product` type: `hasVariants` → `variants?: CardVariant[]`, pass to cards |
| `app/[locale]/(shop)/products/page.tsx` | EDIT | Serialize variants for listing |
| `app/[locale]/(shop)/page.tsx` | EDIT | Serialize variants for home |
| `app/[locale]/(shop)/categories/[slug]/page.tsx` | EDIT | Serialize variants for categories |
| `app/[locale]/(shop)/products/[id]/page.tsx` | EDIT | Serialize variants for related products |
| `app/api/products/by-slugs/route.ts` | EDIT | Include variants in API response |
| `tests/unit/cart-store.test.ts` | EDIT | Update addItem tests for quantity param |

## Notes

- **Cart storage version**: No version bump needed. The `addItem` change is backward-compatible — existing stored cart items are unaffected since `quantity` is already on `CartItem`, not the input type.
- **Event propagation**: `CardVariantPicker` is rendered inside `CardContent` which is NOT inside a `<Link>`, so no `e.stopPropagation()` needed for variant pills or quantity buttons. The existing `AddToCartButton` already handles its own event propagation.
- **`serializeVariants` placement**: Put in `lib/serialize.ts` (new) rather than `types/product.ts` to keep type files pure. The `CardVariant` type stays in `types/product.ts`.

## Performance Consideration

Including full variant data in listing queries increases payload size. For this shop's scale (20 products, max ~12 variants per product), this is negligible. If product count grows significantly, consider lazy-loading variants per card on hover/interaction.
