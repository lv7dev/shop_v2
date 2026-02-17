"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFacet, updateFacet } from "@/actions/facet";
import { Plus, Pencil } from "lucide-react";

type FacetFormProps = {
  facet?: { id: string; name: string };
  trigger?: React.ReactNode;
};

export function FacetForm({ facet, trigger }: FacetFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(facet?.name ?? "");
  const isEditing = !!facet;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = isEditing
      ? await updateFacet(facet.id, { name: name.trim() })
      : await createFacet({ name: name.trim() });

    if (result.success) {
      toast.success(isEditing ? "Facet updated" : "Facet created");
      setOpen(false);
      if (!isEditing) setName("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Facet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Facet" : "Create Facet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the facet name."
              : "Create a new attribute facet (e.g. Size, Color, Brand)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facet-name">Name</Label>
            <Input
              id="facet-name"
              placeholder="e.g. Size, Color, Brand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FacetEditButton({ facet }: { facet: { id: string; name: string } }) {
  return (
    <FacetForm
      facet={facet}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-3.5" />
        </Button>
      }
    />
  );
}
