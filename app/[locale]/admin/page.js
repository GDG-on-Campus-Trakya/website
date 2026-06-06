"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES, canAccessPage } from "@/utils/roleUtils";

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
          systemStatus: "System Status",
          active: "Active",
          panels: "Management Panels",
          authorization: "Authorization",
          users: "Users",
          registrations: "Registrations",
          qrVerification: "QR Verification",
          raffles: "Raffles",
          raffleWheel: "Raffle Wheel",
          socialPlatform: "Social Platform",
          tableAssignment: "Table Assignment",
          announcements: "Announcements",
          personalityTests: "Personality Tests",
          statistics: "Statistics",
          liveQuiz: "Live Quiz",
          pollManagement: "Poll Management",
          events: "Events",
          sponsors: "Sponsors",
          projects: "Projects",
          fileUpload: "File Upload",
          support: "Support",
        }
      : {
          loading: "Yükleniyor...",
          denied: "Erişim Reddedildi",
          title: "Admin Paneli",
          subtitle: "Tüm yönetim işlemlerinizi buradan gerçekleştirebilirsiniz.",
          roleLabel: "Rolünüz",
          eventManager: "Etkinlik Sorumlusu",
          systemStatus: "Sistem Durumu",
          active: "Aktif",
          panels: "Yönetim Panelleri",
          authorization: "Yetkilendirme",
          users: "Kullanıcılar",
          registrations: "Kayıtlar",
          qrVerification: "QR Doğrulama",
          raffles: "Çekilişler",
          raffleWheel: "Çekiliş Çarkı",
          socialPlatform: "Sosyal Platform",
          tableAssignment: "Masa Yerleştirme",
          announcements: "Duyurular",
          personalityTests: "Kişilik Testleri",
          statistics: "İstatistikler",
          liveQuiz: "Canlı Quiz",
          pollManagement: "Poll Yönetimi",
          events: "Etkinlikler",
          sponsors: "Sponsorlar",
          projects: "Projeler",
          fileUpload: "Dosya Yükleme",
          support: "Destek",
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

  const cards = [
    {
      href: "/admin/admin-management",
      label: copy.authorization,
      show: userRole === ROLES.ADMIN,
      className:
        "from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      ),
    },
    {
      href: "/admin/users",
      label: copy.users,
      show: canAccessPage(userRole, "/admin/users"),
      className:
        "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
      ),
    },
    {
      href: "/admin/registrations",
      label: copy.registrations,
      show: canAccessPage(userRole, "/admin/registrations"),
      className:
        "from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
    {
      href: "/admin/qr-verification",
      label: copy.qrVerification,
      show: canAccessPage(userRole, "/admin/qr-verification"),
      className:
        "from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
        />
      ),
    },
    {
      href: "/admin/raffles",
      label: copy.raffles,
      show: canAccessPage(userRole, "/admin/raffles"),
      className:
        "from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      ),
    },
    {
      href: "/admin/raffle-wheel",
      label: copy.raffleWheel,
      show: canAccessPage(userRole, "/admin/raffles"),
      className:
        "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      href: "/admin/social",
      label: copy.socialPlatform,
      show: canAccessPage(userRole, "/admin/social"),
      className:
        "from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      ),
    },
    {
      href: "/admin/table-assignment",
      label: copy.tableAssignment,
      show: canAccessPage(userRole, "/admin/table-assignment"),
      className:
        "from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      ),
    },
    {
      href: "/admin/announcements",
      label: copy.announcements,
      show: userRole === ROLES.ADMIN,
      className:
        "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
        />
      ),
    },
    {
      href: "/admin/personality-tests",
      label: copy.personalityTests,
      show: userRole === ROLES.ADMIN,
      className:
        "from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      ),
    },
    {
      href: "/admin/event-stats",
      label: copy.statistics,
      show: canAccessPage(userRole, "/admin/event-stats"),
      className:
        "from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      href: "/admin/quiz/manage",
      label: copy.liveQuiz,
      show: userRole === ROLES.ADMIN,
      className:
        "from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      ),
    },
    {
      href: "/admin/poll",
      label: copy.pollManagement,
      show: userRole === ROLES.ADMIN,
      className:
        "from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      href: "/admin/events",
      label: copy.events,
      show: userRole === ROLES.ADMIN,
      className:
        "from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
    },
    {
      href: "/admin/sponsors",
      label: copy.sponsors,
      show: userRole === ROLES.ADMIN,
      className:
        "from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6m0 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6m16 0V6a2 2 0 00-2-2H4a2 2 0 00-2 2v0m16 0h2m-2 0h2"
        />
      ),
    },
    {
      href: "/admin/projects",
      label: copy.projects,
      show: userRole === ROLES.ADMIN,
      className:
        "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      ),
    },
    {
      href: "/admin/file-upload",
      label: copy.fileUpload,
      show: userRole === ROLES.ADMIN,
      className:
        "from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      ),
    },
    {
      href: "/admin/tickets",
      label: copy.support,
      show: true,
      className:
        "from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">{copy.loading}</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">{copy.denied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {copy.title}
          </h1>
          <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full" />
        </div>
        <p className="text-gray-300 mt-4 text-lg">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                {copy.roleLabel}
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {userRole === ROLES.ADMIN ? "Admin" : copy.eventManager}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                {copy.systemStatus}
              </p>
              <p className="text-3xl font-bold text-purple-400">
                {copy.active}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-8">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {copy.panels}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards
            .filter((card) => card.show)
            .map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group bg-gradient-to-r ${card.className} text-white p-6 rounded-2xl text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {card.icon}
                    </svg>
                  </div>
                  <span className="font-semibold text-lg">{card.label}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
