import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users",
};

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Users</h1>
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          User management table will be displayed here.
        </p>
      </div>
    </div>
  );
}
