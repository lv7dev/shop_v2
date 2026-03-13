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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDiscount, updateDiscount } from "@/actions/discount";

type ProductOption = {
  id: string;
  name: string;
};

type DiscountData = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  scope: "ORDER" | "PRODUCT";
  method: "AUTO" | "CODE";
  stackable: boolean;
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  productIds: string[];
};

type DiscountFormProps = {
  discount?: DiscountData;
  products: ProductOption[];
};

export function DiscountForm({
  discount,
  products,
}: DiscountFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.discountForm");
  const tc = useTranslations("admin.common");
  const [loading, setLoading] = useState(false);
  const isEditing = !!discount;

  const [code, setCode] = useState(discount?.code ?? "");
  const [description, setDescription] = useState(discount?.description ?? "");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(
    discount?.type ?? "PERCENTAGE"
  );
  const [scope, setScope] = useState<"ORDER" | "PRODUCT">(
    discount?.scope ?? "ORDER"
  );
  const [method, setMethod] = useState<"AUTO" | "CODE">(
    discount?.method ?? "CODE"
  );
  const [stackable, setStackable] = useState(discount?.stackable ?? false);
  const [value, setValue] = useState(discount?.value?.toString() ?? "");
  const [minOrder, setMinOrder] = useState(
    discount?.minOrder?.toString() ?? ""
  );
  const [maxUses, setMaxUses] = useState(
    discount?.maxUses?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(
    discount?.startsAt
      ? new Date(discount.startsAt).toISOString().slice(0, 16)
      : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    discount?.expiresAt
      ? new Date(discount.expiresAt).toISOString().slice(0, 16)
      : ""
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    discount?.productIds ?? []
  );

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value) return;

    setLoading(true);

    const data = {
      code: code.trim(),
      description: description.trim() || undefined,
      type,
      scope,
      method,
      stackable,
      value: parseFloat(value),
      minOrder: minOrder ? parseFloat(minOrder) : undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      productIds: scope === "PRODUCT" ? selectedProductIds : [],
    };

    const result = isEditing
      ? await updateDiscount(discount.id, data)
      : await createDiscount(data);

    if (result.success) {
      toast.success(isEditing ? t("discountUpdated") : t("discountCreated"));
      router.push("/dashboard/discounts");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="disc-code">{t("code")}</Label>
          <Input
            id="disc-code"
            placeholder={t("codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="disc-value">
            {t("value", { unit: type === "PERCENTAGE" ? "%" : "VND" })}
          </Label>
          <Input
            id="disc-value"
            type="number"
            step="0.01"
            min="0.01"
            max={type === "PERCENTAGE" ? "100" : undefined}
            placeholder={type === "PERCENTAGE" ? "e.g. 25" : "e.g. 10.00"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="disc-desc">{t("description")}</Label>
        <Textarea
          id="disc-desc"
          placeholder={t("descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{t("type")}</Label>
          <Select value={type} onValueChange={(v) => setType(v as "PERCENTAGE" | "FIXED")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">{t("typePercentage")}</SelectItem>
              <SelectItem value="FIXED">{t("typeFixed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("scope")}</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as "ORDER" | "PRODUCT")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ORDER">{t("scopeOrder")}</SelectItem>
              <SelectItem value="PRODUCT">{t("scopeProduct")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("method")}</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as "AUTO" | "CODE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CODE">{t("methodCode")}</SelectItem>
              <SelectItem value="AUTO">{t("methodAuto")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {scope === "PRODUCT" && (
        <div className="space-y-2">
          <Label>
            {t("products", { count: selectedProductIds.length })}
          </Label>
          <div className="max-h-48 overflow-y-auto rounded-md border p-2">
            {products.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">
                {t("noProducts")}
              </p>
            ) : (
              products.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedProductIds.includes(p.id)}
                    onCheckedChange={() => toggleProduct(p.id)}
                  />
                  <span className="line-clamp-1">{p.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="disc-min">{t("minOrder")}</Label>
          <Input
            id="disc-min"
            type="number"
            step="0.01"
            min="0"
            placeholder={t("noMinimum")}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="disc-max">{t("maxUses")}</Label>
          <Input
            id="disc-max"
            type="number"
            min="1"
            placeholder={t("unlimited")}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="disc-start">{t("startsAt")}</Label>
          <Input
            id="disc-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="disc-end">{t("expiresAt")}</Label>
          <Input
            id="disc-end"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={isActive}
            onCheckedChange={(v) => setIsActive(v === true)}
          />
          <span className="text-sm">{t("activeLabel")}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={stackable}
            onCheckedChange={(v) => setStackable(v === true)}
          />
          <span className="text-sm">{t("stackable")}</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/discounts">{tc("cancel")}</Link>
        </Button>
        <Button
          type="submit"
          disabled={loading || !code.trim() || !value}
        >
          {loading ? tc("saving") : isEditing ? tc("update") : tc("create")}
        </Button>
      </div>
    </form>
  );
}
