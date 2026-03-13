"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  updatePricingSettings,
  type PricingSettings,
} from "@/actions/settings";

type PricingSettingsFormProps = {
  initialSettings: PricingSettings;
};

export function PricingSettingsForm({
  initialSettings,
}: PricingSettingsFormProps) {
  const t = useTranslations("admin.pricingSettings");
  const tc = useTranslations("admin.common");
  const [settings, setSettings] = useState<PricingSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  async function handleSave() {
    setSaving(true);
    const result = await updatePricingSettings(settings);
    if (result.success) {
      toast.success(t("updated"));
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="size-5" />
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="vndToUsdRate">{t("rateLabel")}</Label>
            <Input
              id="vndToUsdRate"
              type="number"
              min={1}
              max={1000000}
              step={1}
              value={settings.vndToUsdRate}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  vndToUsdRate: parseFloat(e.target.value) || 25000,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("rateHelp")}
            </p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <p className="font-medium">{t("howItWorks")}</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-blue-700 dark:text-blue-400">
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
