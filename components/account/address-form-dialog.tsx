"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAddress, updateAddress } from "@/actions/address";
import { addressSchema, type AddressInput } from "@/lib/validations/address";

type AddressData = {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
};

type AddressFormDialogProps = {
  address?: AddressData;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function AddressFormDialog({
  address,
  trigger,
  onSuccess,
}: AddressFormDialogProps) {
  const router = useRouter();
  const t = useTranslations("account.address");
  const [open, setOpen] = useState(false);
  const isEditing = !!address;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: address?.name ?? "",
      phone: address?.phone ?? "",
      street: address?.street ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      zipCode: address?.zipCode ?? "",
      country: address?.country ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is not yet compatible with React Compiler
  const isDefault = watch("isDefault");

  async function onSubmit(values: AddressInput) {
    const result = isEditing
      ? await updateAddress(address.id, values)
      : await createAddress(values);

    if (result.success) {
      toast.success(isEditing ? t("updated") : t("added"));
      setOpen(false);
      if (!isEditing) reset();
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t("addAddress")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editAddress") : t("addNewAddress")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("editDesc") : t("addDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr-name">{t("fullName")}</Label>
              <Input
                id="addr-name"
                {...register("name")}
                placeholder={t("namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-phone">{t("phone")}</Label>
              <Input
                id="addr-phone"
                {...register("phone")}
                placeholder={t("phonePlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addr-street">{t("streetAddress")}</Label>
            <Input
              id="addr-street"
              {...register("street")}
              placeholder={t("streetPlaceholder")}
            />
            {errors.street && (
              <p className="text-sm text-destructive">
                {errors.street.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="addr-city">{t("city")}</Label>
              <Input
                id="addr-city"
                {...register("city")}
                placeholder={t("cityPlaceholder")}
              />
              {errors.city && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">{t("state")}</Label>
              <Input
                id="addr-state"
                {...register("state")}
                placeholder={t("statePlaceholder")}
              />
              {errors.state && (
                <p className="text-sm text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-zip">{t("zipCode")}</Label>
              <Input
                id="addr-zip"
                {...register("zipCode")}
                placeholder={t("zipPlaceholder")}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">
                  {errors.zipCode.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addr-country">{t("country")}</Label>
            <Input
              id="addr-country"
              {...register("country")}
              placeholder={t("countryPlaceholder")}
            />
            {errors.country && (
              <p className="text-sm text-destructive">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="addr-default"
              checked={isDefault}
              onCheckedChange={(checked) =>
                setValue("isDefault", checked === true)
              }
            />
            <Label htmlFor="addr-default" className="cursor-pointer text-sm">
              {t("setAsDefault")}
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : isEditing ? (
                t("update")
              ) : (
                t("addAddress")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
