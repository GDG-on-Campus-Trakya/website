"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { buildAdminNav } from "@/components/admin/adminNav";
import { PageHeader, Section, Skeleton } from "@/components/ui/page";
import { getEventStart } from "@/utils/eventTime";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { logger } from "@/utils/logger";

const COPY = {
  tr: {
    loading: "Yükleniyor…",
    denied: "Bu sayfaya erişimin yok.",
    title: "Yönetim paneli",
    roleLabel: "Rolün",
    admin: "Yönetici",
    eventManager: "Etkinlik sorumlusu",
    attention: "Bakılması gerekenler",
    nothing: "Şu an bekleyen bir şey yok.",
    openTickets: (open, unassigned) =>
      unassigned > 0
        ? `${open} açık destek talebi, ${unassigned} tanesi kimseye atanmamış`
        : `${open} açık destek talebi`,
    drafts: (count) => `${count} duyuru taslakta bekliyor`,
    nextEvent: (name, date, count) => `Sıradaki etkinlik: ${name}, ${date} · ${count} kayıt`,
    noNextEvent: "Planlanmış etkinlik yok",
  },
  en: {
    loading: "Loading…",
    denied: "You do not have access to this page.",
    title: "Admin panel",
    roleLabel: "Your role",
    admin: "Admin",
    eventManager: "Event manager",
    attention: "Needs attention",
    nothing: "Nothing is waiting right now.",
    openTickets: (open, unassigned) =>
      unassigned > 0
        ? `${open} open support requests, ${unassigned} not assigned to anyone`
        : `${open} open support requests`,
    drafts: (count) => `${count} announcements waiting as drafts`,
    nextEvent: (name, date, count) => `Next event: ${name}, ${date} · ${count} registered`,
    noNextEvent: "No event scheduled",
  },
};

// What an admin opens the panel for: open support requests, drafts, the next event's sign-ups.
// Counts use aggregation queries, so they read no documents.
async function loadAttention(isAdmin) {
  const { db } = await import("@/firebase");
  const { collection, getCountFromServer, getDocs, query, where } = await import(
    "firebase/firestore"
  );
  const count = async (q) => (await getCountFromServer(q)).data().count;

  const items = {};
  const eventsSnapshot = await getDocs(collection(db, "events"));
  const now = Date.now();
  const next = eventsSnapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .map((event) => ({ event, start: getEventStart(event) }))
    .filter(({ start }) => start && start.getTime() > now)
    .sort((a, b) => a.start - b.start)[0];
  if (next) {
    items.next = {
      ...next,
      registrations: await count(
        query(collection(db, "registrations"), where("eventId", "==", next.event.id))
      ),
    };
  }

  if (isAdmin) {
    const tickets = collection(db, "tickets");
    const [open, unassigned, drafts] = await Promise.all([
      count(query(tickets, where("status", "==", "open"))),
      count(query(tickets, where("status", "==", "open"), where("assignedTo", "==", null))),
      count(query(collection(db, "clubAnnouncements"), where("isPublished", "==", false))),
    ]);
    items.tickets = { open, unassigned };
    items.drafts = drafts;
  }
  return items;
}

const rowLink =
  "group flex min-h-12 items-center justify-between gap-4 border-b border-rule py-2 transition-colors duration-micro ease-out hover:bg-secondary";

export default function AdminPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [attention, setAttention] = useState(null);
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

  useEffect(() => {
    if (!userRole) return;
    loadAttention(userRole === ROLES.ADMIN)
      .then(setAttention)
      .catch((error) => {
        logger.error("Admin overview counts could not be loaded:", error);
        setAttention({});
      });
  }, [userRole]);

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
  const rows = [];
  if (attention?.tickets?.open > 0) {
    rows.push({
      href: "/admin/tickets",
      label: copy.openTickets(attention.tickets.open, attention.tickets.unassigned),
    });
  }
  if (attention?.drafts > 0) {
    rows.push({ href: "/admin/announcements", label: copy.drafts(attention.drafts) });
  }
  if (attention) {
    rows.push(
      attention.next
        ? {
            href: "/admin/registrations",
            label: copy.nextEvent(
              getLocalizedField(attention.next.event, "name", locale),
              formatLocalizedDate(attention.next.start, locale, {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "long",
              }),
              attention.next.registrations
            ),
          }
        : { href: "/admin/events", label: copy.noNextEvent }
    );
  }

  return (
    <div>
      <PageHeader title={copy.title}>
        <p className="mt-3 text-sm text-muted-foreground">
          {copy.roleLabel}:{" "}
          <span className="font-semibold text-ink">
            {userRole === ROLES.ADMIN ? copy.admin : copy.eventManager}
          </span>
        </p>
      </PageHeader>

      <Section title={copy.attention} className="mt-0 md:mt-0">
        {!attention ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-ink-2">{copy.nothing}</p>
        ) : (
          <ul className="max-w-2xl">
            {rows.map((row) => (
              <li key={row.href}>
                <Link href={row.href} prefetch={false} className={rowLink}>
                  <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                    {row.label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* On wide screens the sidebar already lists every section */}
      <div className="lg:hidden">
        <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
          {groups.map((group) => (
            <Section key={group.key} title={group.title}>
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
    </div>
  );
}
