"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRef, useState } from "react";

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

const RESERVED_PARAMS = new Set(["category", "search", "page"]);

export function ProductFilters({ categories, facets = [] }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get active facet values from URL
  function getActiveFacetValues(facetSlug: string): Set<string> {
    const param = searchParams.get(facetSlug);
    return param ? new Set(param.split(",")) : new Set();
  }

  // Count active filters
  const activeFilterCount =
    (activeCategory ? 1 : 0) +
    (search ? 1 : 0) +
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
    router.push(qs ? `/products?${qs}` : "/products");
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

  function clearAllFilters() {
    router.push("/products");
    setMobileOpen(false);
  }

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

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="mb-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 px-1">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{filterContent}</aside>
    </>
  );
}
