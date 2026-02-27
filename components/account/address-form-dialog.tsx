"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const isDefault = watch("isDefault");

  async function onSubmit(values: AddressInput) {
    const result = isEditing
      ? await updateAddress(address.id, values)
      : await createAddress(values);

    if (result.success) {
      toast.success(isEditing ? "Address updated" : "Address added");
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
            Add Address
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your shipping address."
              : "Add a new shipping address to your account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr-name">Full Name *</Label>
              <Input
                id="addr-name"
                {...register("name")}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-phone">Phone</Label>
              <Input
                id="addr-phone"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addr-street">Street Address *</Label>
            <Input
              id="addr-street"
              {...register("street")}
              placeholder="123 Main St"
            />
            {errors.street && (
              <p className="text-sm text-destructive">
                {errors.street.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="addr-city">City *</Label>
              <Input
                id="addr-city"
                {...register("city")}
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">State *</Label>
              <Input
                id="addr-state"
                {...register("state")}
                placeholder="NY"
              />
              {errors.state && (
                <p className="text-sm text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-zip">ZIP Code *</Label>
              <Input
                id="addr-zip"
                {...register("zipCode")}
                placeholder="10001"
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">
                  {errors.zipCode.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addr-country">Country *</Label>
            <Input
              id="addr-country"
              {...register("country")}
              placeholder="United States"
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
              Set as default address
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Add Address"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
