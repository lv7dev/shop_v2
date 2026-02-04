import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Account settings will be configured here.
        </p>
      </div>
    </div>
  );
}
