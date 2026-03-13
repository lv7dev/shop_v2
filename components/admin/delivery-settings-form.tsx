"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MapPin, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  updateDeliverySettings,
  type DeliverySettings,
} from "@/actions/settings";

const HqMapPicker = dynamic(
  () => import("./hq-map-picker").then((m) => m.HqMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] w-full items-center justify-center rounded-lg border bg-muted">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

type DeliverySettingsFormProps = {
  initialSettings: DeliverySettings;
};

export function DeliverySettingsForm({
  initialSettings,
}: DeliverySettingsFormProps) {
  const t = useTranslations("admin.deliverySettings");
  const tc = useTranslations("admin.common");
  const [settings, setSettings] = useState<DeliverySettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  async function handleSave() {
    setSaving(true);
    const result = await updateDeliverySettings(settings);
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
            <Truck className="size-5" />
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* HQ Location Map */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {t("hqLocation")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("hqLocationHelp")}
            </p>
            <HqMapPicker
              latitude={settings.hqLatitude}
              longitude={settings.hqLongitude}
              onChange={(lat, lng) =>
                setSettings((s) => ({
                  ...s,
                  hqLatitude: lat,
                  hqLongitude: lng,
                }))
              }
            />
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Lat: {settings.hqLatitude}</span>
              <span>Lng: {settings.hqLongitude}</span>
            </div>
          </div>

          {/* HQ Address Label */}
          <div className="space-y-2">
            <Label htmlFor="hqAddress">{t("hqLabel")}</Label>
            <Input
              id="hqAddress"
              value={settings.hqAddress}
              onChange={(e) =>
                setSettings((s) => ({ ...s, hqAddress: e.target.value }))
              }
              placeholder={t("hqLabelPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("hqLabelHelp")}
            </p>
          </div>

          {/* Simulation Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">{t("simulationDuration")}</Label>
            <Input
              id="duration"
              type="number"
              min={0.5}
              max={60}
              step={0.5}
              value={settings.simulationDurationMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  simulationDurationMinutes: parseFloat(e.target.value) || 2,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("simulationDurationHelp")}
            </p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">{t("howItWorks")}</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-blue-700">
          <li>{t("howItWorksInfo1")}</li>
          <li>{t("howItWorksInfo2")}</li>
          <li>{t("howItWorksInfo3")}</li>
          <li>{t("howItWorksInfo4")}</li>
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
