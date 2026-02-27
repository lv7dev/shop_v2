"use client";

import { MapPin, Plus, Star } from "lucide-react";

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

type CheckoutAddressSelectorProps = {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (address: Address | null) => void;
};

export function CheckoutAddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
}: CheckoutAddressSelectorProps) {
  if (addresses.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Select a saved address
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;
          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              className={`relative rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-foreground/20"
              }`}
            >
              {address.isDefault && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 text-xs text-primary">
                  <Star className="size-3 fill-current" />
                </span>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium truncate">{address.name}</p>
                  <p className="truncate text-muted-foreground">
                    {address.street}
                  </p>
                  <p className="text-muted-foreground">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* New address option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-lg border border-dashed p-3 text-left transition-colors ${
            selectedAddressId === null
              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
              : "hover:border-foreground/20"
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            <Plus className="size-4 text-muted-foreground" />
            <span className="font-medium">Enter a new address</span>
          </div>
        </button>
      </div>
    </div>
  );
}
