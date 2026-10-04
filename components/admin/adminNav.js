import {
  Calendar,
  Megaphone,
  Folder,
  Handshake,
  Upload,
  Share2,
  Users,
  ShieldCheck,
  ClipboardList,
  QrCode,
  LifeBuoy,
  Gamepad2,
  Vote,
  Gift,
  Disc,
  LayoutGrid,
  BarChart3,
  Brain
} from "lucide-react";
import { ROLES, canAccessPage } from "@/utils/roleUtils";

// Labels are the ones the old hub already used, so existing translations keep working.
const COPY = {
  tr: {
    groups: { content: "İçerik", people: "Kişiler", live: "Canlı", insight: "Analiz" },
    authorization: "Yetkilendirme",
    users: "Kullanıcılar",
    registrations: "Kayıtlar",
    qrVerification: "QR doğrulama",
    raffles: "Çekilişler",
    raffleWheel: "Çekiliş çarkı",
    socialPlatform: "Sosyal",
    tableAssignment: "Masa yerleştirme",
    announcements: "Duyurular",
    personalityTests: "Kişilik testleri",
    statistics: "İstatistikler",
    liveQuiz: "Canlı quiz",
    pollManagement: "Oylamalar",
    events: "Etkinlikler",
    sponsors: "Sponsorlar",
    projects: "Projeler",
    fileUpload: "Dosya yükleme",
    support: "Destek"
  },
  en: {
    groups: { content: "Content", people: "People", live: "Live", insight: "Insight" },
    authorization: "Authorization",
    users: "Users",
    registrations: "Registrations",
    qrVerification: "QR check-in",
    raffles: "Raffles",
    raffleWheel: "Raffle wheel",
    socialPlatform: "Social",
    tableAssignment: "Table assignment",
    announcements: "Announcements",
    personalityTests: "Personality tests",
    statistics: "Statistics",
    liveQuiz: "Live quiz",
    pollManagement: "Polls",
    events: "Events",
    sponsors: "Sponsors",
    projects: "Projects",
    fileUpload: "File upload",
    support: "Support"
  }
};

/**
 * The admin navigation, grouped, and filtered by what the role may open.
 * Visibility mirrors the old hub page exactly; every page still runs its own access check.
 */
export function buildAdminNav(userRole, locale) {
  const copy = COPY[locale === "en" ? "en" : "tr"];
  const isAdmin = userRole === ROLES.ADMIN;
  const can = (href) => canAccessPage(userRole, href);

  const groups = [
    {
      key: "content",
      title: copy.groups.content,
      items: [
        { href: "/admin/events", label: copy.events, icon: Calendar, show: isAdmin },
        { href: "/admin/announcements", label: copy.announcements, icon: Megaphone, show: isAdmin },
        { href: "/admin/projects", label: copy.projects, icon: Folder, show: isAdmin },
        { href: "/admin/sponsors", label: copy.sponsors, icon: Handshake, show: isAdmin },
        { href: "/admin/file-upload", label: copy.fileUpload, icon: Upload, show: isAdmin },
        { href: "/admin/social", label: copy.socialPlatform, icon: Share2, show: can("/admin/social") }
      ]
    },
    {
      key: "people",
      title: copy.groups.people,
      items: [
        { href: "/admin/users", label: copy.users, icon: Users, show: can("/admin/users") },
        { href: "/admin/admin-management", label: copy.authorization, icon: ShieldCheck, show: isAdmin },
        { href: "/admin/registrations", label: copy.registrations, icon: ClipboardList, show: can("/admin/registrations") },
        { href: "/admin/qr-verification", label: copy.qrVerification, icon: QrCode, show: can("/admin/qr-verification") },
        { href: "/admin/tickets", label: copy.support, icon: LifeBuoy, show: true }
      ]
    },
    {
      key: "live",
      title: copy.groups.live,
      items: [
        { href: "/admin/quiz/manage", label: copy.liveQuiz, icon: Gamepad2, show: isAdmin },
        { href: "/admin/poll", label: copy.pollManagement, icon: Vote, show: isAdmin },
        { href: "/admin/raffles", label: copy.raffles, icon: Gift, show: can("/admin/raffles") },
        { href: "/admin/raffle-wheel", label: copy.raffleWheel, icon: Disc, show: can("/admin/raffles") },
        { href: "/admin/table-assignment", label: copy.tableAssignment, icon: LayoutGrid, show: can("/admin/table-assignment") }
      ]
    },
    {
      key: "insight",
      title: copy.groups.insight,
      items: [
        { href: "/admin/event-stats", label: copy.statistics, icon: BarChart3, show: can("/admin/event-stats") },
        { href: "/admin/personality-tests", label: copy.personalityTests, icon: Brain, show: isAdmin }
      ]
    }
  ];

  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0);
}

// Routes that run full width (projected live screens) and skip the sidebar
export const FULL_WIDTH_ADMIN_ROUTES = ["/admin/quiz/host", "/admin/poll/host", "/admin/raffle-wheel"];
