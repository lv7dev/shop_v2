import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { APP_NAME } from "@/lib/constants";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">{APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">{t("footer.shop")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">{t("common.products")}</Link></li>
              <li><Link href="/cart" className="hover:text-foreground">{t("common.cart")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">{t("common.account")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/account" className="hover:text-foreground">{t("nav.myAccount")}</Link></li>
              <li><Link href="/orders" className="hover:text-foreground">{t("nav.myOrders")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">{t("footer.support")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">{t("footer.helpCenter")}</Link></li>
              <li><Link href="#" className="hover:text-foreground">{t("footer.contactUs")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
