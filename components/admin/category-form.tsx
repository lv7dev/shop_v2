"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory, updateCategory } from "@/actions/category";

type CategoryOption = {
  id: string;
  name: string;
};

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    parentId: string | null;
  };
  parentCategories: CategoryOption[];
};

export function CategoryForm({
  category,
  parentCategories,
}: CategoryFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.categoryForm");
  const tc = useTranslations("admin.common");
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      parentId: parentId && parentId !== "none" ? parentId : undefined,
    };

    const result = isEditing
      ? await updateCategory(category.id, data)
      : await createCategory(data);

    if (result.success) {
      toast.success(isEditing ? t("categoryUpdated") : t("categoryCreated"));
      router.push("/dashboard/categories");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  const availableParents = parentCategories.filter(
    (p) => p.id !== category?.id
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cat-name">{t("name")}</Label>
        <Input
          id="cat-name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-desc">{t("description")}</Label>
        <Textarea
          id="cat-desc"
          placeholder={t("descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-image">{t("imageUrl")}</Label>
        <Input
          id="cat-image"
          placeholder="https://example.com/image.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("parentCategory")}</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger>
            <SelectValue placeholder={t("noneTopLevel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noneTopLevel")}</SelectItem>
            {availableParents.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/categories">{tc("cancel")}</Link>
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? tc("saving") : isEditing ? tc("update") : tc("create")}
        </Button>
      </div>
    </form>
  );
}
