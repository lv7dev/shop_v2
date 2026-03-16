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
