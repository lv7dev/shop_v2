import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your account profile and addresses.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Account</h1>

      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Profile information will be displayed here.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Addresses</h2>
          <p className="text-sm text-muted-foreground">
            Saved addresses will be managed here.
          </p>
        </div>
      </div>
    </div>
  );
}
