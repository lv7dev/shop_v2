"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEMS_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/constants";

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
  const router = useRouter();
  const urlParams = useSearchParams();
  const currentPerPage = Number(urlParams.get("perPage")) || ITEMS_PER_PAGE;
  const [isPending, startTransition] = useTransition();

  function handlePerPageChange(value: string) {
    const next = new URLSearchParams(urlParams.toString());
    next.delete("page");
    if (value === String(ITEMS_PER_PAGE)) {
      next.delete("perPage");
    } else {
      next.set("perPage", value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  function handlePageClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  }

  const pages: (number | "...")[] = [];
  if (totalPages > 1) {
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
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-8 sm:flex-row sm:justify-between">
      {/* Per-page selector */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Select value={String(currentPerPage)} onValueChange={handlePerPageChange}>
          <SelectTrigger className="h-8 w-[70px]" disabled={isPending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
        {isPending && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1 || isPending}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link
                href={buildHref(basePath, searchParams, currentPage - 1)}
                aria-label="Previous page"
                onClick={(e) =>
                  handlePageClick(e, buildHref(basePath, searchParams, currentPage - 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Link>
            ) : (
              <span>
                <ChevronLeft className="size-4" />
              </span>
            )}
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
                disabled={isPending}
                asChild
              >
                <Link
                  href={buildHref(basePath, searchParams, p)}
                  onClick={(e) =>
                    handlePageClick(e, buildHref(basePath, searchParams, p))
                  }
                >
                  {p}
                </Link>
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages || isPending}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link
                href={buildHref(basePath, searchParams, currentPage + 1)}
                aria-label="Next page"
                onClick={(e) =>
                  handlePageClick(
                    e,
                    buildHref(basePath, searchParams, currentPage + 1)
                  )
                }
              >
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span>
                <ChevronRight className="size-4" />
              </span>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
