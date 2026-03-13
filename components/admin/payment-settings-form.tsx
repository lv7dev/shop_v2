"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  updatePaymentSettings,
  type PaymentSettings,
} from "@/actions/settings";

type PaymentSettingsFormProps = {
  initialSettings: PaymentSettings;
  envStatus: {
    stripe: boolean;
    momo: boolean;
  };
};

export function PaymentSettingsForm({
  initialSettings,
  envStatus,
}: PaymentSettingsFormProps) {
  const t = useTranslations("admin.paymentSettings");
  const tc = useTranslations("admin.common");
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const PAYMENT_METHODS = [
    {
      key: "cod" as const,
      label: t("cod"),
      description: t("codDesc"),
      icon: Banknote,
      iconColor: "text-green-600",
      requiresEnv: false,
    },
    {
      key: "stripe" as const,
      label: t("stripe"),
      description: t("stripeDesc"),
      icon: CreditCard,
      iconColor: "text-blue-600",
      requiresEnv: true,
      envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    },
    {
      key: "momo" as const,
      label: t("momo"),
      description: t("momoDesc"),
      icon: Smartphone,
      iconColor: "text-pink-600",
      requiresEnv: true,
      envVars: ["MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY"],
    },
  ];

  async function handleSave() {
    setSaving(true);
    const result = await updatePaymentSettings(settings);
    if (result.success) {
      toast.success(t("updated"));
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  }

  function toggleMethod(key: "cod" | "stripe" | "momo") {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  }

  const isEnvConfigured = (key: string) => {
    if (key === "cod") return true;
    return envStatus[key as keyof typeof envStatus] ?? false;
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="divide-y">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const enabled = settings[method.key].enabled;
            const envOk = isEnvConfigured(method.key);

            return (
              <div key={method.key} className="flex items-center gap-4 px-6 py-4">
                <Icon className={`size-6 ${method.iconColor}`} />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.label}</span>
                    {enabled && envOk && (
                      <Badge className="border-0 bg-green-100 text-green-700 text-xs">
                        {tc("active")}
                      </Badge>
                    )}
                    {enabled && !envOk && (
                      <Badge className="border-0 bg-amber-100 text-amber-700 text-xs">
                        {tc("enabledNotConfigured")}
                      </Badge>
                    )}
                    {!enabled && (
                      <Badge className="border-0 bg-gray-100 text-gray-500 text-xs">
                        {tc("disabled")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>

                  {/* Env var status */}
                  {method.requiresEnv && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      {envOk ? (
                        <>
                          <Check className="size-3 text-green-600" />
                          <span className="text-green-600">
                            {t("apiConfigured")}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-3 text-amber-500" />
                          <span className="text-amber-600">
                            {t("missingEnv", { vars: method.envVars?.join(", ") ?? "" })}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleMethod(method.key)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">{t("howItWorks")}</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-blue-700">
          <li>{t("howItWorksInfo1")}</li>
          <li>{t("howItWorksInfo2")}</li>
          <li>{t("howItWorksInfo3")}</li>
        </ul>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {tc("saving")}
            </>
          ) : (
            tc("saveChanges")
          )}
        </Button>
      </div>
    </div>
  );
}
