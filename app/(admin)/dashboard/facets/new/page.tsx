import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const FacetForm = dynamic(
  () => import("@/components/admin/facet-form").then((mod) => mod.FacetForm)
);

export const metadata: Metadata = {
  title: "Create Facet",
};

export default function NewFacetPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/facets"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Facets
        </Link>
        <h1 className="text-3xl font-bold">Create Facet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new attribute facet (e.g. Size, Color, Brand).
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <FacetForm />
      </div>
    </div>
  );
}
