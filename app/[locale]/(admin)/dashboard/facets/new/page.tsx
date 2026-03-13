import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const FacetForm = dynamic(
  () => import("@/components/admin/facet-form").then((mod) => mod.FacetForm)
);

export const metadata: Metadata = {
  title: "Create Facet",
};

export default async function NewFacetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.facets");

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
        <h1 className="text-3xl font-bold">{t("createFacet")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("createDescription")}
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <FacetForm />
      </div>
    </div>
  );
}
