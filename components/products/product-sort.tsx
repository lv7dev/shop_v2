"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SORT_OPTIONS } from "@/services/products";

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSort = searchParams.get("sort") ?? "newest";
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Newest";

  function handleSelect(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      next.delete("sort");
    } else {
      next.set("sort", value);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : "/products");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 px-3 font-normal"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="sm:hidden">Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className="flex cursor-pointer items-center justify-between"
          >
            {opt.label}
            {currentSort === opt.value && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
