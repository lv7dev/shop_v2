"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("account");

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("addresses")}</h2>
        <AddressFormDialog />
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("noAddresses")}
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
