"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin.facetForm");
  const tc = useTranslations("admin.common");
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
      toast.success(isEditing ? t("facetUpdated") : t("facetCreated"));
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
        <Label htmlFor="facet-name">{t("name")}</Label>
        <Input
          id="facet-name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/facets">{tc("cancel")}</Link>
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? tc("saving") : isEditing ? tc("update") : tc("create")}
        </Button>
      </div>
    </form>
  );
}
