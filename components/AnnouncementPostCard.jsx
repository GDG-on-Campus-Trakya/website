'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Calendar, User, Trash2, ArrowRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { formatLocalizedDate, getLocalizedField } from '@/utils/localeUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AnnouncementPostCard({
  announcement,
  onEdit,
  onDelete,
  showAdminActions = false,
  featured = false
}) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const copy =
    locale === 'en'
      ? {
          noDate: 'No date',
          draft: 'Draft',
          readMore: 'Read More',
          edit: 'Edit',
          delete: 'Delete'
        }
      : {
          noDate: 'Tarih yok',
          draft: 'Taslak',
          readMore: 'Devamını Oku',
          edit: 'Düzenle',
          delete: 'Sil'
        };

  const title = getLocalizedField(announcement, 'title', locale);
  const description =
    getLocalizedField(announcement, 'description', locale) ||
    getLocalizedField(announcement, 'content', locale);

  const formatDate = (dateString) => {
    if (!dateString) return copy.noDate;
    try {
      // In the page language and Turkish time, like every other date on the site
      return formatLocalizedDate(dateString, locale, {
        timeZone: 'Europe/Istanbul',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return copy.noDate;
    }
  };

  const href = `/announcements/${announcement.docId ?? announcement.id}`;

  const handleCardClick = (e) => {
    if (showAdminActions && e.target.closest('button')) {
      return;
    }
    router.push(href);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-rule bg-background transition-colors duration-micro ease-out hover:border-ink ${
        featured ? "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""
      }`}
    >
      {announcement.imageUrl && !imageError && (
        <div
          className={`relative aspect-[16/9] w-full overflow-hidden bg-paper-2 ${
            featured ? "md:aspect-auto md:h-full md:min-h-[18rem]" : ""
          }`}
        >
          <Image
            src={announcement.imageUrl}
            alt={title}
            fill
            sizes={
              featured
                ? "(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
                : "(min-width: 1152px) 360px, (min-width: 768px) 50vw, 100vw"
            }
            className="object-cover"
            onError={() => setImageError(true)}
          />
          {!announcement.isPublished && showAdminActions && (
            <Badge variant="warning" className="absolute right-3 top-3 z-raised">
              {copy.draft}
            </Badge>
          )}
        </div>
      )}

      <div className={`flex flex-grow flex-col p-5 ${featured ? "md:p-8" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className="font-outlier">{formatDate(announcement.createdAt)}</span>
          </div>
          {announcement.authorName && (
            <div className="flex min-w-0 items-center gap-1.5">
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-words">{announcement.authorName}</span>
            </div>
          )}
        </div>

        <h3
          className={`mb-3 line-clamp-2 break-words font-display font-bold group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4 ${
            featured ? "text-2xl lg:text-3xl" : "text-lg"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mb-4 flex-grow text-ink-2 ${
            featured ? "line-clamp-5 text-base" : "line-clamp-3 text-sm"
          }`}
        >
          {description}
        </p>

        <div className="mt-auto border-t border-rule pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* A real link so crawlers can follow it; the card click above is for mouse users */}
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-brand underline decoration-1 underline-offset-4 group-hover:decoration-2"
            >
              {copy.readMore}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {showAdminActions && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(announcement);
                  }}
                >
                  {copy.edit}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(announcement.id);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  {copy.delete}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
