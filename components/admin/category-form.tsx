"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  trigger?: React.ReactNode;
};

export function CategoryForm({
  category,
  parentCategories,
  trigger,
}: CategoryFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      if (!isEditing) {
        setName("");
        setDescription("");
        setImage("");
        setParentId("");
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  // Filter out current category from parent options to prevent self-reference
  const availableParents = parentCategories.filter(
    (p) => p.id !== category?.id
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details."
              : "Create a new product category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={2}
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

export function CategoryEditButton({
  category,
  parentCategories,
}: {
  category: CategoryFormProps["category"] & {};
  parentCategories: CategoryOption[];
}) {
  return (
    <CategoryForm
      category={category}
      parentCategories={parentCategories}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-3.5" />
        </Button>
      }
    />
  );
}
