"use client";

import { MapPin } from "lucide-react";
import { AddressCard } from "./address-card";
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

type AddressListProps = {
  addresses: Address[];
};

export function AddressList({ addresses }: AddressListProps) {
  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Addresses</h2>
        <AddressFormDialog />
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No saved addresses yet. Add one to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
