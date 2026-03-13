"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("admin.error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md">
        {t("description")}
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          {t("errorId", { id: error.digest })}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t("dashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}
