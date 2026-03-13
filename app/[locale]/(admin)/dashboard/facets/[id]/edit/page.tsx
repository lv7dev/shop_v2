import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { getFacetById } from "@/services/facets";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.facets");

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
          {t("backToFacets")}
        </Link>
        <h1 className="text-3xl font-bold">{t("editFacet")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("editDescription")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("facetDetails")}</h2>
          <FacetForm facet={{ id: facet.id, name: facet.name }} />
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("values")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("valuesHelp")}
          </p>
          <FacetValuesManager facetId={facet.id} values={facet.values} />
        </div>
      </div>
    </div>
  );
}
