import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFacetById } from "@/services/facets";

const FacetForm = dynamic(
  () => import("@/components/admin/facet-form").then((mod) => mod.FacetForm)
);
const FacetValuesManager = dynamic(
  () => import("@/components/admin/facet-values-manager").then((mod) => mod.FacetValuesManager)
);

export const metadata: Metadata = {
  title: "Edit Facet",
};

export default async function EditFacetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const facet = await getFacetById(id);

  if (!facet) notFound();

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
        <h1 className="text-3xl font-bold">Edit Facet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the facet name and manage its values.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Facet Details</h2>
          <FacetForm facet={{ id: facet.id, name: facet.name }} />
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Values</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Click a value to edit it. You can add multiple values at once separated by commas.
          </p>
          <FacetValuesManager facetId={facet.id} values={facet.values} />
        </div>
      </div>
    </div>
  );
}
