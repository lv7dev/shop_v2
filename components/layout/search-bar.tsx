"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, FolderOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

type ProductResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string | null;
};

type CategoryResult = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type SearchResults = {
  products: ProductResult[];
  categories: CategoryResult[];
};

export function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Total navigable items for keyboard nav
  const totalItems =
    (results?.products.length ?? 0) +
    (results?.categories.length ?? 0) +
    (query.length >= 2 ? 1 : 0); // +1 for "View all results"

  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (value.length < 2) {
      setResults(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  // Debounced search
  useEffect(() => {
    if (query.length < 2) return;

    const timer = setTimeout(() => {
      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: SearchResults) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, close]);

  // "/" keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !isOpen &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        e.preventDefault();
        open();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open]);

  function navigateToSearch() {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      close();
    }
  }

  function navigateToProduct(slug: string) {
    router.push(`/products/${slug}`);
    close();
  }

  function navigateToCategory(slug: string) {
    router.push(`/products?category=${slug}`);
    close();
  }

  // Get item at index for keyboard navigation
  const getItemAtIndex = useCallback(
    (index: number) => {
      if (!results) return null;
      const productCount = results.products.length;
      const categoryCount = results.categories.length;

      if (index < productCount) {
        return { type: "product" as const, item: results.products[index] };
      }
      if (index < productCount + categoryCount) {
        return {
          type: "category" as const,
          item: results.categories[index - productCount],
        };
      }
      if (index === productCount + categoryCount) {
        return { type: "viewAll" as const, item: null };
      }
      return null;
    },
    [results]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "Enter") {
      if (activeIndex >= 0) {
        const active = getItemAtIndex(activeIndex);
        if (active?.type === "product") {
          navigateToProduct(active.item.slug);
        } else if (active?.type === "category") {
          navigateToCategory(active.item.slug);
        } else if (active?.type === "viewAll") {
          navigateToSearch();
        }
      } else {
        navigateToSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }
  }

  const hasResults =
    results &&
    (results.products.length > 0 || results.categories.length > 0);
  const showDropdown = isOpen && query.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger (collapsed) */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={open}
          className="md:hidden"
          aria-label="Open search"
        >
          <Search className="size-5" />
        </Button>
      )}

      {/* Desktop: always show compact search */}
      {!isOpen && (
        <button
          onClick={open}
          className="hidden items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="size-4" />
          <span>Search...</span>
          <kbd className="ml-4 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </button>
      )}

      {/* Expanded search input + dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={close} />

          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-50 bg-background p-4 shadow-lg md:absolute md:inset-auto md:right-0 md:top-auto md:mt-0 md:w-[420px] md:rounded-lg md:border md:p-0 md:shadow-xl"
            )}
          >
            {/* Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground md:left-4" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, categories..."
                className="w-full bg-transparent py-3 pl-10 pr-10 text-sm outline-none md:py-3.5 md:pl-11 md:pr-11"
                autoComplete="off"
              />
              {loading && (
                <Loader2 className="absolute right-10 size-4 animate-spin text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="absolute right-1 size-8"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Results dropdown */}
            {showDropdown && (
              <div className="max-h-[60vh] overflow-y-auto border-t md:max-h-[400px]">
                {hasResults ? (
                  <div>
                    {/* Products section */}
                    {results.products.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Products
                        </p>
                        {results.products.map((product, i) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => navigateToProduct(product.slug)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent",
                              activeIndex === i && "bg-accent"
                            )}
                          >
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Search className="size-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {product.name}
                              </p>
                              {product.category && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {product.category}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 text-sm font-semibold">
                              {formatPrice(product.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Categories section */}
                    {results.categories.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Categories
                        </p>
                        {results.categories.map((category, i) => {
                          const idx = results.products.length + i;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                navigateToCategory(category.slug)
                              }
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent",
                                activeIndex === idx && "bg-accent"
                              )}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                <FolderOpen className="size-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {category.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {category.productCount} product
                                  {category.productCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* View all results */}
                    {query.trim() && (
                      <>
                        <div className="mx-4 border-t" />
                        <button
                          type="button"
                          onClick={navigateToSearch}
                          onMouseEnter={() =>
                            setActiveIndex(
                              results.products.length +
                                results.categories.length
                            )
                          }
                          className={cn(
                            "flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent",
                            activeIndex ===
                              results.products.length +
                                results.categories.length && "bg-accent"
                          )}
                        >
                          <Search className="size-4" />
                          Search for &ldquo;{query.trim()}&rdquo;
                          <ArrowRight className="ml-auto size-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : !loading ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="mx-auto mb-2 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}