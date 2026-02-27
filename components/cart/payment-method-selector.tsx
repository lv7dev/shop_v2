"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, CreditCard, Smartphone } from "lucide-react";

type PaymentMethodSelectorProps = {
  value: string;
  enabledMethods: string[];
  onChange: (value: string) => void;
};

const PAYMENT_OPTIONS = [
  {
    value: "COD",
    label: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: Banknote,
    iconColor: "text-green-600",
  },
  {
    value: "STRIPE",
    label: "Credit/Debit Card",
    description: "Pay securely via Stripe",
    icon: CreditCard,
    iconColor: "text-blue-600",
  },
  {
    value: "MOMO",
    label: "MoMo",
    description: "QR Pay or ATM/Card via MoMo (VND)",
    icon: Smartphone,
    iconColor: "text-pink-600",
  },
] as const;

export function PaymentMethodSelector({
  value,
  enabledMethods,
  onChange,
}: PaymentMethodSelectorProps) {
  const visibleOptions = PAYMENT_OPTIONS.filter((o) =>
    enabledMethods.includes(o.value)
  );

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Payment Method</h2>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {visibleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`payment-${option.value}`} />
              <Icon className={`size-5 ${option.iconColor}`} />
              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
