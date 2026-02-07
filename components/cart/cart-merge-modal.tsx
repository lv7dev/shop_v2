"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

type CartMergeModalProps = {
  open: boolean;
  localItemCount: number;
  dbItemCount: number;
  onMerge: () => Promise<void>;
  onKeepDb: () => Promise<void>;
};

export function CartMergeModal({
  open,
  localItemCount,
  dbItemCount,
  onMerge,
  onKeepDb,
}: CartMergeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleMerge() {
    setLoading(true);
    await onMerge();
  }

  async function handleKeepDb() {
    setLoading(true);
    await onKeepDb();
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            You have items in your cart
          </DialogTitle>
          <DialogDescription className="text-center">
            You have {localItemCount} item{localItemCount !== 1 ? "s" : ""} in
            your current cart and {dbItemCount} item
            {dbItemCount !== 1 ? "s" : ""} saved from before. What would you
            like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleMerge}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Merge Carts"
            )}
          </Button>
          <Button
            onClick={handleKeepDb}
            disabled={loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Keep Saved Cart Only
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
