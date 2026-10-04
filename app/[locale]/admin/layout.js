"use client";

import { useLocale } from "next-intl";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAccount } from "@/app/AuthProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { buildAdminNav, FULL_WIDTH_ADMIN_ROUTES } from "@/components/admin/adminNav";

const linkClass =
  "flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 transition-colors duration-micro ease-out hover:bg-secondary hover:text-ink aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-ink";

function AdminNav({ groups, overviewLabel, pathname }) {
  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      <Link
        href="/admin"
        aria-current={pathname === "/admin" ? "page" : undefined}
        className={linkClass}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
        {overviewLabel}
      </Link>
      {groups.map((group) => (
        <div key={group.key}>
          <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{group.title}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={linkClass}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Admin pages ask for confirmation through ConfirmProvider instead of window.confirm.
export default function AdminLayout({ children }) {
  return (
    <ConfirmProvider>
      <AdminShell>{children}</AdminShell>
    </ConfirmProvider>
  );
}

function AdminShell({ children }) {
  const locale = useLocale();
  const pathname = usePathname();
  // The role is already read with the account; no second lookup for the menu.
  const { role: userRole } = useAccount();

  const copy =
    locale === "en"
      ? { menu: "Admin menu", overview: "Overview" }
      : { menu: "Yönetim menüsü", overview: "Genel bakış" };

  const groups = buildAdminNav(userRole, locale);
  const fullWidth = FULL_WIDTH_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Projected live screens use the whole width and no sidebar
  if (fullWidth) {
    return <div className="mx-auto w-full max-w-[100rem] px-gutter py-6">{children}</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-wide gap-6 px-gutter py-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        {/* Below lg the sidebar is a disclosure */}
        <details className="group border-y border-rule lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold">
            {copy.menu}
            <ChevronDown
              className="h-4 w-4 transition-transform duration-short ease-out group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="pb-4">
            <AdminNav groups={groups} overviewLabel={copy.overview} pathname={pathname} />
          </div>
        </details>
        <div className="hidden lg:block">
          <AdminNav groups={groups} overviewLabel={copy.overview} pathname={pathname} />
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
