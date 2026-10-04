'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  formatLocalizedDate,
  getLocalizedField,
  withYearIfNotCurrent
} from '@/utils/localeUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COPY = {
  tr: { draft: 'Taslak', edit: 'Düzenle', delete: 'Sil' },
  en: { draft: 'Draft', edit: 'Edit', delete: 'Delete' }
};

// The title link stretches over the whole card, so the card opens like a link (new tab with
// a middle click, keyboard focus on one stop) while the admin buttons stay above it.
export default function AnnouncementPostCard({
  announcement,
  onEdit,
  onDelete,
  showAdminActions = false,
  featured = false
}) {
  const [imageError, setImageError] = useState(false);
  const locale = useLocale();
  const copy = COPY[locale === 'en' ? 'en' : 'tr'];

  const title = getLocalizedField(announcement, 'title', locale);
  const description =
    getLocalizedField(announcement, 'description', locale) ||
    getLocalizedField(announcement, 'content', locale);

  const date = announcement.createdAt
    ? formatLocalizedDate(
        announcement.createdAt,
        locale,
        withYearIfNotCurrent(announcement.createdAt, {
          timeZone: 'Europe/Istanbul',
          day: 'numeric',
          month: 'long'
        })
      )
    : null;

  const href = `/announcements/${announcement.docId ?? announcement.id}`;
  const showImage = announcement.imageUrl && !imageError;

  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col border-t-2 border-ink pt-4 ${
        featured && showImage ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8' : ''
      }`}
    >
      {showImage && (
        <div
          className={`relative aspect-[16/9] w-full overflow-hidden rounded bg-paper-2 ${
            featured ? 'md:aspect-[4/3]' : ''
          }`}
        >
          <Image
            src={announcement.imageUrl}
            alt=""
            fill
            sizes={
              featured
                ? '(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw'
                : '(min-width: 1152px) 360px, (min-width: 768px) 50vw, 100vw'
            }
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className={`flex flex-grow flex-col ${showImage ? 'mt-4' : ''} ${featured ? 'md:mt-0' : ''}`}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {date && (
            <time dateTime={announcement.createdAt} className="font-outlier">
              {date}
            </time>
          )}
          {!announcement.isPublished && showAdminActions && (
            <Badge variant="warning">{copy.draft}</Badge>
          )}
        </p>

        <h3
          className={`mt-2 break-words font-display font-bold leading-tight ${
            featured ? 'text-2xl lg:text-3xl' : 'text-lg'
          }`}
        >
          <Link
            href={href}
            className="rounded-sm after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4"
          >
            {title}
          </Link>
        </h3>

        {description && (
          <p
            className={`mt-2 text-ink-2 ${
              featured ? 'line-clamp-5 text-base' : 'line-clamp-3 text-sm'
            }`}
          >
            {description}
          </p>
        )}

        {showAdminActions && (
          <div className="relative z-raised mt-auto flex gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => onEdit && onEdit(announcement)}>
              {copy.edit}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete && onDelete(announcement.id)}
            >
              <Trash2 aria-hidden="true" />
              {copy.delete}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
