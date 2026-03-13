import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">{t("notFound")}</h1>
      <p className="text-lg text-muted-foreground">{t("pageNotFound")}</p>
      <p className="text-sm text-muted-foreground max-w-md">{t("pageNotFoundDescription")}</p>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
