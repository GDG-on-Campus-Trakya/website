'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from "@/i18n/navigation";
import { Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function FeaturedAnnouncementCard({ announcement }) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm');
    } catch (error) {
      return 'Tarih yok';
    }
  };

  const handleCardClick = () => {
    router.push(`/announcements/${announcement.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group mb-12 grid cursor-pointer grid-cols-1 items-start gap-6 border-t-2 border-ink pt-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8"
    >
      {/* Image Section */}
      {announcement.imageUrl && !imageError && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-paper-2">
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Content Section */}
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-ink-2">Öne Çıkan Duyuru</span>
        {/* Title */}
        <h2 className="mt-2 line-clamp-3 break-words font-display text-2xl font-bold lg:text-3xl group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
          {announcement.title}
        </h2>

        {/* Meta Info */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className="font-outlier">{formatDate(announcement.createdAt)}</span>
          </div>
          {announcement.authorName && (
            <div className="flex min-w-0 items-center gap-2">
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-words">{announcement.authorName}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 line-clamp-4 max-w-measure text-ink-2">
          {announcement.description || announcement.content}
        </p>

        {/* Footer */}
        <div className="mt-5 inline-flex min-h-11 items-center gap-1 whitespace-nowrap font-medium text-brand underline decoration-1 underline-offset-4 group-hover:decoration-2">
          Devamını Oku
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
