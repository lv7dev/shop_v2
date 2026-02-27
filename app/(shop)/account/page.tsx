import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAddresses } from "@/actions/address";
import { AddressList } from "@/components/account/address-list";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your account profile and addresses.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { addresses } = await getAddresses();

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

        <AddressList addresses={addresses} />
      </div>
    </div>
  );
}
