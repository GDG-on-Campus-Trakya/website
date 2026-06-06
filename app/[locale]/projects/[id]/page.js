"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Head from "next/head";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  doc,
  getDoc,
  collection,
  query,
  limit,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export default function ProjectDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          signInToLike: "You need to sign in to like this project.",
          likeError: "Failed to update the like.",
          signInToComment: "You need to sign in to comment.",
          commentAdded: "Comment added.",
          commentError: "Failed to add the comment.",
          loading: "Loading project...",
          notFound: "Project not found",
          backToProjects: "Back to Projects",
          copied: "Link copied.",
          share: "Share",
          about: "About the Project",
          collaborators: "Collaborators",
          unnamed: "Unnamed",
          comments: "Comments",
          commentPlaceholder: "Share your thoughts about this project...",
          commentButton: "Comment",
          signInNotice: "You need to sign in to comment.",
          noComments: "No comments yet.",
          firstComment: "Be the first to comment!",
          views: "Views",
          commentStat: "Comments",
          projectFallback: "Project | GDG on Campus Trakya",
          projectDescriptionFallback: "GDG on Campus Trakya project",
        }
      : {
          signInToLike: "Beğenmek için giriş yapmalısınız!",
          likeError: "Beğeni güncellenirken bir hata oluştu!",
          signInToComment: "Yorum yapmak için giriş yapmalısınız!",
          commentAdded: "Yorum eklendi!",
          commentError: "Yorum eklenirken bir hata oluştu!",
          loading: "Proje yükleniyor...",
          notFound: "Proje bulunamadı",
          backToProjects: "Projelere Dön",
          copied: "Link kopyalandı!",
          share: "Paylaş",
          about: "Proje Hakkında",
          collaborators: "İşbirlikçiler",
          unnamed: "İsim belirtilmemiş",
          comments: "Yorumlar",
          commentPlaceholder: "Projeyle ilgili düşüncelerinizi paylaşın...",
          commentButton: "Yorum Yap",
          signInNotice: "Yorum yapmak için giriş yapmalısınız.",
          noComments: "Henüz yorum yapılmamış.",
          firstComment: "İlk yorumu siz yapın!",
          views: "Görüntülenme",
          commentStat: "Yorum",
          projectFallback: "Proje | GDG on Campus Trakya",
          projectDescriptionFallback: "GDG on Campus Trakya projesi",
        };

  const [user] = useAuthState(auth);
  const [project, setProject] = useState(null);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [userProfilePhoto, setUserProfilePhoto] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id) return;

      try {
        const projectDoc = await getDoc(doc(db, "projects", params.id));

        if (projectDoc.exists()) {
          const projectData = { id: projectDoc.id, ...projectDoc.data() };
          setProject(projectData);

          const relatedQuery = query(collection(db, "projects"), limit(4));
          const relatedSnapshot = await getDocs(relatedQuery);
          const related = relatedSnapshot.docs
            .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
            .filter((item) => item.id !== params.id)
            .slice(0, 3);

          setRelatedProjects(related);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        logger.error("Error fetching project:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  useEffect(() => {
    const incrementViews = async () => {
      if (project && params.id) {
        try {
          await updateDoc(doc(db, "projects", params.id), {
            views: increment(1),
          });
        } catch (error) {
          logger.error("Error incrementing views:", error);
        }
      }
    };

    incrementViews();
  }, [project, params.id]);

  useEffect(() => {
    const fetchUserProfilePhoto = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfilePhoto(
              userData.photoURL || user.photoURL || "/logo.svg"
            );
          } else {
            setUserProfilePhoto(user.photoURL || "/logo.svg");
          }
        } catch (error) {
          logger.error("Error fetching user profile photo:", error);
          setUserProfilePhoto(user.photoURL || "/logo.svg");
        }
      } else {
        setUserProfilePhoto(null);
      }
    };

    fetchUserProfilePhoto();
  }, [user]);

  const handleLike = async () => {
    if (!user) {
      toast.error(copy.signInToLike);
      return;
    }

    if (!project) return;

    try {
      const projectRef = doc(db, "projects", params.id);
      const isLiked = project.likes?.includes(user.uid);

      if (isLiked) {
        await updateDoc(projectRef, {
          likes: arrayRemove(user.uid),
        });
        setProject((prev) => ({
          ...prev,
          likes: prev.likes.filter((uid) => uid !== user.uid),
        }));
      } else {
        await updateDoc(projectRef, {
          likes: arrayUnion(user.uid),
        });
        setProject((prev) => ({
          ...prev,
          likes: [...(prev.likes || []), user.uid],
        }));
      }
    } catch (error) {
      logger.error("Error updating like:", error);
      toast.error(copy.likeError);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!user) {
      toast.error(copy.signInToComment);
      return;
    }

    if (!newComment.trim()) return;

    try {
      const comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: userProfilePhoto || user.photoURL || "",
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "projects", params.id), {
        comments: arrayUnion(comment),
      });

      setProject((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
      }));

      setNewComment("");
      toast.success(copy.commentAdded);
    } catch (error) {
      logger.error("Error adding comment:", error);
      toast.error(copy.commentError);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const projectTitle = getLocalizedField(project, "title", locale);
  const projectDescription = getLocalizedField(project, "description", locale);
  const sortedComments = [...(project?.comments || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl mb-8">{copy.notFound}</p>
          <Link
            href="/projects"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {copy.backToProjects}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {project
            ? `${projectTitle} | GDG on Campus Trakya`
            : copy.projectFallback}
        </title>
        <meta
          name="description"
          content={
            projectDescription?.slice(0, 160) || copy.projectDescriptionFallback
          }
        />
        {project && (
          <>
            <meta property="og:title" content={projectTitle} />
            <meta
              property="og:description"
              content={projectDescription?.slice(0, 160)}
            />
            <meta property="og:type" content="article" />
            {project.imageUrl && (
              <>
                <meta property="og:image" content={project.imageUrl} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={projectTitle} />
              </>
            )}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={projectTitle} />
            <meta
              name="twitter:description"
              content={projectDescription?.slice(0, 160)}
            />
            {project.imageUrl && (
              <meta name="twitter:image" content={project.imageUrl} />
            )}
          </>
        )}
      </Head>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white"
      >
        <motion.div variants={itemVariants} className="relative h-96 overflow-hidden">
          {project.imageUrl ? (
            <>
              <img
                src={project.imageUrl}
                alt={projectTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800" />
          )}

          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {copy.backToProjects}
              </Link>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                {projectTitle}
              </h1>

              {project.createdAt && (
                <div className="flex items-center gap-4 text-white/90">
                  <span>
                    {formatLocalizedDate(project.createdAt.toDate(), locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="lg:hidden sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700 p-4 z-40">
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={handleLike}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                project.likes?.includes(user?.uid)
                  ? "bg-red-600/20 text-red-400 border border-red-500/30"
                  : "bg-gray-700/50 text-gray-300"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={project.likes?.includes(user?.uid) ? "currentColor" : "none"}
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
              <span className="text-sm font-medium">
                {project.likes?.length || 0}
              </span>
            </motion.button>

            {project.githubLink && (
              <motion.a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-700/50 text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </motion.a>
            )}

            <motion.button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: projectTitle,
                    text: projectDescription,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success(copy.copied);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span className="text-sm font-medium">{copy.share}</span>
            </motion.button>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">
                  {copy.about}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {projectDescription}
                  </p>
                </div>
              </div>

              {project.collaborators && project.collaborators.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6 text-white">
                    {copy.collaborators}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.collaborators.map((collab, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
                      >
                        <img
                          src={collab.photoURL || "/logo.svg"}
                          alt={collab.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-white">
                            {collab.name || copy.unnamed}
                          </p>
                          <p className="text-sm text-gray-400">{collab.email}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-semibold mb-6 text-white">
                  {copy.comments} ({project.comments?.length || 0})
                </h2>

                {user ? (
                  <motion.form
                    onSubmit={handleComment}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6"
                  >
                    <div className="flex gap-4">
                      <img
                        src={userProfilePhoto || "/logo.svg"}
                        alt="Your profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(event) => setNewComment(event.target.value)}
                          placeholder={copy.commentPlaceholder}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            {copy.commentButton}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.form>
                ) : (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6 text-center">
                    <p className="text-gray-400">{copy.signInNotice}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {sortedComments.length > 0 ? (
                    sortedComments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
                      >
                        <div className="flex gap-3">
                          <img
                            src={comment.userPhoto || "/logo.svg"}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white text-sm">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatLocalizedDate(comment.createdAt, locale, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">{copy.noComments}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {copy.firstComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:block hidden">
              <div className="sticky top-8 space-y-4">
                <motion.button
                  onClick={handleLike}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors w-full justify-center ${
                    project.likes?.includes(user?.uid)
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={project.likes?.includes(user?.uid) ? "currentColor" : "none"}
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
                  <span className="text-sm font-medium">
                    {project.likes?.length || 0}
                  </span>
                </motion.button>

                {project.githubLink && (
                  <motion.a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors w-full justify-center"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-sm font-medium">GitHub</span>
                  </motion.a>
                )}

                <motion.button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: projectTitle,
                        text: projectDescription,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success(copy.copied);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors w-full justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{copy.share}</span>
                </motion.button>

                <div className="mt-8 space-y-3 text-sm text-gray-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      <span>{copy.views}</span>
                    </div>
                    <span className="text-white font-medium">
                      {project.views || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      <span>{copy.commentStat}</span>
                    </div>
                    <span className="text-white font-medium">
                      {project.comments?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
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
