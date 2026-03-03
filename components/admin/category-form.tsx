"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      toast.success(isEditing ? "Category updated" : "Category created");
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
        <Label htmlFor="cat-name">Name</Label>
        <Input
          id="cat-name"
          placeholder="e.g. T-Shirts, Shoes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-image">Image URL</Label>
        <Input
          id="cat-image"
          placeholder="https://example.com/image.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Parent Category</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger>
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (top-level)</SelectItem>
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
          <Link href="/dashboard/categories">Cancel</Link>
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
