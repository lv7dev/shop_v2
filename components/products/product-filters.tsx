"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  SlidersHorizontal,
  DollarSign,
  Tag,
  Layers,
  Palette,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useRef, useState, useTransition } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

type FacetValue = {
  id: string;
  value: string;
  slug: string;
  count: number;
};

type Facet = {
  id: string;
  name: string;
  slug: string;
  values: FacetValue[];
};

type ProductFiltersProps = {
  categories: Category[];
  facets?: Facet[];
};

const FACET_ICONS: Record<string, React.ElementType> = {
  color: Palette,
  brand: Tag,
  size: Layers,
};

export function ProductFilters({
  categories,
  facets = [],
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  // Get active facet values from URL
  function getActiveFacetValues(facetSlug: string): Set<string> {
    const param = searchParams.get(facetSlug);
    return param ? new Set(param.split(",")) : new Set();
  }

  // Count active filters
  const activeFilterCount =
    (activeCategory ? 1 : 0) +
    (search ? 1 : 0) +
    (currentMinPrice || currentMaxPrice ? 1 : 0) +
    facets.reduce((acc, f) => acc + getActiveFacetValues(f.slug).size, 0);

  function navigate(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : "/products");
    });
    setMobileOpen(false);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("search") as string;
    navigate({ search: q || null });
  }

  function clearSearch() {
    navigate({ search: null });
    if (formRef.current) {
      formRef.current.reset();
    }
  }

  function toggleFacetValue(facetSlug: string, valueSlug: string) {
    const active = getActiveFacetValues(facetSlug);
    if (active.has(valueSlug)) {
      active.delete(valueSlug);
    } else {
      active.add(valueSlug);
    }
    const value = active.size > 0 ? Array.from(active).join(",") : null;
    navigate({ [facetSlug]: value });
  }

  function handlePriceFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  }

  function clearPriceFilter() {
    setMinPrice("");
    setMaxPrice("");
    navigate({ minPrice: null, maxPrice: null });
  }

  function clearAllFilters() {
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => {
      router.push("/products");
    });
    setMobileOpen(false);
  }

  /* ─── Desktop filter content ─────────────────────── */
  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Search
        </h3>
        <form ref={formRef} onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search products..."
            defaultValue={search}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </form>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range
        </h3>
        <form onSubmit={handlePriceFilter} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="pl-7 text-sm"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="pl-7 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Apply
            </Button>
            {(currentMinPrice || currentMaxPrice) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearPriceFilter}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => navigate({ category: null })}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                !activeCategory
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-accent"
              }`}
            >
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => navigate({ category: cat.slug })}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent"
                }`}
              >
                {cat.name}
              </button>
              {cat.children && cat.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() => navigate({ category: child.slug })}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                          activeCategory === child.slug
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Facet filters */}
      {facets.map((facet) => {
        const activeValues = getActiveFacetValues(facet.slug);
        return (
          <div key={facet.id}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {facet.name}
            </h3>
            <div className="space-y-2">
              {facet.values.map((val) => (
                <label
                  key={val.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <Checkbox
                    checked={activeValues.has(val.slug)}
                    onCheckedChange={() =>
                      toggleFacetValue(facet.slug, val.slug)
                    }
                  />
                  <span className="flex-1">{val.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({val.count})
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={clearAllFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  /* ─── Mobile filter sidebar (improved) ──────────── */
  const mobileFilterContent = (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {activeCategory && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {activeCategory.replace(/-/g, " ")}
                <button onClick={() => navigate({ category: null })}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="gap-1 text-xs">
                &ldquo;{search}&rdquo;
                <button onClick={clearSearch}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {(currentMinPrice || currentMaxPrice) && (
              <Badge variant="secondary" className="gap-1 text-xs">
                ${currentMinPrice || "0"} – ${currentMaxPrice || "∞"}
                <button onClick={clearPriceFilter}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {facets.map((f) => {
              const active = getActiveFacetValues(f.slug);
              return Array.from(active).map((v) => (
                <Badge
                  key={`${f.slug}-${v}`}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  {v}
                  <button onClick={() => toggleFacetValue(f.slug, v)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ));
            })}
          </div>
        </div>
      )}

      <div className="space-y-5 p-4">
        {/* Search */}
        <div>
          <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Search className="size-3.5" />
            Search
          </h3>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search products..."
              defaultValue={search}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </form>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="size-3.5" />
            Price Range
          </h3>
          <form onSubmit={handlePriceFilter} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="pl-7 text-sm"
                />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pl-7 text-sm"
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full">
              Apply Price
            </Button>
          </form>
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            Categories
          </h3>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => navigate({ category: null })}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent"
                }`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => navigate({ category: cat.slug })}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeCategory === cat.slug
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent"
                  }`}
                >
                  {cat.name}
                </button>
                {cat.children && cat.children.length > 0 && (
                  <ul className="ml-3 mt-0.5 space-y-0.5">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => navigate({ category: child.slug })}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                            activeCategory === child.slug
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Facet filters */}
        {facets.map((facet) => {
          const activeValues = getActiveFacetValues(facet.slug);
          const FacetIcon = FACET_ICONS[facet.slug] ?? Tag;
          return (
            <div key={facet.id}>
              <Separator className="mb-5" />
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FacetIcon className="size-3.5" />
                {facet.name}
              </h3>
              <div className="space-y-1">
                {facet.values.map((val) => (
                  <label
                    key={val.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      checked={activeValues.has(val.slug)}
                      onCheckedChange={() =>
                        toggleFacetValue(facet.slug, val.slug)
                      }
                    />
                    <span className="flex-1">{val.value}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {val.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="mb-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SlidersHorizontal className="size-4" />
              )}
              Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-80 flex-col p-0">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFilterCount} active
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            {mobileFilterContent}

            {activeFilterCount > 0 && (
              <SheetFooter className="border-t px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        {isPending && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Updating results...</span>
          </div>
        )}
        {filterContent}
      </aside>
    </>
  );
}
