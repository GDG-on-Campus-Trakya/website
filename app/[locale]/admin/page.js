"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { buildAdminNav } from "@/components/admin/adminNav";
import { PageHeader, Section } from "@/components/ui/page";

export default function AdminPage() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading...",
          denied: "Access Denied",
          title: "Admin Panel",
          subtitle: "Run all management operations from here.",
          roleLabel: "Your Role",
          eventManager: "Event Manager",
        }
      : {
          loading: "Yükleniyor...",
          denied: "Erişim Reddedildi",
          title: "Admin Paneli",
          subtitle: "Tüm yönetim işlemlerinizi buradan gerçekleştirebilirsiniz.",
          roleLabel: "Rolünüz",
          eventManager: "Etkinlik Sorumlusu",
        };

  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      const role = await checkUserRole(user.email);
      if (!role) {
        router.push("/");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  if (loading) {
    return <p className="py-12 text-ink-2">{copy.loading}</p>;
  }

  if (!userRole) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {copy.denied}
      </p>
    );
  }

  const groups = buildAdminNav(userRole, locale);

  return (
    <div>
      <PageHeader title={copy.title} description={copy.subtitle}>
        <p className="mt-4 text-sm text-muted-foreground">
          {copy.roleLabel}:{" "}
          <span className="font-semibold text-ink">
            {userRole === ROLES.ADMIN ? "Admin" : copy.eventManager}
          </span>
        </p>
      </PageHeader>

      <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
        {groups.map((group) => (
          <Section key={group.key} title={group.title} className="md:mt-10">
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="group flex min-h-12 items-center gap-3 border-b border-rule transition-colors duration-micro ease-out hover:bg-secondary"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ))}
      </div>
    </div>
  );
}
