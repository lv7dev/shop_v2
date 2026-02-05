"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 pt-8">
      <Button variant="outline" size="icon" asChild disabled={currentPage <= 1}>
        <Link
          href={buildHref(basePath, searchParams, currentPage - 1)}
          aria-label="Previous page"
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronLeft className="size-4" />
        </Link>
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="icon"
            asChild
          >
            <Link href={buildHref(basePath, searchParams, p)}>{p}</Link>
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link
          href={buildHref(basePath, searchParams, currentPage + 1)}
          aria-label="Next page"
          className={
            currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
          }
        >
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </nav>
  );
}
