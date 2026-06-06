"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import { db } from "@/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
        <p className="text-lg">{copy.loading}</p>
      </div>
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white"
      >
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x"
            >
              {copy.title}
            </motion.span>
          </motion.h1>

          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto text-center mb-12 sm:mb-16"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-6"
            >
              {copy.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 text-sm text-gray-400"
            >
              {copy.tags.map((tag, index) => (
                <div key={tag} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      index === 0
                        ? "bg-blue-500"
                        : index === 1
                          ? "bg-green-500"
                          : index === 2
                            ? "bg-purple-500"
                            : "bg-yellow-500"
                    }`}
                  />
                  <span>{tag}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {projects.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 opacity-20">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  {copy.emptyTitle}
                </h3>
                <p className="text-gray-400">{copy.emptyDescription}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {projects.map((project, index) => {
                const projectTitle = getLocalizedField(project, "title", locale);
                const projectDescription = getLocalizedField(
                  project,
                  "description",
                  locale
                );

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                    className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-gray-600 group"
                  >
                    <Link href={`/projects/${project.id}`} className="block">
                      {project.imageUrl && (
                        <div className="relative overflow-hidden">
                          <img
                            src={project.imageUrl}
                            alt={projectTitle}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-3 line-clamp-1 group-hover:text-blue-300 transition-colors">
                          {projectTitle}
                        </h3>

                        <p className="text-gray-300 mb-4 text-sm line-clamp-3 leading-relaxed">
                          {projectDescription}
                        </p>

                        {project.collaborators && project.collaborators.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-400 mb-2 font-medium">
                              {copy.collaborators}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {project.collaborators.slice(0, 3).map((collab, collabIndex) => (
                                <div
                                  key={collabIndex}
                                  className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/30"
                                >
                                  <img
                                    src={collab.photoURL || "/logo.svg"}
                                    alt={collab.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <span className="truncate max-w-20">
                                    {collab.name || collab.email.split("@")[0]}
                                  </span>
                                </div>
                              ))}
                              {project.collaborators.length > 3 && (
                                <div className="flex items-center px-3 py-1 rounded-full text-xs text-gray-400 bg-gray-700/50">
                                  +{project.collaborators.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span>{project.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span>{project.comments?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>{project.views || 0}</span>
                          </div>
                          {project.status && (
                            <div
                              className={`px-2 py-1 rounded-full text-xs ${
                                project.status === "active"
                                  ? "bg-green-500/20 text-green-300"
                                  : project.status === "completed"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : project.status === "paused"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : "bg-green-500/20 text-green-300"
                              }`}
                            >
                              {copy.status[project.status] || copy.status.active}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          {project.createdAt && (
                            <div className="text-xs text-gray-400">
                              <p className="opacity-75">
                                {formatLocalizedDate(
                                  project.createdAt.toDate(),
                                  locale,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  }
                                )}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {copy.details}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </motion.div>

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
    </>
  );
}
