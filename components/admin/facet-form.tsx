"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFacet, updateFacet } from "@/actions/facet";

type FacetFormProps = {
  facet?: { id: string; name: string };
};

export function FacetForm({ facet }: FacetFormProps) {
  const router = useRouter();
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
      router.push("/dashboard/facets");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/facets">Cancel</Link>
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
