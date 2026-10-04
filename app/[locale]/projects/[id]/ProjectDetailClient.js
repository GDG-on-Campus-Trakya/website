"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAccount } from "@/app/AuthProvider";
import { logger } from "@/utils/logger";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useLocale } from "next-intl";
import {
  formatLocalizedDate,
  getLocalizedField,
  withYearIfNotCurrent,
} from "@/utils/localeUtils";
import { toDate } from "@/utils/dateHelpers";
import { loginHref } from "@/utils/redirect";
import { ArrowLeft, Eye, Github, Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageContainer, Skeleton } from "@/components/ui/page";

const COPY = {
  tr: {
    signInToLike: "Beğenmek için giriş yap",
    likes: "beğeni",
    likeError: "Beğeni kaydedilemedi. Yeniden dene.",
    commentError: "Yorum gönderilemedi. Bağlantını kontrol edip yeniden dene.",
    loading: "Proje yükleniyor…",
    notFound: "Bu proje yok ya da kaldırılmış.",
    backToProjects: "Tüm projeler",
    copied: "Bağlantı kopyalandı.",
    copyFailed: "Kopyalanamadı; adres çubuğundaki bağlantıyı kullan.",
    share: "Paylaş",
    about: "Proje hakkında",
    collaborators: "Ekip",
    unnamed: "Adı girilmemiş",
    comments: "Yorumlar",
    commentLabel: "Yorumun",
    commentPlaceholder: "Bu proje hakkında ne düşünüyorsun?",
    commentButton: "Gönder",
    signInNotice: "Yorum yazmak için giriş yap.",
    noComments: "Henüz yorum yok.",
    views: "Görüntülenme",
    commentStat: "Yorum",
  },
  en: {
    signInToLike: "Sign in to like",
    likes: "likes",
    likeError: "The like was not saved. Try again.",
    commentError: "The comment was not sent. Check your connection and try again.",
    loading: "Loading project…",
    notFound: "This project does not exist or has been removed.",
    backToProjects: "All projects",
    copied: "Link copied.",
    copyFailed: "Could not copy; use the link in the address bar.",
    share: "Share",
    about: "About the project",
    collaborators: "Team",
    unnamed: "No name given",
    comments: "Comments",
    commentLabel: "Your comment",
    commentPlaceholder: "What do you think of this project?",
    commentButton: "Send",
    signInNotice: "Sign in to write a comment.",
    noComments: "No comments yet.",
    views: "Views",
    commentStat: "Comments",
  },
};

const textLink =
  "font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

// A person without a photo gets their initial instead of the club logo.
function Avatar({ src, name, className }) {
  if (src) {
    return <img src={src} alt="" loading="lazy" className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center rounded-full bg-paper-2 font-semibold text-ink-2`}
    >
      {(name || "?").trim().charAt(0).toLocaleUpperCase("tr")}
    </span>
  );
}

export default function ProjectDetailClient({ initialProject = null }) {
  const params = useParams();
  const locale = useLocale();
  const copy = COPY[locale === "en" ? "en" : "tr"];

  const { user, profile } = useAccount();
  // Server-rendered copy first; the effect below swaps in live likes, comments and views.
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const viewCounted = useRef(false);
  const [notFound, setNotFound] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id) return;

      try {
        const projectDoc = await getDoc(doc(db, "projects", params.id));

        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          setNotFound(true);
        }
      } catch (error) {
        logger.error("Error fetching project:", error);
        if (!initialProject) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    // One view per project per browser session, so reloading does not inflate the count.
    const incrementViews = async () => {
      if (!project || !params.id || viewCounted.current) return;
      viewCounted.current = true;

      const key = `project-viewed:${params.id}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // Storage can be unavailable (private mode); count the view anyway.
      }

      try {
        await updateDoc(doc(db, "projects", params.id), {
          views: increment(1),
        });
      } catch (error) {
        logger.error("Error incrementing views:", error);
      }
    };

    incrementViews();
  }, [project, params.id]);

  const showStatus = (status) => {
    setActionStatus(status);
    setTimeout(() => setActionStatus(null), 4000);
  };

  const handleLike = async () => {
    if (!user || !project) return;

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
      showStatus("likeError");
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!user || !newComment.trim() || sending) return;

    setSending(true);
    setCommentError(null);
    try {
      const comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        userId: user.uid,
        userName: profile?.name || user.displayName || user.email,
        userPhoto: profile?.photoURL || user.photoURL || "",
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "projects", params.id), {
        comments: arrayUnion(comment),
      });

      setProject((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
      }));

      // The new comment appearing at the top of the list is the confirmation.
      setNewComment("");
    } catch (error) {
      logger.error("Error adding comment:", error);
      setCommentError(copy.commentError);
    } finally {
      setSending(false);
    }
  };

  const projectTitle = getLocalizedField(project, "title", locale);
  const projectDescription = getLocalizedField(project, "description", locale);
  const sortedComments = [...(project?.comments || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: projectTitle, url: window.location.href });
      } catch {
        // Closing the share sheet rejects too; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      showStatus("copied");
    } catch {
      showStatus("copyFailed");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <p role="status" className="text-ink-2">{copy.loading}</p>
        <div className="mt-6 space-y-4" aria-hidden="true">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="aspect-[16/9] w-full max-w-3xl" />
        </div>
      </PageContainer>
    );
  }

  if (notFound || !project) {
    return (
      <PageContainer>
        <EmptyState
          title={copy.notFound}
          action={
            <Link href="/projects" className={textLink}>
              {copy.backToProjects}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const isLiked = Boolean(user && project.likes?.includes(user.uid));
  const likeCount = (
    <span className="font-outlier tabular-nums">
      {project.likes?.length || 0}
      <span className="sr-only"> {copy.likes}</span>
    </span>
  );

  const actions = (
    <>
      {user ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleLike}
          aria-pressed={isLiked}
          className={isLiked ? "border-error text-error" : undefined}
        >
          <Heart className={isLiked ? "fill-current" : undefined} aria-hidden="true" />
          {likeCount}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={loginHref(`/projects/${params.id}`)} title={copy.signInToLike}>
            <Heart aria-hidden="true" />
            {likeCount}
            <span className="sr-only">{copy.signInToLike}</span>
          </Link>
        </Button>
      )}

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

  const status = (
    <p role="status" className="min-h-[1lh] text-sm text-ink-2">
      {actionStatus && copy[actionStatus]}
    </p>
  );

  return (
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

          <div className="lg:hidden">
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
            {status}
          </div>

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
              {/* Names only: collaborators' e-mail addresses are not for a public page. */}
              <ul className="mt-2 divide-y divide-rule border-b border-rule">
                {project.collaborators.map((collab, index) => (
                  <li key={index} className="flex items-center gap-4 py-3">
                    <Avatar src={collab.photoURL} name={collab.name} className="h-10 w-10 shrink-0" />
                    <p className="min-w-0 truncate font-medium text-ink">
                      {collab.name || copy.unnamed}
                    </p>
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
                <Avatar
                  src={profile?.photoURL || user.photoURL}
                  name={profile?.name || user.displayName}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(event) => {
                      setNewComment(event.target.value);
                      setCommentError(null);
                    }}
                    placeholder={copy.commentPlaceholder}
                    aria-label={copy.commentLabel}
                    aria-invalid={commentError ? true : undefined}
                    aria-describedby="project-comment-error"
                    rows={3}
                  />
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <p id="project-comment-error" role="alert" className="text-sm text-error">
                      {commentError}
                    </p>
                    <Button type="submit" loading={sending} disabled={!newComment.trim()}>
                      {copy.commentButton}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="mt-4 border-y border-rule py-4 text-ink-2">
                <Link href={loginHref(`/projects/${params.id}`)} className={textLink}>
                  {copy.signInNotice}
                </Link>
              </p>
            )}

            <div className="mt-6">
              {sortedComments.length > 0 ? (
                <ul className="divide-y divide-rule border-y border-rule">
                  {sortedComments.map((comment) => (
                    <li key={comment.id} className="flex gap-3 py-4">
                      <Avatar src={comment.userPhoto} name={comment.userName} className="h-8 w-8 shrink-0 text-sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                          <span className="text-sm font-semibold text-ink">
                            {comment.userName}
                          </span>
                          <time
                            dateTime={comment.createdAt}
                            className="font-outlier text-xs text-muted-foreground"
                          >
                            {formatLocalizedDate(
                              comment.createdAt,
                              locale,
                              withYearIfNotCurrent(comment.createdAt, {
                                month: "short",
                                day: "numeric",
                              })
                            )}
                          </time>
                        </div>
                        <p className="mt-1 max-w-measure whitespace-pre-wrap break-words text-ink-2">
                          {comment.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={copy.noComments} />
              )}
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <div>
              <div className="flex flex-col items-stretch gap-3 [&>*]:w-full">{actions}</div>
              {status}
            </div>

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
  );
}
