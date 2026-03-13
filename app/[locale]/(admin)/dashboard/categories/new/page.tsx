import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { getCategoryOptions } from "@/services/categories";
import { getTranslations, setRequestLocale } from "next-intl/server";

const CategoryForm = dynamic(
  () => import("@/components/admin/category-form").then((mod) => mod.CategoryForm)
);

export const metadata: Metadata = {
  title: "Create Category",
};

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");

  const parentCategories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/categories"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("backToCategories")}
        </Link>
        <h1 className="text-3xl font-bold">{t("createCategory")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("createDescription")}
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <CategoryForm parentCategories={parentCategories} />
      </div>
    </div>
  );
}
