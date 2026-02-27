"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAddress, setDefaultAddress } from "@/actions/address";
import { AddressFormDialog } from "./address-form-dialog";

type Address = {
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

type AddressCardProps = {
  address: Address;
};

export function AddressCard({ address }: AddressCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAddress(address.id);
    if (result.success) {
      toast.success("Address deleted");
      setConfirmOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setDeleting(false);
  }

  async function handleSetDefault() {
    setSettingDefault(true);
    const result = await setDefaultAddress(address.id);
    if (result.success) {
      toast.success("Default address updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setSettingDefault(false);
  }

  return (
    <div className="relative rounded-lg border p-4">
      {address.isDefault && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Star className="size-3 fill-current" />
          Default
        </span>
      )}

      <div className="mb-3 flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium">{address.name}</p>
          {address.phone && (
            <p className="text-sm text-muted-foreground">{address.phone}</p>
          )}
        </div>
      </div>

      <div className="ml-6 text-sm text-muted-foreground">
        <p>{address.street}</p>
        <p>
          {address.city}, {address.state} {address.zipCode}
        </p>
        <p>{address.country}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {!address.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSetDefault}
            disabled={settingDefault}
          >
            <Star className="size-3" />
            {settingDefault ? "Setting..." : "Set Default"}
          </Button>
        )}

        <AddressFormDialog
          address={address}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Pencil className="size-3" />
              Edit
            </Button>
          }
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-3" />
          Delete
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
