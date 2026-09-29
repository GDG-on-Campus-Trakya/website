"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { toDate } from "@/utils/dateHelpers";
import { ArrowLeft, Eye, Github, Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageContainer, Skeleton } from "@/components/ui/page";

export default function ProjectDetailClient({
  initialProject = null,
  initialRelated = [],
}) {
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
        };

  const [user] = useAuthState(auth);
  // Server-rendered copy first; the effect below swaps in live likes, comments and views.
  const [project, setProject] = useState(initialProject);
  const [relatedProjects, setRelatedProjects] = useState(initialRelated);
  const [loading, setLoading] = useState(!initialProject);
  const viewCounted = useRef(false);
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
      if (project && params.id && !viewCounted.current) {
        viewCounted.current = true;
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

  const projectTitle = getLocalizedField(project, "title", locale);
  const projectDescription = getLocalizedField(project, "description", locale);
  const sortedComments = [...(project?.comments || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleShare = () => {
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
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="text-ink-2">{copy.loading}</p>
        <div className="mt-6 space-y-4" aria-hidden="true">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="aspect-[16/9] w-full max-w-3xl" />
        </div>
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer>
        <h1 className="font-display text-display-s font-extrabold">404</h1>
        <p className="mt-3 text-md text-ink-2">{copy.notFound}</p>
        <Button asChild className="mt-6">
          <Link href="/projects">{copy.backToProjects}</Link>
        </Button>
      </PageContainer>
    );
  }

  const isLiked = Boolean(project.likes?.includes(user?.uid));

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleLike}
        aria-pressed={isLiked}
        className={isLiked ? "border-error text-error" : undefined}
      >
        <Heart className={isLiked ? "fill-current" : undefined} aria-hidden="true" />
        <span className="font-outlier tabular-nums">{project.likes?.length || 0}</span>
      </Button>

      {project.githubLink && (
        <Button asChild variant="outline">
          <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
            <Github aria-hidden="true" />
            GitHub
          </a>
        </Button>
      )}

      <Button type="button" variant="outline" onClick={handleShare}>
        <Share2 aria-hidden="true" />
        {copy.share}
      </Button>
    </>
  );

  return (
    <>
      <PageContainer>
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.backToProjects}
        </Link>

        <header className="mb-8 mt-4 border-b border-rule pb-6 md:mb-10 md:pb-8">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold md:text-5xl">
            {projectTitle}
          </h1>
          {project.createdAt && (
            <p className="mt-3 font-outlier text-sm text-muted-foreground">
              {formatLocalizedDate(toDate(project.createdAt), locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>

        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 space-y-12">
            {project.imageUrl && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-paper-2">
                <img
                  src={project.imageUrl}
                  alt={projectTitle}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 lg:hidden">{actions}</div>

            <section>
              <h2 className="border-t-2 border-ink pt-3 font-display text-xl font-bold">
                {copy.about}
              </h2>
              <p className="mt-4 max-w-measure whitespace-pre-wrap text-md text-ink-2">
                {projectDescription}
              </p>
            </section>

            {project.collaborators && project.collaborators.length > 0 && (
              <section>
                <h2 className="border-t-2 border-ink pt-3 font-display text-xl font-bold">
                  {copy.collaborators}
                </h2>
                <ul className="mt-2 divide-y divide-rule border-b border-rule">
                  {project.collaborators.map((collab, index) => (
                    <li key={index} className="flex items-center gap-4 py-3">
                      <img
                        src={collab.photoURL || "/logo.svg"}
                        alt={collab.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {collab.name || copy.unnamed}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{collab.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="border-t-2 border-ink pt-3 font-display text-xl font-bold">
                {copy.comments} (<span className="tabular-nums">{project.comments?.length || 0}</span>)
              </h2>

              {user ? (
                <form onSubmit={handleComment} className="mt-4 flex gap-4">
                  <img
                    src={userProfilePhoto || "/logo.svg"}
                    alt="Your profile"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder={copy.commentPlaceholder}
                      aria-label={copy.commentPlaceholder}
                      rows={3}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" disabled={!newComment.trim()}>
                        {copy.commentButton}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mt-4 border-y border-rule py-4 text-ink-2">{copy.signInNotice}</p>
              )}

              <div className="mt-6">
                {sortedComments.length > 0 ? (
                  <ul className="divide-y divide-rule border-y border-rule">
                    {sortedComments.map((comment) => (
                      <li key={comment.id} className="flex gap-3 py-4">
                        <img
                          src={comment.userPhoto || "/logo.svg"}
                          alt={comment.userName}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                            <span className="text-sm font-semibold text-ink">
                              {comment.userName}
                            </span>
                            <span className="font-outlier text-xs text-muted-foreground">
                              {formatLocalizedDate(comment.createdAt, locale, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 max-w-measure text-ink-2">{comment.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={copy.noComments} description={copy.firstComment} />
                )}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div className="flex flex-col items-stretch gap-3 [&>*]:w-full">{actions}</div>

              <dl className="divide-y divide-rule border-y border-rule text-sm">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {copy.views}
                  </dt>
                  <dd className="font-outlier font-medium tabular-nums text-ink">
                    {project.views || 0}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    {copy.commentStat}
                  </dt>
                  <dd className="font-outlier font-medium tabular-nums text-ink">
                    {project.comments?.length || 0}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
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
