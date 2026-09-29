"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import { db } from "@/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye, Heart, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { logger } from "@/utils/logger";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import "react-toastify/dist/ReactToastify.css";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  const copy =
    locale === "en"
      ? {
          metaTitle: "Projects | GDG on Campus Trakya",
          metaDescription:
            "Explore projects built by GDG on Campus Trakya members across software, design and technology.",
          loading: "Loading projects...",
          title: "Community Projects",
          description:
            "Explore creative work where imagination and technical skill come together. From web development to mobile apps, AI and games, discover what our community is building.",
          tags: ["Open Source", "Collaborative", "Learning Focused", "Innovative"],
          emptyTitle: "No projects yet",
          emptyDescription: "Community projects will appear here.",
          collaborators: "Collaborators:",
          status: {
            active: "Active",
            completed: "Completed",
            paused: "Paused"
          },
          details: "View Details →"
        }
      : {
          metaTitle: "Projeler | GDG on Campus Trakya",
          metaDescription:
            "GDG on Campus Trakya topluluğunun üyeleri tarafından geliştirilen projeleri keşfedin.",
          loading: "Projeler yükleniyor...",
          title: "Topluluk Projeleri",
          description:
            "GDG on Campus Trakya topluluğu üyelerinin hayal gücü ve teknik becerilerinin buluştuğu yaratıcı projeler. Web geliştirmeden mobil uygulamalara, yapay zekadan oyun geliştirmeye kadar geniş bir yelpazede yer alan projelerimizi keşfedin.",
          tags: ["Açık Kaynak", "İşbirlikçi", "Öğrenme Odaklı", "İnovatif"],
          emptyTitle: "Henüz proje eklenmemiş",
          emptyDescription: "Topluluk üyelerinin projeleri burada görüntülenecek.",
          collaborators: "İşbirlikçiler:",
          status: {
            active: "Aktif",
            completed: "Tamamlanmış",
            paused: "Beklemede"
          },
          details: "Detayları Gör →"
        };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsQuery = query(
          collection(db, "projects"),
          orderBy("createdAt", "desc")
        );
        const projectSnapshot = await getDocs(projectsQuery);
        setProjects(
          projectSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      } catch (error) {
        logger.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const statusVariant = {
    active: "success",
    completed: "neutral",
    paused: "warning"
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="text-ink-2">{copy.loading}</p>
        <div className="mt-6 space-y-6" aria-hidden="true">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <Head>
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
        <meta property="og:title" content={copy.metaTitle} />
        <meta property="og:description" content={copy.metaDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={copy.metaTitle} />
        <meta name="twitter:description" content={copy.metaDescription} />
      </Head>

      <PageContainer>
        <PageHeader title={copy.title} description={copy.description}>
          <ul className="mt-4 flex flex-wrap gap-2">
            {copy.tags.map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        </PageHeader>

        {projects.length === 0 ? (
          <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
        ) : (
          <ul className="border-t border-rule">
            {projects.map((project) => {
              const projectTitle = getLocalizedField(project, "title", locale);
              const projectDescription = getLocalizedField(
                project,
                "description",
                locale
              );

              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={`group grid gap-x-6 gap-y-4 border-b border-rule py-6 transition-colors duration-micro ease-out hover:bg-paper-2 ${
                      project.imageUrl
                        ? "sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
                        : ""
                    }`}
                  >
                    {project.imageUrl && (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-paper-2">
                        <img
                          src={project.imageUrl}
                          alt={projectTitle}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {project.status && (
                          <Badge variant={statusVariant[project.status] || "success"}>
                            {copy.status[project.status] || copy.status.active}
                          </Badge>
                        )}
                        {project.createdAt && (
                          <span className="font-outlier text-sm text-muted-foreground">
                            {formatLocalizedDate(project.createdAt.toDate(), locale, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 font-display text-xl font-bold leading-tight group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {projectTitle}
                      </h2>

                      <p className="mt-2 line-clamp-3 max-w-measure text-ink-2">
                        {projectDescription}
                      </p>

                      {project.collaborators && project.collaborators.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          <span className="text-muted-foreground">{copy.collaborators}</span>
                          {project.collaborators.slice(0, 3).map((collab, collabIndex) => (
                            <span
                              key={collabIndex}
                              className="flex min-w-0 items-center gap-2 text-ink-2"
                            >
                              <img
                                src={collab.photoURL || "/logo.svg"}
                                alt={collab.name}
                                className="h-5 w-5 shrink-0 rounded-full object-cover"
                              />
                              <span className="max-w-32 truncate">
                                {collab.name || collab.email.split("@")[0]}
                              </span>
                            </span>
                          ))}
                          {project.collaborators.length > 3 && (
                            <span className="font-outlier tabular-nums text-muted-foreground">
                              +{project.collaborators.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4" aria-hidden="true" />
                          <span className="font-outlier tabular-nums">
                            {project.likes?.length || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          <span className="font-outlier tabular-nums">
                            {project.comments?.length || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span className="font-outlier tabular-nums">{project.views || 0}</span>
                        </span>
                        <span className="whitespace-nowrap font-medium text-brand">
                          {copy.details}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageContainer>

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
        theme="light"
      />
    </>
  );
}
