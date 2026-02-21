"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/actions/product";
import { saveProductVariants } from "@/actions/variant";
import { VariantManager, type VariantData } from "./variant-manager";
import {
  productFormSchema,
  type ProductFormValues,
  formValuesToProductInput,
} from "@/lib/validations/product-form";

type Category = {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
};

type Facet = {
  id: string;
  name: string;
  slug: string;
  values: {
    id: string;
    value: string;
    slug: string;
  }[];
};

type VariantFromDB = {
  id: string;
  sku: string | null;
  price: number;
  stock: number;
  facetValueIds: string[];
};

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId: string | null;
  facetValueIds: string[];
  variants?: VariantFromDB[];
};

type ProductFormProps = {
  categories: Category[];
  facets: Facet[];
  product?: ProductData;
};

export function ProductForm({ categories, facets, product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price?.toString() ?? "",
      comparePrice: product?.comparePrice?.toString() ?? "",
      sku: product?.sku ?? "",
      stock: product?.stock?.toString() ?? "0",
      categoryId: product?.categoryId ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  const isActive = watch("isActive");
  const categoryId = watch("categoryId");
  const price = watch("price");

  // These fields are managed outside RHF (dynamic arrays / Set-based)
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images : [""]
  );
  const [selectedFacetValues, setSelectedFacetValues] = useState<Set<string>>(
    new Set(product?.facetValueIds ?? [])
  );
  const [variants, setVariants] = useState<VariantData[]>(
    product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      price: v.price.toString(),
      stock: v.stock.toString(),
      facetValueIds: new Set(v.facetValueIds),
    })) ?? []
  );

  function addImage() {
    setImages([...images, ""]);
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function updateImage(index: number, value: string) {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  }

  function toggleFacetValue(valueId: string) {
    const next = new Set(selectedFacetValues);
    if (next.has(valueId)) {
      next.delete(valueId);
    } else {
      next.add(valueId);
    }
    setSelectedFacetValues(next);
  }

  async function onSubmit(values: ProductFormValues) {
    // Validate variants (outside RHF scope)
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.price || isNaN(Number(v.price)) || Number(v.price) < 0) {
        toast.error(`Variant ${i + 1}: Valid price is required`);
        return;
      }
      if (v.facetValueIds.size === 0) {
        toast.error(`Variant ${i + 1}: Select at least one option`);
        return;
      }
    }

    const data = formValuesToProductInput(
      values,
      images,
      Array.from(selectedFacetValues),
    );

    const result = isEditing
      ? await updateProduct(product.id, data)
      : await createProduct(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // Save variants if we have the product id
    const productId = isEditing
      ? product.id
      : (result.product as { id: string } | undefined)?.id;

    if (productId && variants.length > 0) {
      const variantData = variants.map((v) => ({
        sku: v.sku.trim() || undefined,
        price: Number(v.price),
        stock: Number(v.stock) || 0,
        facetValueIds: Array.from(v.facetValueIds),
      }));

      const variantResult = await saveProductVariants(productId, variantData);
      if (!variantResult.success) {
        toast.error(`Product saved, but variants failed: ${variantResult.error}`);
        return;
      }
    } else if (productId && variants.length === 0 && isEditing) {
      const variantResult = await saveProductVariants(productId, []);
      if (!variantResult.success) {
        toast.error(`Product saved, but clearing variants failed: ${variantResult.error}`);
        return;
      }
    }

    toast.success(isEditing ? "Product updated" : "Product created");
    router.push("/dashboard/products");
    router.refresh();
  }

  // Flatten categories for select
  const categoryOptions: { id: string; name: string; depth: number }[] = [];
  for (const cat of categories) {
    categoryOptions.push({ id: cat.id, name: cat.name, depth: 0 });
    if (cat.children) {
      for (const child of cat.children) {
        categoryOptions.push({ id: child.id, name: child.name, depth: 1 });
      }
    }
  }

  // Prepare facet groups for variant manager
  const facetGroups = facets.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    values: f.values.map((v) => ({ id: v.id, value: v.value })),
  }));

  const facetOptions = facets.flatMap((f) =>
    f.values.map((v) => ({
      id: v.id,
      value: v.value,
      facetId: f.id,
      facetName: f.name,
      facetSlug: f.slug,
    }))
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Product name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Product description"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>
            {variants.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This product has variants. The price below is the default/display price.
                Each variant can override it.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price")}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">Compare-at Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("comparePrice")}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Inventory</h2>
            {variants.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Stock is tracked per variant. The stock below is the default for simple display.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  {...register("stock")}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Images</h2>
            <p className="text-sm text-muted-foreground">
              Add image URLs for the product.
            </p>
            <div className="space-y-2">
              {images.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={img}
                    onChange={(e) => updateImage(i, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {images.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(i)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
              className="gap-1"
            >
              <Plus className="size-4" />
              Add Image
            </Button>
          </div>

          {/* Facets */}
          {facets.length > 0 && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Attributes</h2>
              <p className="text-sm text-muted-foreground">
                Select the attribute values that apply to this product (used for
                filtering &amp; SEO).
              </p>
              <div className="space-y-4">
                {facets.map((facet) => (
                  <div key={facet.id} className="space-y-2">
                    <Label className="text-sm font-medium">{facet.name}</Label>
                    <div className="flex flex-wrap gap-3">
                      {facet.values.map((val) => (
                        <label
                          key={val.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={selectedFacetValues.has(val.id)}
                            onCheckedChange={() => toggleFacetValue(val.id)}
                          />
                          {val.value}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {facets.length > 0 && (
            <VariantManager
              facetOptions={facetOptions}
              facetGroups={facetGroups}
              variants={variants}
              onChange={setVariants}
              basePrice={price}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Status</h2>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked === true)}
              />
              Active (visible in store)
            </label>
          </div>

          {/* Category */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Category</h2>
            <Select
              value={categoryId}
              onValueChange={(val) => setValue("categoryId", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.depth > 0 ? `— ${cat.name}` : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variant summary */}
          {variants.length > 0 && (
            <div className="rounded-lg border p-6 space-y-2">
              <h2 className="text-lg font-semibold">Variant Summary</h2>
              <p className="text-sm text-muted-foreground">
                {variants.length} variant{variants.length === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-muted-foreground">
                Total stock:{" "}
                {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Price range: $
                {Math.min(
                  ...variants.map((v) => Number(v.price) || 0)
                ).toFixed(2)}{" "}
                – $
                {Math.max(
                  ...variants.map((v) => Number(v.price) || 0)
                ).toFixed(2)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Update Product"
                  : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/products")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
